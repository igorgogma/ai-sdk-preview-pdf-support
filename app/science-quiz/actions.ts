"use server";

import { z } from "zod";

// Define the schema for the quiz generation parameters
const quizParamsSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  subject: z.string().default("physics"),
  count: z.number().min(3).max(40).default(5),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  questionTypes: z.array(
    z.enum(["multiple-choice", "definition", "problem-solving"])
  ).min(1, "At least one question type is required"),
});

// Type for the quiz parameters
type QuizParams = z.infer<typeof quizParamsSchema>;

// Function to generate a science quiz
export async function generateScienceQuiz(params: QuizParams) {
  try {
    // Validate the parameters
    const validatedParams = quizParamsSchema.parse(params);

    // Call our API route with an absolute URL
    // For server actions, we need to use absolute URLs
    // Note: process.env.VERCEL_URL doesn't include the protocol
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'https://ib-dp-study-helper.vercel.app';

    console.log("Using base URL:", baseUrl);

    // For server-to-server requests, we need to add the appropriate headers
    // and handle cross-origin requests properly
    const response = await fetch(`${baseUrl}/api/generate-science-quiz`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization if needed
        ...(process.env.OPENROUTER_API_KEY && {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        }),
        // Add CORS headers
        "Origin": baseUrl,
      },
      // Important: include credentials for authenticated requests
      credentials: "include",
      body: JSON.stringify(validatedParams),
      // Add cache control to prevent caching issues
      cache: "no-store",
    });

    // Log the response for debugging
    console.log("API Response Status:", response.status, response.statusText);

    if (!response.ok) {
      // Try to get error data, but handle non-JSON responses
      let errorMessage = "Failed to generate quiz";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("API error:", errorData);
          errorMessage = errorData.error || errorMessage;
        } else {
          // If not JSON, get the text response
          const errorText = await response.text();
          console.error("API error (non-JSON):", errorText.substring(0, 500));
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    // Try to parse the JSON response with error handling
    let data;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // If not JSON, log and throw error
        const textResponse = await response.text();
        console.error("Unexpected non-JSON response:", textResponse.substring(0, 500));
        throw new Error("Server returned non-JSON response");
      }
    } catch (jsonError) {
      console.error("JSON parsing error:", jsonError);
      throw new Error("Failed to parse server response");
    }

    // Validate that we have questions
    if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
      console.error("Invalid response data:", data);
      throw new Error("No questions returned from API");
    }

    return {
      questions: data.questions,
      generationId: data.generationId
    };
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    throw new Error(error.message || "Failed to generate quiz");
  }
}

// Function to check generation progress
export async function checkGenerationProgress(generationId: string) {
  try {
    // Call our API route with an absolute URL
    // For server actions, we need to use absolute URLs
    // Note: process.env.VERCEL_URL doesn't include the protocol
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL || 'https://ib-dp-study-helper.vercel.app';

    console.log("Using base URL for progress check:", baseUrl);

    // For server-to-server requests, we need to add the appropriate headers
    // and handle cross-origin requests properly
    const response = await fetch(`${baseUrl}/api/check-generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Add authorization if needed
        ...(process.env.OPENROUTER_API_KEY && {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
        }),
        // Add CORS headers
        "Origin": baseUrl,
      },
      // Important: include credentials for authenticated requests
      credentials: "include",
      body: JSON.stringify({ generationId }),
      // Add cache control to prevent caching issues
      cache: "no-store",
    });

    // Log the response for debugging
    console.log("Check Progress API Response Status:", response.status, response.statusText);

    if (!response.ok) {
      // Try to get error data, but handle non-JSON responses
      let errorMessage = "Failed to check generation progress";
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("API error when checking progress:", errorData);
          errorMessage = errorData.error || errorMessage;
        } else {
          // If not JSON, get the text response
          const errorText = await response.text();
          console.error("API error when checking progress (non-JSON):", errorText.substring(0, 500));
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    // Try to parse the JSON response with error handling
    let data;
    try {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // If not JSON, log and throw error
        const textResponse = await response.text();
        console.error("Unexpected non-JSON response from progress check:", textResponse.substring(0, 500));
        throw new Error("Server returned non-JSON response for progress check");
      }
    } catch (jsonError) {
      console.error("JSON parsing error in progress check:", jsonError);
      throw new Error("Failed to parse server response for progress check");
    }
    return data;
  } catch (error: any) {
    console.error("Error checking generation progress:", error);
    throw new Error(error.message || "Failed to check generation progress");
  }
}

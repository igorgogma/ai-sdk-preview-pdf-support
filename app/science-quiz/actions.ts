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

    // For server actions, we need to use the absolute URL when running on the server
    // and a relative URL when running in the browser
    const baseUrl = typeof window === 'undefined'
      ? new URL('/api/generate-science-quiz', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString()
      : '/api/generate-science-quiz';

    console.log("Using URL for API call:", baseUrl);

    // Use the URL for the API endpoint
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validatedParams),
      // Add cache control to prevent caching issues
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        // Try to parse as JSON, but be prepared for HTML or other formats
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("API error:", errorData);
          errorMessage = errorData.error || errorMessage;
        } else {
          // If not JSON, just get the text
          const errorText = await response.text();
          console.error("API error (non-JSON):", errorText.substring(0, 200) + "...");
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

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
    // For server actions, we need to use the absolute URL when running on the server
    // and a relative URL when running in the browser
    const baseUrl = typeof window === 'undefined'
      ? new URL('/api/check-generation', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').toString()
      : '/api/check-generation';

    console.log("Using URL for progress check:", baseUrl);

    // Use the URL for the API endpoint
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ generationId }),
      // Add cache control to prevent caching issues
      cache: "no-store",
    });

    if (!response.ok) {
      let errorMessage = `Server error: ${response.status} ${response.statusText}`;
      try {
        // Try to parse as JSON, but be prepared for HTML or other formats
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          console.error("API error when checking progress:", errorData);
          errorMessage = errorData.error || errorMessage;
        } else {
          // If not JSON, just get the text
          const errorText = await response.text();
          console.error("API error when checking progress (non-JSON):", errorText.substring(0, 200) + "...");
        }
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("Error checking generation progress:", error);
    throw new Error(error.message || "Failed to check generation progress");
  }
}

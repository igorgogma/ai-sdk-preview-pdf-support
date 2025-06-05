"use server";

import { getLLMProvider } from "@/lib/llm-providers";


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
      throw new Error(`Failed to check generation progress: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error checking generation progress:", error);
    // Return the last known progress or a default value
    return {
      progress: 10, // Just show minimal progress
      status: "in_progress",
      statusMessage: "Checking generation progress..."
    };
  }
}

export const generateQuizTitle = async (file: string) => {
  try {
    // Get the LLM provider
    const llmProvider = await getLLMProvider();

    // Create a system prompt
    const systemPrompt = "You are a helpful assistant that generates concise titles for quizzes based on PDF file names.";

    // Create a user prompt
    const prompt = "Generate a title for a quiz based on the following (PDF) file name. Try and extract as much info from the file name as possible. If the file name is just numbers or incoherent, just return 'Quiz'. The title should be at most three words.\n\nFile name: " + file;

    // Generate content
    const response = await llmProvider.generateContent(prompt, systemPrompt, {
      temperature: 0.5,
      maxOutputTokens: 50,
      responseSchema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "A max three word title for the quiz based on the file provided as context"
          }
        },
        required: ["title"]
      }
    });

    // Parse the response
    const data = response.json();

    // Return the title
    return data.title || "Quiz";
  } catch (error) {
    console.error("Error generating quiz title:", error);
    return "Quiz"; // Fallback title
  }
};

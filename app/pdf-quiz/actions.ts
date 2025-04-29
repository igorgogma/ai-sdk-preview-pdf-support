"use server";

import { getLLMProvider } from "@/lib/llm-providers";


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

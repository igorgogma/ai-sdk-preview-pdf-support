// Remove the "use server" directive from this file since it's a utility library
// that will be used by both server and client components

import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the common interface for all LLM providers
export interface LLMProviderResponse {
  text: string;
  json: () => any;
  id?: string; // Optional ID for tracking generation progress
}

// Define the common interface for all LLM providers
export interface LLMProvider {
  generateContent: (prompt: string, systemPrompt: string, options?: any) => Promise<LLMProviderResponse>;
  streamContent?: (prompt: string, systemPrompt: string, options?: any) => Promise<ReadableStream>;
  checkGeneration?: (generationId: string) => Promise<any>;
}

// OpenRouter implementation
export class OpenRouterProvider implements LLMProvider {
  async generateContent(prompt: string, systemPrompt: string, options: any = {}): Promise<LLMProviderResponse> {
    console.log("Using OpenRouter API");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://ib-dp-study-helper.vercel.app",
        "X-Title": options.title || "IB Science Quiz Generator",
      },
      body: JSON.stringify({
        model: options.model || "meta-llama/llama-4-scout:free",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error:", errorData);
      throw new Error(`OpenRouter API error: ${errorData.error || "Unknown error"}`);
    }

    const data = await response.json();

    // Format the response to match our common interface
    return {
      text: data.choices[0]?.message?.content || "",
      json: () => {
        try {
          return JSON.parse(data.choices[0]?.message?.content || "{}");
        } catch (error) {
          console.error("Error parsing JSON from OpenRouter response:", error);
          return {};
        }
      },
      id: data.id // Include the generation ID from OpenRouter
    };
  }

  async checkGeneration(generationId: string): Promise<any> {
    const response = await fetch(`https://openrouter.ai/api/v1/generation?id=${generationId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://ib-dp-study-helper.vercel.app",
        "X-Title": "IB Science Quiz Generator",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouter API error when checking progress:", errorData);
      throw new Error(`OpenRouter API error: ${errorData.error || "Unknown error"}`);
    }

    return response.json();
  }
}

// Gemini implementation
export class GeminiProvider implements LLMProvider {
  private genAI: GoogleGenerativeAI;
  private streamingResponses: Map<string, {
    progress: number,
    content: string,
    isComplete: boolean,
    lastUpdated: number
  }>;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.streamingResponses = new Map();

    // Start a cleanup interval to remove old streaming responses
    setInterval(() => {
      const now = Date.now();
      for (const [id, data] of this.streamingResponses.entries()) {
        // Remove entries older than 5 minutes
        if (now - data.lastUpdated > 5 * 60 * 1000) {
          this.streamingResponses.delete(id);
        }
      }
    }, 60 * 1000); // Run cleanup every minute
  }

  async generateContent(prompt: string, systemPrompt: string, options: any = {}): Promise<LLMProviderResponse> {
    console.log("Using Gemini API");

    try {
      // Get the model
      const model = this.genAI.getGenerativeModel({
        model: options.model || "gemini-1.5-flash-001"
      });

      // Combine system prompt and user prompt
      const combinedPrompt = `${systemPrompt}\n\n${prompt}`;

      // Generate a unique ID for this request
      const generationId = `gemini-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Initialize the streaming response entry
      this.streamingResponses.set(generationId, {
        progress: 0,
        content: "",
        isComplete: false,
        lastUpdated: Date.now()
      });

      // Start streaming in the background
      this.streamContentInBackground(model, combinedPrompt, generationId, options);

      // Generate content (non-streaming for the actual response)
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: combinedPrompt }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 8192,
          responseSchema: options.responseSchema,
        },
      });

      // Mark the streaming as complete
      const streamingData = this.streamingResponses.get(generationId);
      if (streamingData) {
        streamingData.isComplete = true;
        streamingData.progress = 100;
        streamingData.lastUpdated = Date.now();
        this.streamingResponses.set(generationId, streamingData);
      }

      const response = result.response;
      const text = response.text();

      // For debugging
      console.log("Gemini response text (first 100 chars):", text.substring(0, 100));

      // Try to parse as JSON first
      try {
        const jsonData = JSON.parse(text);

        // Format the response to match our common interface
        return {
          text: text,
          json: () => jsonData,
          id: generationId // Add the generation ID to the response
        };
      } catch (error) {
        console.log("Response is not valid JSON, returning text format");

        // If not valid JSON, try to extract JSON from the text (in case it's wrapped in markdown)
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) ||
                         text.match(/```\n([\s\S]*?)\n```/) ||
                         text.match(/{[\s\S]*}/);

        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            return {
              text: text,
              json: () => extractedJson,
              id: generationId // Add the generation ID to the response
            };
          } catch (extractError) {
            console.error("Error parsing extracted JSON:", extractError);
          }
        }

        // Fallback to returning the text with a dummy json function
        return {
          text: text,
          json: () => ({
            choices: [{
              message: {
                content: text
              }
            }]
          }),
          id: generationId // Add the generation ID to the response
        };
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Gemini API error: ${error.message || "Unknown error"}`);
    }
  }

  // Check the generation progress
  async checkGeneration(generationId: string): Promise<any> {
    // Check if we have this generation ID in our map
    if (this.streamingResponses.has(generationId)) {
      const data = this.streamingResponses.get(generationId);

      // Update the last accessed time
      data.lastUpdated = Date.now();
      this.streamingResponses.set(generationId, data);

      // Return a response that matches the expected format
      return {
        progress: data.progress,
        status: data.isComplete ? "complete" : "in_progress",
        finish_reason: data.isComplete ? "stop" : null,
        choices: [
          {
            message: {
              content: data.content
            }
          }
        ],
        usage: {
          completion_tokens: data.content.length / 4, // Rough estimate
          total_tokens: 1000 // Placeholder
        }
      };
    } else {
      // If we don't have this ID, return a default response
      return {
        progress: 100, // Assume it's complete if we don't have it
        status: "complete",
        finish_reason: "stop",
        choices: [],
        usage: {
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  }

  // Stream content in the background to track progress
  private async streamContentInBackground(model: any, prompt: string, generationId: string, options: any = {}) {
    try {
      // Start streaming
      const streamingResponse = await model.generateContentStream({
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt }
            ]
          }
        ],
        generationConfig: {
          temperature: options.temperature || 0.7,
          topK: options.topK || 40,
          topP: options.topP || 0.95,
          maxOutputTokens: options.maxOutputTokens || 8192,
        },
      });

      let accumulatedText = "";
      let chunkCount = 0;
      const estimatedTotalChunks = 20; // This is an estimate, adjust based on your observations

      // Process each chunk as it arrives
      for await (const chunk of streamingResponse) {
        chunkCount++;

        // Get the text from the chunk
        const chunkText = chunk.text || "";
        accumulatedText += chunkText;

        // Calculate progress (this is an estimate)
        const progress = Math.min(95, Math.round((chunkCount / estimatedTotalChunks) * 100));

        // Update the streaming response entry
        this.streamingResponses.set(generationId, {
          progress,
          content: accumulatedText,
          isComplete: false,
          lastUpdated: Date.now()
        });
      }

      // Mark as complete when done
      this.streamingResponses.set(generationId, {
        progress: 100,
        content: accumulatedText,
        isComplete: true,
        lastUpdated: Date.now()
      });

    } catch (error) {
      console.error("Error in streaming content:", error);

      // Mark as complete with error
      const currentData = this.streamingResponses.get(generationId);
      if (currentData) {
        this.streamingResponses.set(generationId, {
          ...currentData,
          isComplete: true,
          progress: 100, // Mark as complete even on error
          lastUpdated: Date.now()
        });
      }
    }
  }
}

// Factory function to get the appropriate provider based on environment settings
export async function getLLMProvider(): Promise<LLMProvider> {
  // Force use Gemini for now
  const provider = "gemini";

  // Log the provider being used
  console.log(`Using LLM provider (forced): ${provider}`);

  // Create and return the appropriate provider
  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("Gemini API key not found, falling back to OpenRouter");
      return new OpenRouterProvider();
    }
    return new GeminiProvider();
  } else {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("OpenRouter API key not found, check your environment variables");
    }
    return new OpenRouterProvider();
  }
}

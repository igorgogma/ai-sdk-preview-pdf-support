// Remove the "use server" directive from this file since it's a utility library
// that will be used by both server and client components

import { GoogleGenerativeAI } from '@google/generative-ai';

// Define the common interface for all LLM providers
export interface LLMProviderResponse {
  text: string;
  json: () => any;
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
      }
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

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

      // Generate content
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
          json: () => jsonData
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
              json: () => extractedJson
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
          })
        };
      }
    } catch (error) {
      console.error("Gemini API error:", error);
      throw new Error(`Gemini API error: ${error.message || "Unknown error"}`);
    }
  }
}

// Factory function to get the appropriate provider based on environment settings
export async function getLLMProvider(): Promise<LLMProvider> {
  // First check environment variable
  let provider = process.env.LLM_PROVIDER?.toLowerCase() || "openrouter";

  // Log the provider being used
  console.log(`Using LLM provider from environment: ${provider}`);

  // Create and return the appropriate provider
  switch (provider) {
    case "gemini":
      if (!process.env.GEMINI_API_KEY) {
        console.warn("Gemini API key not found, falling back to OpenRouter");
        return new OpenRouterProvider();
      }
      return new GeminiProvider();
    case "openrouter":
    default:
      if (!process.env.OPENROUTER_API_KEY) {
        console.warn("OpenRouter API key not found, check your environment variables");
      }
      return new OpenRouterProvider();
  }
}

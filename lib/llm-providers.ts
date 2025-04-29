// Remove the "use server" directive from this file since it's a utility library
// that will be used by both server and client components

import Replicate from 'replicate';

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

// Replicate implementation
export class ReplicateProvider implements LLMProvider {
  private replicate: Replicate;
  private activeGenerations: Map<string, {
    progress: number,
    content: string,
    isComplete: boolean,
    lastUpdated: number,
    replicatePredictionId?: string
  }>;

  constructor() {
    this.replicate = new Replicate({
      auth: process.env.REPLICATE_API_KEY,
    });
    this.activeGenerations = new Map();

    // Start a cleanup interval to remove old generation data
    setInterval(() => {
      const now = Date.now();
      for (const [id, data] of this.activeGenerations.entries()) {
        // Remove entries older than 5 minutes
        if (now - data.lastUpdated > 5 * 60 * 1000) {
          this.activeGenerations.delete(id);
        }
      }
    }, 60 * 1000); // Run cleanup every minute
  }

  async generateContent(prompt: string, systemPrompt: string, options: any = {}): Promise<LLMProviderResponse> {
    console.log("Using Replicate API");

    try {
      // leg
      const model = options.model || "anthropic/claude-3.7-sonnet";

      // Generate a unique ID for this request
      const generationId = `replicate-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      // Initialize the generation entry
      this.activeGenerations.set(generationId, {
        progress: 0,
        content: "",
        isComplete: false,
        lastUpdated: Date.now()
      });

      // Create input with system prompt and user prompt
      const input = {
        prompt: `${systemPrompt}\n\n${prompt}`,
        system_prompt: systemPrompt,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.95,
        max_tokens: options.maxOutputTokens || 4096,
        prompt_template: "{system_prompt}\n\n{prompt}"
      };

      // Start a prediction and get the ID
      const prediction = await this.replicate.predictions.create({
        version: model.includes(":") ? model.split(":")[1] : model,
        input: input,
      });

      // Store the prediction ID
      const currentData = this.activeGenerations.get(generationId);
      if (currentData) {
        this.activeGenerations.set(generationId, {
          ...currentData,
          replicatePredictionId: prediction.id,
          lastUpdated: Date.now()
        });
      }

      // Wait for the prediction to complete
      const result = await this.replicate.wait(prediction);

      // Mark the generation as complete
      const generationData = this.activeGenerations.get(generationId);
      if (generationData) {
        this.activeGenerations.set(generationId, {
          progress: 100,
          content: typeof result.output === 'string' ? result.output : JSON.stringify(result.output),
          isComplete: true,
          lastUpdated: Date.now(),
          replicatePredictionId: prediction.id
        });
      }

      // Get the output text
      let outputText = "";
      if (Array.isArray(result.output)) {
        // If output is an array of strings, join them
        outputText = result.output.join("");
      } else if (typeof result.output === 'string') {
        // If output is a string, use it directly
        outputText = result.output;
      } else {
        // If output is an object or other type, stringify it
        outputText = JSON.stringify(result.output);
      }

      // For debugging
      console.log("Replicate response text (first 100 chars):", outputText.substring(0, 100));

      // Try to parse as JSON first
      try {
        // Check if the output is already a JSON object
        const jsonData = typeof result.output === 'object' && result.output !== null
          ? result.output
          : JSON.parse(outputText);

        // Format the response to match our common interface
        return {
          text: outputText,
          json: () => jsonData,
          id: generationId
        };
      } catch (error) {
        console.log("Response is not valid JSON, returning text format");

        // If not valid JSON, try to extract JSON from the text (in case it's wrapped in markdown)
        const jsonMatch = outputText.match(/```json\n([\s\S]*?)\n```/) ||
                         outputText.match(/```\n([\s\S]*?)\n```/) ||
                         outputText.match(/{[\s\S]*}/);

        if (jsonMatch) {
          try {
            const extractedJson = JSON.parse(jsonMatch[1] || jsonMatch[0]);
            return {
              text: outputText,
              json: () => extractedJson,
              id: generationId
            };
          } catch (extractError) {
            console.error("Error parsing extracted JSON:", extractError);
          }
        }

        // Fallback to returning the text with a dummy json function
        return {
          text: outputText,
          json: () => ({
            choices: [{
              message: {
                content: outputText
              }
            }]
          }),
          id: generationId
        };
      }
    } catch (error: any) {
      console.error("Replicate API error:", error);
      throw new Error(`Replicate API error: ${error?.message || "Unknown error"}`);
    }
  }

  // Check the generation progress
  async checkGeneration(generationId: string): Promise<any> {
    // Check if we have this generation ID in our map
    if (this.activeGenerations.has(generationId)) {
      const data = this.activeGenerations.get(generationId)!;

      // Update the last accessed time
      data.lastUpdated = Date.now();

      // If we have a Replicate prediction ID, check the actual progress
      if (data.replicatePredictionId && !data.isComplete) {
        try {
          const prediction = await this.replicate.predictions.get(data.replicatePredictionId);

          // Update progress based on status
          let progress = data.progress;

          if (prediction.status === "succeeded") {
            progress = 100;
            data.isComplete = true;
            data.content = typeof prediction.output === 'string'
              ? prediction.output
              : JSON.stringify(prediction.output);
          } else if (prediction.status === "processing") {
            // Estimate progress based on logs if available
            if (prediction.logs) {
              // Count the number of log lines as a rough progress indicator
              const logLines = prediction.logs.split('\n').filter(line => line.trim().length > 0);
              progress = Math.min(95, Math.max(data.progress, Math.round((logLines.length / 20) * 100)));
            } else {
              // If no logs, increment progress slightly
              progress = Math.min(90, data.progress + 5);
            }
          } else if (prediction.status === "starting") {
            progress = Math.min(30, data.progress + 5);
          } else if (prediction.status === "failed") {
            progress = 100;
            data.isComplete = true;
          }

          // Update the data
          this.activeGenerations.set(generationId, {
            progress,
            content: data.content,
            isComplete: data.isComplete,
            lastUpdated: Date.now(),
            replicatePredictionId: data.replicatePredictionId
          });
        } catch (error) {
          console.error("Error checking Replicate prediction:", error);
        }
      }

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
}

// Factory function to get the appropriate provider based on environment settings
export async function getLLMProvider(): Promise<LLMProvider> {
  // Force use Replicate for now
  const provider = "replicate";

  // Log the provider being used
  console.log(`Using LLM provider (forced): ${provider}`);

  // Create and return the appropriate provider
  if (provider === "replicate") {
    if (!process.env.REPLICATE_API_KEY) {
      console.warn("Replicate API key not found, falling back to OpenRouter");
      return new OpenRouterProvider();
    }
    return new ReplicateProvider();
  } else if (provider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("OpenRouter API key not found, check your environment variables");
      throw new Error("OpenRouter API key not found");
    }
    return new OpenRouterProvider();
  } else {
    console.warn(`Unknown provider "${provider}", falling back to Replicate`);
    if (!process.env.REPLICATE_API_KEY) {
      console.warn("Replicate API key not found, falling back to OpenRouter");
      return new OpenRouterProvider();
    }
    return new ReplicateProvider();
  }
}

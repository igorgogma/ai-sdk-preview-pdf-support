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
    replicatePredictionId?: string,
    statusMessage?: string
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
      const model = options.model || "anthropic/claude-3.5-sonnet";

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
          // Get the prediction from Replicate API
          const prediction = await this.replicate.predictions.get(data.replicatePredictionId);

          // Update progress based on status
          let progress = data.progress;
          let statusMessage = "";

          // Handle different prediction statuses
          switch (prediction.status) {
            case "succeeded":
              progress = 100;
              data.isComplete = true;
              statusMessage = "Generation complete";
              data.content = typeof prediction.output === 'string'
                ? prediction.output
                : JSON.stringify(prediction.output);
              break;

            case "processing":
              // More accurate progress tracking based on logs
              if (prediction.logs) {
                const logLines = prediction.logs.split('\n').filter(line => line.trim().length > 0);

                // Look for progress indicators in the logs
                const progressIndicator = logLines.find(line =>
                  line.includes("progress:") ||
                  line.includes("step") ||
                  line.includes("iteration")
                );

                if (progressIndicator) {
                  // Try to extract numeric progress if available
                  const progressMatch = progressIndicator.match(/(\d+)%/) ||
                                       progressIndicator.match(/progress:\s*(\d+)/) ||
                                       progressIndicator.match(/step\s*(\d+)/i);

                  if (progressMatch && progressMatch[1]) {
                    const extractedProgress = parseInt(progressMatch[1], 10);
                    if (!isNaN(extractedProgress)) {
                      // Scale the progress to be between 30-95%
                      progress = Math.min(95, Math.max(30, extractedProgress));
                    }
                  }
                } else {
                  // If no specific progress indicator, use log line count as a heuristic
                  // More sophisticated models typically output more log lines
                  const estimatedTotalLines = prediction.model.includes("llama-3-70b") ? 40 :
                                             prediction.model.includes("claude") ? 30 : 20;

                  progress = Math.min(95, Math.max(30, Math.round((logLines.length / estimatedTotalLines) * 100)));
                }

                // Extract the latest log line for status message
                statusMessage = logLines[logLines.length - 1] || "Processing";
              } else {
                // If no logs, use time-based progress estimation
                const startTime = new Date(prediction.created_at).getTime();
                const currentTime = Date.now();
                const elapsedSeconds = (currentTime - startTime) / 1000;

                // Estimate based on model type - larger models take longer
                const estimatedTotalSeconds = prediction.model.includes("llama-3-70b") ? 60 :
                                             prediction.model.includes("claude") ? 45 : 30;

                progress = Math.min(95, Math.max(30, Math.round((elapsedSeconds / estimatedTotalSeconds) * 100)));
                statusMessage = "Processing your request";
              }
              break;

            case "starting":
              // Starting phase - progress between 5-30%
              const startTime = new Date(prediction.created_at).getTime();
              const currentTime = Date.now();
              const elapsedSeconds = (currentTime - startTime) / 1000;

              // Gradually increase from 5% to 30% over 10 seconds
              progress = Math.min(30, 5 + Math.round((elapsedSeconds / 10) * 25));
              statusMessage = "Starting generation";
              break;

            case "failed":
              progress = 100;
              data.isComplete = true;
              statusMessage = "Generation failed";
              data.content = typeof prediction.error === 'string'
                ? prediction.error
                : "An error occurred during generation";
              break;

            case "canceled":
              progress = 100;
              data.isComplete = true;
              statusMessage = "Generation was canceled";
              break;

            default:
              // For any other status, increment progress slightly
              progress = Math.min(95, data.progress + 5);
              statusMessage = `Status: ${prediction.status}`;
          }

          // Update the data in our map
          this.activeGenerations.set(generationId, {
            progress,
            content: data.content,
            isComplete: data.isComplete,
            lastUpdated: Date.now(),
            replicatePredictionId: data.replicatePredictionId,
            statusMessage
          });

          console.log(`Progress for ${generationId}: ${progress}% - ${statusMessage}`);
        } catch (error) {
          console.error("Error checking Replicate prediction:", error);
          // On error, increment progress slightly but don't complete
          const progress = Math.min(95, data.progress + 2);
          this.activeGenerations.set(generationId, {
            ...data,
            progress,
            lastUpdated: Date.now()
          });
        }
      }

      // Get the updated data
      const updatedData = this.activeGenerations.get(generationId)!;

      // Return a response that matches the expected format
      return {
        progress: updatedData.progress,
        status: updatedData.isComplete ? "complete" : "in_progress",
        finish_reason: updatedData.isComplete ? "stop" : null,
        statusMessage: updatedData.statusMessage || "",
        choices: [
          {
            message: {
              content: updatedData.content
            }
          }
        ],
        usage: {
          completion_tokens: updatedData.content.length / 4, // Rough estimate
          total_tokens: 1000 // Placeholder
        }
      };
    } else {
      // If we don't have this ID, return a default response
      return {
        progress: 100, // Assume it's complete if we don't have it
        status: "complete",
        finish_reason: "stop",
        statusMessage: "Generation complete (no tracking data available)",
        choices: [],
        usage: {
          completion_tokens: 0,
          total_tokens: 0
        }
      };
    }
  }
}

// XenAI Provider implementation
export class XenAIProvider implements LLMProvider {
  async generateContent(prompt: string, systemPrompt: string, options: any = {}): Promise<LLMProviderResponse> {
    console.log("Using XenAI API");

    const response = await fetch("https://chat.xenai.tech/api/v1/chat/completions", { // Corrected API endpoint
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer sk-5ad27f6acd924307b264d1e74673dbc9`, // API Key
      },
      body: JSON.stringify({
        model: options.model || "gemini-2.5-flash-preview-05-20", // Model
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("XenAI API error:", errorData);
      throw new Error(`XenAI API error: ${errorData.error?.message || "Unknown error"}`);
    }

    const data = await response.json();

    // Format the response to match our common interface
    return {
      text: data.choices[0]?.message?.content || "",
      json: () => {
        try {
          return JSON.parse(data.choices[0]?.message?.content || "{}");
        } catch (error) {
          console.error("Error parsing JSON from XenAI response:", error);
          return {};
        }
      },
      id: data.id // Include the generation ID from XenAI if available
    };
  }

  // streamContent and checkGeneration can be added if XenAI supports them
  // For now, leave them undefined or implement basic versions if necessary.
}

// Factory function to get the appropriate provider based on environment settings
export async function getLLMProvider(): Promise<LLMProvider> {
  const rawProviderEnv = process.env.LLM_PROVIDER?.toLowerCase();
  let effectiveProvider: string;

  if (rawProviderEnv === "replicate" || !rawProviderEnv) {
    effectiveProvider = "xenai";
    if (rawProviderEnv === "replicate") {
      console.log("LLM_PROVIDER environment variable was 'replicate', overriding to 'xenai' as per current policy.");
    } else if (!rawProviderEnv) {
      console.log("LLM_PROVIDER environment variable is not set, defaulting to 'xenai'.");
    }
  } else if (rawProviderEnv === "openrouter" || rawProviderEnv === "xenai") {
    effectiveProvider = rawProviderEnv;
  } else {
    // Any other unrecognized value in LLM_PROVIDER
    console.warn(`Unsupported LLM_PROVIDER environment variable value: '${process.env.LLM_PROVIDER}'. Defaulting to XenAI.`);
    effectiveProvider = "xenai";
  }

  console.log(`Effective LLM provider set to: ${effectiveProvider}`);

  if (effectiveProvider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      console.warn("OpenRouter API key (OPENROUTER_API_KEY) not found in environment variables. Falling back to XenAI.");
      console.log("Instantiating XenAI Provider due to missing OpenRouter key.");
      return new XenAIProvider();
    }
    console.log("Instantiating OpenRouter Provider.");
    return new OpenRouterProvider();
  } else { // This covers "xenai" and any fallbacks to xenai from other conditions
    console.log("Instantiating XenAI Provider.");
    return new XenAIProvider();
  }
}

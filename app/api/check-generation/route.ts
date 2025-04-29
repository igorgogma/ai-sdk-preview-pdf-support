import { NextResponse } from "next/server";
import { z } from "zod";
import { getLLMProvider } from "@/lib/llm-providers";

// Define the schema for the generation check parameters
const generationCheckSchema = z.object({
  generationId: z.string().min(1, "Generation ID is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { generationId } = generationCheckSchema.parse(body);

    // Get the appropriate LLM provider
    const llmProvider = await getLLMProvider();

    // Check if the generation ID is a mock ID
    if (generationId.startsWith('mock-')) {
      // For mock IDs, simulate progress based on time elapsed
      const mockTimestamp = parseInt(generationId.split('-')[1], 10);
      const currentTime = Date.now();
      const elapsedSeconds = (currentTime - mockTimestamp) / 1000;

      // Calculate progress based on elapsed time (complete in 5 seconds)
      const progress = Math.min(100, Math.round((elapsedSeconds / 5) * 100));
      const isComplete = progress >= 100;

      return NextResponse.json({
        progress,
        status: isComplete ? "complete" : "in_progress",
        statusMessage: isComplete ? "Generation complete" : "Generating quiz...",
        finish_reason: isComplete ? "stop" : null
      });
    }

    // Check if the provider supports generation checking
    if (!llmProvider.checkGeneration) {
      // If the provider doesn't support generation checking (e.g., Gemini),
      // return a fixed progress value
      return NextResponse.json({
        progress: 50,
        status: "in_progress",
        statusMessage: "Generation in progress (progress tracking not supported by this provider)",
        data: { supported: false }
      });
    }

    // Call the provider's generation check method
    try {
      const data = await llmProvider.checkGeneration(generationId);

      // Use the progress directly from the provider's response if available
      let progress = data.progress || 0;
      let statusMessage = data.statusMessage || "";

      // If no progress is provided, calculate it based on the response
      if (!data.progress) {
        if (data.finish_reason) {
          // Generation is complete
          progress = 100;
          statusMessage = "Generation complete";
        } else if (data.choices && data.choices.length > 0) {
          // Generation is in progress - estimate based on tokens
          if (data.usage && data.usage.completion_tokens && data.usage.total_tokens) {
            // Calculate progress based on token usage
            progress = Math.min(95, Math.round((data.usage.completion_tokens / data.usage.total_tokens) * 100));
            statusMessage = "Processing content...";
          } else {
            // If token information is not available, use a default progress
            progress = 50;
            statusMessage = "Generating content...";
          }
        } else {
          // Generation has started but no choices yet
          progress = 20;
          statusMessage = "Starting generation...";
        }
      }

      return NextResponse.json({
        progress,
        status: data.finish_reason || progress >= 100 ? "complete" : "in_progress",
        statusMessage,
        ...data
      });
    } catch (error) {
      console.error("Error in provider's generation check:", error);
      // If the provider's check fails, return a fixed progress value
      return NextResponse.json({
        progress: 50,
        status: "in_progress",
        statusMessage: "Checking generation progress...",
        error: "Provider check failed"
      });
    }
  } catch (error) {
    console.error("Error checking generation status:", error);
    return NextResponse.json({
      error: "Failed to check generation status",
      progress: 10,
      status: "in_progress",
      statusMessage: "Error checking generation status"
    }, { status: 500 });
  }
}

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

    // Check if the provider supports generation checking
    if (!llmProvider.checkGeneration) {
      // If the provider doesn't support generation checking (e.g., Gemini),
      // return a simulated progress
      const simulatedProgress = Math.min(100, Math.floor(Math.random() * 30) + 70); // 70-100% progress

      return NextResponse.json({
        progress: simulatedProgress,
        status: simulatedProgress === 100 ? "complete" : "in_progress",
        data: { simulated: true }
      });
    }

    // Call the provider's generation check method
    try {
      const data = await llmProvider.checkGeneration(generationId);

      // Calculate progress based on the response
      // This is a simplified approach - in a real app, you might have more sophisticated logic
      let progress = 0;

      if (data.finish_reason) {
        // Generation is complete
        progress = 100;
      } else if (data.choices && data.choices.length > 0) {
        // Generation is in progress - estimate based on tokens
        if (data.usage && data.usage.completion_tokens && data.usage.total_tokens) {
          // Calculate progress based on token usage
          progress = Math.min(95, Math.round((data.usage.completion_tokens / data.usage.total_tokens) * 100));
        } else {
          // If token information is not available, use a default progress
          progress = 50;
        }
      } else {
        // Generation has started but no choices yet
        progress = 20;
      }

      return NextResponse.json({
        progress,
        status: data.finish_reason ? "complete" : "in_progress",
        data
      });
    } catch (error) {
      console.error("Error in provider's generation check:", error);
      // If the provider's check fails, return a simulated progress
      const simulatedProgress = Math.min(100, Math.floor(Math.random() * 30) + 70);

      return NextResponse.json({
        progress: simulatedProgress,
        status: simulatedProgress === 100 ? "complete" : "in_progress",
        data: { simulated: true, error: "Provider check failed" }
      });
    }
  } catch (error) {
    console.error("Error checking generation status:", error);
    return NextResponse.json(
      { error: "Failed to check generation status", progress: 0 },
      { status: 500 }
    );
  }
}

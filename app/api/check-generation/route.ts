import { NextResponse } from "next/server";
import { z } from "zod";

// Define the schema for the generation check parameters
const generationCheckSchema = z.object({
  generationId: z.string().min(1, "Generation ID is required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { generationId } = generationCheckSchema.parse(body);

    // Call OpenRouter API to check generation status
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
      console.error("OpenRouter API error when checking generation:", errorData);
      return NextResponse.json(
        { error: "Failed to check generation status" },
        { status: response.status }
      );
    }

    const data = await response.json();

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
    console.error("Error checking generation status:", error);
    return NextResponse.json(
      { error: "Failed to check generation status", progress: 0 },
      { status: 500 }
    );
  }
}

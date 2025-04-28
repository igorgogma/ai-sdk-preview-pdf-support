import { NextResponse } from "next/server";
import { z } from "zod";

// Define the schema for the search parameters
const searchParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  subject: z.string().default("physics"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedParams = searchParamsSchema.parse(body);

    // Construct a more specific search query based on the subject
    const enhancedQuery = `${validatedParams.query} in ${validatedParams.subject} IB curriculum`;

    // Call the Exa API
    const response = await fetch("https://api.exa.ai/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.EXA_API_KEY || "",
      },
      body: JSON.stringify({
        query: enhancedQuery,
        numResults: 5,
        useAutoprompt: true,
        type: "keyword",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Exa API error:", errorData);
      return NextResponse.json(
        { error: "Failed to search for information" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error searching for information:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search for information" },
      { status: 500 }
    );
  }
}

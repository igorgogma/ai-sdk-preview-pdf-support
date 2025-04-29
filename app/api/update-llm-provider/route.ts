import { NextResponse } from "next/server";
import { z } from "zod";
import fs from "fs";
import path from "path";

// Define the schema for the provider update parameters
const providerUpdateSchema = z.object({
  provider: z.enum(["openrouter", "replicate"]),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { provider } = providerUpdateSchema.parse(body);

    // In a production environment, you would use a more robust way to update environment variables
    // For this demo, we'll update the .env.local file directly
    // Note: This approach works for development but not in production deployments like Vercel

    try {
      // Read the current .env.local file
      const envPath = path.join(process.cwd(), ".env.local");

      // Check if file exists and is readable
      if (!fs.existsSync(envPath)) {
        console.error("Error: .env.local file not found");
        // Just update the environment variable in memory
        process.env.LLM_PROVIDER = provider;
        return NextResponse.json({
          success: true,
          message: `LLM provider updated to ${provider} (in memory only)`
        });
      }

      let envContent = fs.readFileSync(envPath, "utf8");

      // Update the LLM_PROVIDER value
      const newEnvContent = envContent.replace(
        /LLM_PROVIDER=\w+/,
        `LLM_PROVIDER=${provider}`
      );

      // Only write if the content actually changed
      if (newEnvContent !== envContent) {
        // Write the updated content back to the file
        fs.writeFileSync(envPath, newEnvContent);
      }
    } catch (fsError) {
      console.error("File system error:", fsError);
      // Continue with in-memory update even if file update fails
    }

    // Update the environment variable in the current process
    process.env.LLM_PROVIDER = provider;

    return NextResponse.json({
      success: true,
      message: `LLM provider updated to ${provider}`
    });
  } catch (error) {
    console.error("Error updating LLM provider:", error);
    return NextResponse.json(
      { error: "Failed to update LLM provider" },
      { status: 500 }
    );
  }
}

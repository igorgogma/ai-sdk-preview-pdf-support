import { NextResponse } from "next/server";
import { z } from "zod";
// import { longAnswerQuestionSchema } from "@/lib/schemas"; // Removed as it's no longer available
import { getLLMProvider, LLMProviderResponse } from "@/lib/llm-providers";

// Define a local schema for questionDetails as longAnswerQuestionSchema is removed
const localQuestionDetailsSchema = z.object({
  question: z.string(),
  gradingCriteria: z.string().optional(),
});

// Define the schema for the grading submission
const gradeSubmissionSchema = z.object({
  questionId: z.string().optional(), // ID of the question being answered
  questionDetails: localQuestionDetailsSchema.optional(), // Or full question object
  userAnswer: z.string().min(1, "User answer cannot be empty."),
});

// Define the expected response structure from the LLM
const llmGradingResponseSchema = z.object({
  score: z.number().min(0).max(100), // Score as a percentage or on a 0-10 scale, adjust as needed
  feedback: z.string(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedSubmission = gradeSubmissionSchema.parse(body);

    const { questionDetails, userAnswer } = validatedSubmission;

    if (!questionDetails) {
      return NextResponse.json(
        { message: "Question details are required for grading." },
        { status: 400 }
      );
    }

    const originalQuestion = questionDetails.question;
    const gradingCriteria = questionDetails.gradingCriteria; // This might contain an ideal answer or specific criteria

    const systemPrompt = `You are an AI grading assistant. Your task is to evaluate a user's answer to a question.
If grading criteria or an ideal answer are provided, use them as the primary basis for your evaluation.
Provide a numerical score between 0 and 100 (inclusive), where 0 is a completely incorrect answer and 100 is a perfect answer.
Also, provide concise textual feedback explaining the score, highlighting correct points, and suggesting areas for improvement if any.
Respond in JSON format with the following structure: { "score": number, "feedback": "string" }.`;

    let userPromptContent = `Please grade the following user answer:

Question:
${originalQuestion}

User's Answer:
${userAnswer}`;

    if (gradingCriteria && gradingCriteria.trim() !== "") {
      userPromptContent += `

Reference for Grading (this could be an ideal answer, key points, or specific criteria to look for):
${gradingCriteria}`;
    }

    userPromptContent += `

Provide your grading (score and feedback) in the specified JSON format.`;

    try {
      const llm = await getLLMProvider();
      console.log("Sending grading request to LLM...");
      const llmResponse: LLMProviderResponse = await llm.generateContent(
        userPromptContent,
        systemPrompt,
        {
          // For OpenRouter, this helps ensure JSON output
          // For other providers, it might be ignored or need different handling
          response_format: { type: "json_object" }
        }
      );

      console.log("LLM Raw Response Text:", llmResponse.text);
      let parsedGradingResult;
      try {
        parsedGradingResult = llmGradingResponseSchema.parse(llmResponse.json());
      } catch (parseError) {
         console.error("Failed to parse LLM JSON response:", parseError);
         // Attempt to extract JSON from text if direct parsing fails
         const jsonMatch = llmResponse.text.match(/{[\s\S]*}/);
         if (jsonMatch && jsonMatch[0]) {
            try {
                parsedGradingResult = llmGradingResponseSchema.parse(JSON.parse(jsonMatch[0]));
                console.log("Successfully parsed extracted JSON from text.");
            } catch (nestedParseError) {
                console.error("Failed to parse extracted JSON from text:", nestedParseError);
                throw new Error("LLM response was not in the expected JSON format after attempting extraction.");
            }
         } else {
            throw new Error("LLM response was not in the expected JSON format and no JSON object found in text.");
         }
      }


      return NextResponse.json(
        {
          message: "Answer graded successfully.",
          score: parsedGradingResult.score,
          feedback: parsedGradingResult.feedback,
        },
        { status: 200 }
      );
    } catch (llmError: any) {
      console.error("Error calling LLM for grading:", llmError);
      return NextResponse.json(
        { message: "Failed to grade answer due to an LLM error.", error: llmError.message },
        { status: 500 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid submission data", errors: error.errors },
        { status: 400 }
      );
    }
    console.error("Error processing grading submission:", error);
    return NextResponse.json(
      { message: "Error processing submission" },
      { status: 500 }
    );
  }
}
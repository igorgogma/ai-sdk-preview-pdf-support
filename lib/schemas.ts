import { z } from "zod";

// Original PDF quiz schema (for backward compatibility)
export const questionSchema = z.object({
  question: z.string(),
  options: z
    .array(z.string())
    .length(4)
    .describe(
      "Four possible answers to the question. Only one should be correct. They should all be of equal lengths.",
    ),
  answer: z
    .enum(["A", "B", "C", "D"])
    .describe(
      "The correct answer, where A is the first option, B is the second, and so on.",
    ),
});

export type Question = z.infer<typeof questionSchema>;

export const questionsSchema = z.array(questionSchema).length(4);

// Enhanced PDF quiz schemas with multiple question types
export const multipleChoiceQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.literal("multiple-choice"),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const definitionQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.literal("definition"),
  question: z.string(),
  correctAnswer: z.string(),
  explanation: z.string(),
});

export const problemSolvingQuestionSchema = z.object({
  id: z.string().optional(),
  type: z.literal("problem-solving"),
  question: z.string(),
  correctAnswer: z.string(),
  steps: z.array(z.string()).optional(),
  explanation: z.string(),
});

export const enhancedQuestionSchema = z.discriminatedUnion("type", [
  multipleChoiceQuestionSchema,
  definitionQuestionSchema,
  problemSolvingQuestionSchema,
]);

export type EnhancedQuestion = z.infer<typeof enhancedQuestionSchema>;

export const enhancedQuestionsSchema = z.array(enhancedQuestionSchema);

// Schema for PDF quiz generation parameters
export const pdfQuizParamsSchema = z.object({
  files: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
      data: z.string(),
    })
  ),
  count: z.number().min(3).max(40).default(5),
  questionTypes: z.array(
    z.enum(["multiple-choice", "definition", "problem-solving"])
  ).min(1, "At least one question type is required"),
});

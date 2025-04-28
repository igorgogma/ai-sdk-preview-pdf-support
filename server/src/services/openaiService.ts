import OpenAI from 'openai';
import { config } from '../config';
import { kognityService } from './kognityService';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.OPENAI_API_KEY,
});

// Generate physics explanation
export const generatePhysicsExplanation = async (
  topic: string,
  question: string
): Promise<string> => {
  try {
    // Fetch relevant content from Kognity
    let kognityContext = '';
    try {
      const searchResults = await kognityService.searchPhysicsContent(
        `${topic} ${question}`
      );
      
      if (searchResults && searchResults.length > 0) {
        // Get the most relevant content
        kognityContext = searchResults[0].content;
      }
    } catch (error) {
      console.warn('Failed to fetch Kognity content, proceeding without it:', error);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable physics tutor. Explain physics concepts clearly and concisely, using analogies and examples when appropriate. Focus on helping students understand the underlying principles. Use the context from the Kognity textbook when available, but add your own explanations and examples to make the concept clearer.',
        },
        ...(kognityContext
          ? [{ role: 'system', content: `Information from Kognity textbook: ${kognityContext}` } as const]
          : []),
        {
          role: 'user',
          content: `Topic: ${topic}\nQuestion: ${question}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    return response.choices[0]?.message?.content || 'No explanation generated.';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate physics explanation');
  }
};

// Generate practice questions based on Kognity content
export const generatePracticeQuestions = async (
  topic: string,
  difficulty: 'easy' | 'medium' | 'hard',
  count: number = 3
): Promise<Array<{
  question: string;
  options?: string[];
  correctAnswer: string;
  explanation: string;
}>> => {
  try {
    // Fetch relevant content from Kognity
    let kognityContext = '';
    try {
      const searchResults = await kognityService.searchPhysicsContent(topic);
      
      if (searchResults && searchResults.length > 0) {
        // Get content from up to 3 relevant resources
        const relevantResults = searchResults.slice(0, 3);
        kognityContext = relevantResults
          .map(r => r.content)
          .join('\n\n');
          
        if (kognityContext) {
          kognityContext = `Information from Kognity textbook on ${topic}: ${kognityContext}`;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch Kognity content, proceeding without it:', error);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a physics teacher creating practice questions. Generate clear, focused questions that test understanding of physics concepts. Include numerical problems where appropriate. For each question, provide the correct answer and a brief explanation. Format your response as a JSON array where each question is an object with "question", "options" (for multiple choice), "correctAnswer", and "explanation" fields.',
        },
        ...(kognityContext
          ? [{ role: 'system', content: kognityContext } as const]
          : []),
        {
          role: 'user',
          content: `Generate ${count} ${difficulty} questions about ${topic}. Use the provided Kognity textbook content as a reference, but create original questions.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{"questions": []}';
    const parsedContent = JSON.parse(content);
    return parsedContent.questions || [];
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate practice questions');
  }
};

// Evaluate student answer with Kognity context
export const evaluateAnswer = async (
  question: string,
  studentAnswer: string,
  correctAnswer: string
): Promise<{
  isCorrect: boolean;
  feedback: string;
  score: number;
  improvement: string;
}> => {
  try {
    // Fetch relevant content from Kognity for better evaluation
    let kognityContext = '';
    try {
      const searchResults = await kognityService.searchPhysicsContent(question);
      
      if (searchResults && searchResults.length > 0) {
        kognityContext = `Relevant information from Kognity textbook: ${searchResults[0].content}`;
      }
    } catch (error) {
      console.warn('Failed to fetch Kognity content, proceeding without it:', error);
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a physics teacher evaluating student answers. Provide constructive feedback, a numerical score (0-100), and specific suggestions for improvement. Focus on understanding and application of concepts. Your response should be formatted as a JSON object with "score", "feedback", and "improvement" fields.',
        },
        ...(kognityContext
          ? [{ role: 'system', content: kognityContext } as const]
          : []),
        {
          role: 'user',
          content: `Question: ${question}\nStudent Answer: ${studentAnswer}\nCorrect Answer: ${correctAnswer}\n\nEvaluate the answer and provide feedback.`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || '{"score":0,"feedback":"No feedback available","improvement":"No suggestions available"}';
    const evaluation = JSON.parse(content);
    
    return {
      isCorrect: evaluation.score >= 80,
      feedback: evaluation.feedback,
      score: evaluation.score,
      improvement: evaluation.improvement,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to evaluate answer');
  }
}; 
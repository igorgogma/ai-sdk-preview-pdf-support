import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import {
  generatePhysicsExplanation,
  generatePracticeQuestions,
  evaluateAnswer,
} from '../services/openaiService';
import { kognityService } from '../services/kognityService';
import { ApiError } from '../middleware/errorHandler';
import { Progress } from '../models/Progress';
import OpenAI from 'openai';
import { config } from '../config';
import { AuthenticatedRequest } from '../middleware/auth';

// Define the structure of what we expect in req.user based on our actual usage
interface UserRequest {
  _id: string;
  email: string;
  role: string;
}

// Define an interface for authenticated requests
interface AuthenticatedRequest extends Omit<Request, 'user'> {
  user: UserRequest;
}

// Validation schemas
const explanationSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  question: z.string().min(1, 'Question is required'),
});

const practiceQuestionsSchema = z.object({
  topic: z.string().min(1, 'Topic is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  count: z.number().min(1).max(10).default(3),
});

const evaluationSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  studentAnswer: z.string().min(1, 'Student answer is required'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
});

const chatSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  context: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  topic: z.string().optional(),
});

// Get physics topics from Kognity
export const getPhysicsTopics = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topics = await kognityService.getPhysicsTopics();
    
    res.status(200).json({
      status: 'success',
      data: topics,
    });
  } catch (error) {
    next(error);
  }
};

// Get content for a specific subtopic from Kognity
export const getSubtopicContent = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { subtopicUrl } = req.params;
    
    if (!subtopicUrl) {
      throw new ApiError('Subtopic URL is required', 400);
    }
    
    const content = await kognityService.getSubtopicContent(subtopicUrl);
    
    res.status(200).json({
      status: 'success',
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

// Get physics explanation
export const getExplanation = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = explanationSchema.parse(req.body);
    const explanation = await generatePhysicsExplanation(
      validatedData.topic,
      validatedData.question
    );

    res.status(200).json({
      status: 'success',
      data: {
        explanation,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get practice questions
export const getPracticeQuestions = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = practiceQuestionsSchema.parse(req.body);
    const questions = await generatePracticeQuestions(
      validatedData.topic,
      validatedData.difficulty,
      validatedData.count
    );

    res.status(200).json({
      status: 'success',
      data: {
        questions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Evaluate student answer
export const evaluateStudentAnswer = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = evaluationSchema.parse(req.body);
    const evaluation = await evaluateAnswer(
      validatedData.question,
      validatedData.studentAnswer,
      validatedData.correctAnswer
    );

    // Update user's progress if topic and subtopic are provided
    if (req.body.topic && req.body.subtopic) {
      try {
        const userId = req.user._id;
        
        // Find or create progress record
        let progress = await Progress.findOne({
          userId,
          topic: req.body.topic,
          subtopic: req.body.subtopic,
        });
        
        if (!progress) {
          progress = new Progress({
            userId,
            topic: req.body.topic,
            subtopic: req.body.subtopic,
            questionsAttempted: 0,
            questionsCorrect: 0,
          });
        }
        
        // Update progress
        progress.questionsAttempted += 1;
        if (evaluation.isCorrect) {
          progress.questionsCorrect += 1;
        }
        progress.lastAttempted = new Date();
        
        // Update status based on current accuracy
        progress.updateStatus();
        
        await progress.save();
      } catch (progressError) {
        console.error('Failed to update progress:', progressError);
        // Continue with the response even if progress update fails
      }
    }

    res.status(200).json({
      status: 'success',
      data: evaluation,
    });
  } catch (error) {
    next(error);
  }
};

// AI tutor chat
export const tutorChat = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedData = chatSchema.parse(req.body);
    
    // Prepare context for OpenAI
    const context = validatedData.context || [];
    const userMessage = validatedData.message;
    const topic = validatedData.topic || '';
    
    // Get Kognity information if topic is provided
    let kognityInfo = '';
    if (topic) {
      try {
        const searchResults = await kognityService.searchPhysicsContent(topic);
        if (searchResults.length > 0) {
          kognityInfo = searchResults[0].content;
        }
      } catch (error) {
        console.warn('Failed to fetch Kognity content:', error);
      }
    }
    
    // Create system message with Kognity info if available
    const systemMessage = kognityInfo 
      ? `You are a physics tutor helping a student understand concepts. Use the following Kognity information when relevant: ${kognityInfo}`
      : 'You are a physics tutor helping a student understand concepts. Be clear, concise, and use examples to explain difficult topics.';
    
    // Create the messages array for OpenAI with specific types
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: systemMessage },
      ...context.map(msg => ({ 
        role: msg.role as 'user' | 'assistant', 
        content: msg.content 
      })),
      { role: 'user', content: userMessage }
    ];
    
    const openai = new OpenAI({
      apiKey: config.OPENAI_API_KEY,
    });
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages,
      temperature: 0.7,
      max_tokens: 800,
    });
    
    const reply = response.choices[0]?.message?.content || 'I\'m not sure how to answer that.';
    
    res.status(200).json({
      status: 'success',
      data: {
        reply,
        newContext: [
          ...context,
          { role: 'user', content: userMessage },
          { role: 'assistant', content: reply }
        ]
      }
    });
  } catch (error) {
    next(error);
  }
}; 
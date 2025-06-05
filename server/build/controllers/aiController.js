"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tutorChat = exports.getQuizProgress = exports.evaluateStudentAnswer = exports.getPracticeQuestions = exports.getExplanation = exports.getPhysicsTopics = void 0;
const zod_1 = require("zod");
const openaiService_1 = require("../services/openaiService");
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
const sessionService_1 = require("../services/sessionService");
// Validation schemas
const explanationSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, 'Topic is required'),
    question: zod_1.z.string().min(1, 'Question is required'),
});
const practiceQuestionsSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, 'Topic is required'),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    count: zod_1.z.number().min(1).max(10).default(3),
});
const evaluationSchema = zod_1.z.object({
    question: zod_1.z.string().min(1, 'Question is required'),
    studentAnswer: zod_1.z.string().min(1, 'Student answer is required'),
    correctAnswer: zod_1.z.string().min(1, 'Correct answer is required'),
});
const chatSchema = zod_1.z.object({
    message: zod_1.z.string().min(1, 'Message is required'),
    context: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.enum(['user', 'assistant']),
        content: zod_1.z.string(),
    })).optional(),
    topic: zod_1.z.string().optional(),
});
// Get science topics
const getPhysicsTopics = async (req, res, next) => {
    try {
        // Provide a list of common science topics
        const topics = [
            { id: 'physics', title: 'Physics' },
            { id: 'chemistry', title: 'Chemistry' },
            { id: 'biology', title: 'Biology' },
            { id: 'astronomy', title: 'Astronomy' },
            { id: 'earth-science', title: 'Earth Science' },
            { id: 'environmental-science', title: 'Environmental Science' },
            { id: 'computer-science', title: 'Computer Science' },
            { id: 'mathematics', title: 'Mathematics' },
        ];
        res.status(200).json({
            status: 'success',
            data: topics,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPhysicsTopics = getPhysicsTopics;
// Get science explanation
const getExplanation = async (req, res, next) => {
    try {
        const validatedData = explanationSchema.parse(req.body);
        const explanation = await (0, openaiService_1.generateScienceExplanation)(validatedData.topic, validatedData.question);
        res.status(200).json({
            status: 'success',
            data: {
                explanation,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getExplanation = getExplanation;
// Get practice questions
const getPracticeQuestions = async (req, res, next) => {
    try {
        const validatedData = practiceQuestionsSchema.parse(req.body);
        const questions = await (0, openaiService_1.generatePracticeQuestions)(validatedData.topic, validatedData.difficulty, validatedData.count);
        // Save quiz to session
        if (req.sessionId) {
            sessionService_1.sessionService.saveQuizProgress(req.sessionId, validatedData.topic, validatedData.difficulty, questions, 0, // Start at first question
            [] // No answers yet
            );
        }
        res.status(200).json({
            status: 'success',
            data: {
                questions,
                quizId: req.sessionId, // Return session ID as quiz ID
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPracticeQuestions = getPracticeQuestions;
// Evaluate student answer
const evaluateStudentAnswer = async (req, res, next) => {
    try {
        const validatedData = evaluationSchema.parse(req.body);
        const evaluation = await (0, openaiService_1.evaluateAnswer)(validatedData.question, validatedData.studentAnswer, validatedData.correctAnswer);
        // Update quiz progress in session if questionIndex is provided
        if (req.sessionId && typeof req.body.questionIndex === 'number') {
            try {
                // Get current quiz from session
                const quizProgress = sessionService_1.sessionService.getQuizProgress(req.sessionId);
                if (quizProgress) {
                    // Create a copy of the answers array
                    const updatedAnswers = [...quizProgress.answers];
                    // Update the answer at the specified index
                    updatedAnswers[req.body.questionIndex] = {
                        studentAnswer: validatedData.studentAnswer,
                        isCorrect: evaluation.isCorrect,
                        feedback: evaluation.feedback,
                        score: evaluation.score
                    };
                    // Save updated quiz progress
                    sessionService_1.sessionService.saveQuizProgress(req.sessionId, quizProgress.topic, quizProgress.difficulty, quizProgress.questions, req.body.questionIndex + 1, // Move to next question
                    updatedAnswers);
                }
            }
            catch (progressError) {
                console.error('Failed to update quiz progress:', progressError);
                // Continue with the response even if progress update fails
            }
        }
        res.status(200).json({
            status: 'success',
            data: evaluation,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.evaluateStudentAnswer = evaluateStudentAnswer;
// Get current quiz progress
const getQuizProgress = async (req, res, next) => {
    try {
        if (!req.sessionId) {
            return res.status(400).json({
                status: 'error',
                message: 'No session found'
            });
        }
        const quizProgress = sessionService_1.sessionService.getQuizProgress(req.sessionId);
        if (!quizProgress) {
            return res.status(404).json({
                status: 'error',
                message: 'No quiz in progress'
            });
        }
        res.status(200).json({
            status: 'success',
            data: quizProgress
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuizProgress = getQuizProgress;
// AI tutor chat
const tutorChat = async (req, res, next) => {
    var _a, _b;
    try {
        const validatedData = chatSchema.parse(req.body);
        // Prepare context for OpenAI
        const context = validatedData.context || [];
        const userMessage = validatedData.message;
        const topic = validatedData.topic || '';
        // Create system message
        const systemMessage = `You are a science tutor helping a student understand ${topic || 'science'} concepts. Be clear, concise, and use examples to explain difficult topics.`;
        // Create the messages array for OpenAI with specific types
        const messages = [
            { role: 'system', content: systemMessage },
            ...context.map(msg => ({
                role: msg.role,
                content: msg.content
            })),
            { role: 'user', content: userMessage }
        ];
        const openai = new openai_1.default({
            baseURL: 'https://openrouter.ai/api/v1',
            apiKey: config_1.config.OPENROUTER_API_KEY || config_1.config.OPENAI_API_KEY,
            defaultHeaders: {
                'HTTP-Referer': config_1.config.APP_URL || 'https://science-quiz-generator.com',
                'X-Title': 'Science Quiz Generator',
            },
        });
        const response = await openai.chat.completions.create({
            model: 'anthropic/claude-3-5-sonnet', // Use Claude for tutoring
            messages,
            temperature: 0.7,
            max_tokens: 800,
        });
        const reply = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || 'I\'m not sure how to answer that.';
        // Save chat history in session if available
        if (req.sessionId) {
            sessionService_1.sessionService.updateSession(req.sessionId, {
                chatHistory: [
                    ...context,
                    { role: 'user', content: userMessage },
                    { role: 'assistant', content: reply }
                ]
            });
        }
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
    }
    catch (error) {
        next(error);
    }
};
exports.tutorChat = tutorChat;

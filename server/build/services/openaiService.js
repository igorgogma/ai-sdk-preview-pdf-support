"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAnswer = exports.generatePracticeQuestions = exports.generateScienceExplanation = void 0;
const openai_1 = __importDefault(require("openai"));
const config_1 = require("../config");
// Initialize OpenAI client with OpenRouter configuration
const openai = new openai_1.default({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: config_1.config.OPENROUTER_API_KEY || config_1.config.OPENAI_API_KEY, // Fallback to OpenAI key if OpenRouter key not set
    defaultHeaders: {
        'HTTP-Referer': config_1.config.APP_URL || 'https://science-quiz-generator.com', // Your app URL for OpenRouter rankings
        'X-Title': 'Science Quiz Generator', // Your app name for OpenRouter rankings
    },
});
// Default model to use (can be changed based on availability and performance)
// See https://openrouter.ai/models for available models
const DEFAULT_MODEL = 'anthropic/claude-3-5-sonnet'; // High quality model with good science knowledge
// Generate science explanation
const generateScienceExplanation = async (topic, question) => {
    var _a, _b;
    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a knowledgeable science tutor. Explain science concepts clearly and concisely, using analogies and examples when appropriate. Focus on helping students understand the underlying principles. Your explanations should be educational and accessible to students.',
                },
                {
                    role: 'user',
                    content: `Topic: ${topic}\nQuestion: ${question}`,
                },
            ],
            temperature: 0.7,
            max_tokens: 800,
        });
        return ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || 'No explanation generated.';
    }
    catch (error) {
        console.error('OpenRouter API error:', error);
        throw new Error('Failed to generate science explanation');
    }
};
exports.generateScienceExplanation = generateScienceExplanation;
// Generate practice questions for any science topic
const generatePracticeQuestions = async (topic, difficulty, count = 3) => {
    var _a, _b;
    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a science teacher creating practice questions. Generate clear, focused questions that test understanding of science concepts. Include multiple choice options where appropriate. For each question, provide the correct answer and a detailed explanation that helps students learn. Format your response as a JSON array where each question is an object with "question", "options" (for multiple choice), "correctAnswer", and "explanation" fields.',
                },
                {
                    role: 'user',
                    content: `Generate ${count} ${difficulty} questions about ${topic}. Make sure the explanations are detailed and educational, helping students truly understand the concepts.`,
                },
            ],
            temperature: 0.8,
            max_tokens: 2500,
            response_format: { type: "json_object" },
        });
        const content = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{"questions": []}';
        const parsedContent = JSON.parse(content);
        return parsedContent.questions || [];
    }
    catch (error) {
        console.error('OpenRouter API error:', error);
        // Handle JSON parsing errors that might occur with some models
        if (error instanceof SyntaxError) {
            console.error('JSON parsing error. Raw response:', error);
            throw new Error('Failed to parse response from model. Please try again or choose a different topic.');
        }
        throw new Error('Failed to generate practice questions');
    }
};
exports.generatePracticeQuestions = generatePracticeQuestions;
// Evaluate student answer
const evaluateAnswer = async (question, studentAnswer, correctAnswer) => {
    var _a, _b;
    try {
        const response = await openai.chat.completions.create({
            model: DEFAULT_MODEL,
            messages: [
                {
                    role: 'system',
                    content: 'You are a science teacher evaluating student answers. Provide constructive feedback, a numerical score (0-100), and specific suggestions for improvement. Focus on understanding and application of concepts. Your response should be formatted as a JSON object with "score", "feedback", and "improvement" fields.',
                },
                {
                    role: 'user',
                    content: `Question: ${question}\nStudent Answer: ${studentAnswer}\nCorrect Answer: ${correctAnswer}\n\nEvaluate the answer and provide feedback.`,
                },
            ],
            temperature: 0.3,
            max_tokens: 500,
            response_format: { type: "json_object" },
        });
        const content = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '{"score":0,"feedback":"No feedback available","improvement":"No suggestions available"}';
        try {
            const evaluation = JSON.parse(content);
            return {
                isCorrect: evaluation.score >= 80,
                feedback: evaluation.feedback,
                score: evaluation.score,
                improvement: evaluation.improvement,
            };
        }
        catch (parseError) {
            console.error('JSON parsing error:', parseError);
            // Provide a fallback response if JSON parsing fails
            return {
                isCorrect: false,
                feedback: "We couldn't properly evaluate your answer. Please try again.",
                score: 0,
                improvement: "Try submitting your answer again or rephrase it.",
            };
        }
    }
    catch (error) {
        console.error('OpenRouter API error:', error);
        throw new Error('Failed to evaluate answer');
    }
};
exports.evaluateAnswer = evaluateAnswer;

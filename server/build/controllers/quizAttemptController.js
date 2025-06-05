"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQuizAttemptStats = exports.getQuizAttemptById = exports.getQuizAttempts = exports.createQuizAttempt = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const QuizAttempt_1 = require("../models/QuizAttempt");
const Question_1 = require("../models/Question");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation schemas
const createQuizAttemptSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, 'Topic is required'),
    subtopic: zod_1.z.string().min(1, 'Subtopic is required'),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    questions: zod_1.z.array(zod_1.z.object({
        questionId: zod_1.z.string(),
        userAnswer: zod_1.z.string(),
        timeSpent: zod_1.z.number().min(0),
    })),
});
const getQuizAttemptsSchema = zod_1.z.object({
    topic: zod_1.z.string().optional(),
    subtopic: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    completed: zod_1.z.boolean().optional(),
    page: zod_1.z.string().transform(val => val ? parseInt(val) : 1).optional(),
    limit: zod_1.z.string().transform(val => val ? parseInt(val) : 10).optional(),
});
// Create a new quiz attempt
const createQuizAttempt = async (req, res, next) => {
    try {
        const validatedData = createQuizAttemptSchema.parse(req.body);
        const userId = new mongoose_1.default.Types.ObjectId(req.user._id);
        // Get questions and validate answers
        const questions = await Promise.all(validatedData.questions.map(async (q) => {
            const question = await Question_1.Question.findById(q.questionId);
            if (!question) {
                throw new errorHandler_1.ApiError(`Question not found: ${q.questionId}`, 404);
            }
            return {
                questionId: new mongoose_1.default.Types.ObjectId(q.questionId),
                userAnswer: q.userAnswer,
                isCorrect: question.correctAnswer === q.userAnswer,
                timeSpent: q.timeSpent,
            };
        }));
        // Calculate total time spent
        const timeSpent = questions.reduce((total, q) => total + q.timeSpent, 0);
        // Create quiz attempt
        const quizAttempt = await QuizAttempt_1.QuizAttempt.create({
            userId,
            topic: validatedData.topic,
            subtopic: validatedData.subtopic,
            difficulty: validatedData.difficulty,
            questions,
            timeSpent,
            score: 0,
            completed: false,
            startedAt: new Date(),
        });
        // Calculate score and complete the attempt
        quizAttempt.calculateScore();
        quizAttempt.complete();
        await quizAttempt.save();
        res.status(201).json({
            success: true,
            data: quizAttempt,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createQuizAttempt = createQuizAttempt;
// Get user's quiz attempts
const getQuizAttempts = async (req, res, next) => {
    var _a;
    try {
        const validatedData = getQuizAttemptsSchema.parse(req.query);
        const userId = new mongoose_1.default.Types.ObjectId(req.user._id);
        const page = Number(validatedData.page || 1);
        const limit = Number(validatedData.limit || 10);
        const skip = (page - 1) * limit;
        // Build query
        const query = { userId };
        if (validatedData.topic)
            query.topic = validatedData.topic;
        if (validatedData.subtopic)
            query.subtopic = validatedData.subtopic;
        if (validatedData.difficulty)
            query.difficulty = validatedData.difficulty;
        if (validatedData.completed !== undefined)
            query.completed = validatedData.completed;
        // Use aggregation pipeline for pagination
        const [result] = await QuizAttempt_1.QuizAttempt.aggregate([
            { $match: query },
            { $sort: { startedAt: -1 } },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: 'questions',
                                localField: 'questions.questionId',
                                foreignField: '_id',
                                as: 'questions.questionId'
                            }
                        }
                    ],
                    total: [{ $count: 'count' }]
                }
            }
        ]);
        const quizAttempts = result.data;
        const total = ((_a = result.total[0]) === null || _a === void 0 ? void 0 : _a.count) || 0;
        res.json({
            success: true,
            data: quizAttempts,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuizAttempts = getQuizAttempts;
// Get a single quiz attempt
const getQuizAttemptById = async (req, res, next) => {
    try {
        const quizAttempt = await QuizAttempt_1.QuizAttempt.findById(req.params.id)
            .populate('questions.questionId');
        if (!quizAttempt) {
            throw new errorHandler_1.ApiError('Quiz attempt not found', 404);
        }
        // Check if user owns this quiz attempt
        if (quizAttempt.userId.toString() !== req.user._id.toString()) {
            throw new errorHandler_1.ApiError('Not authorized to access this quiz attempt', 403);
        }
        res.json({
            success: true,
            data: quizAttempt,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuizAttemptById = getQuizAttemptById;
// Get quiz attempt statistics
const getQuizAttemptStats = async (req, res, next) => {
    try {
        const userId = new mongoose_1.default.Types.ObjectId(req.user._id);
        // Get all completed quiz attempts
        const quizAttempts = await QuizAttempt_1.QuizAttempt.find({
            userId,
            completed: true,
        }).lean(); // Use lean() to get plain JavaScript objects
        // Calculate statistics
        const stats = {
            totalAttempts: quizAttempts.length,
            averageScore: 0,
            bestScore: 0,
            topics: {},
        };
        if (quizAttempts.length > 0) {
            // Calculate overall statistics
            const totalScore = quizAttempts.reduce((sum, attempt) => sum + attempt.score, 0);
            stats.averageScore = totalScore / quizAttempts.length;
            stats.bestScore = Math.max(...quizAttempts.map(attempt => attempt.score));
            // Calculate per-topic statistics
            quizAttempts.forEach(attempt => {
                if (!stats.topics[attempt.topic]) {
                    stats.topics[attempt.topic] = {
                        attempts: 0,
                        averageScore: 0,
                        bestScore: 0,
                    };
                }
                const topicStats = stats.topics[attempt.topic];
                topicStats.attempts++;
                topicStats.averageScore = (topicStats.averageScore * (topicStats.attempts - 1) + attempt.score) / topicStats.attempts;
                topicStats.bestScore = Math.max(topicStats.bestScore, attempt.score);
            });
        }
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuizAttemptStats = getQuizAttemptStats;

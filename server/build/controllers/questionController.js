"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestion = exports.getQuestionById = exports.getQuestions = exports.createQuestion = void 0;
const zod_1 = require("zod");
const Question_1 = require("../models/Question");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation schemas
const createQuestionSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, 'Topic is required'),
    subtopic: zod_1.z.string().min(1, 'Subtopic is required'),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']),
    type: zod_1.z.enum(['multiple-choice', 'numerical', 'open-ended']),
    question: zod_1.z.string().min(1, 'Question text is required'),
    options: zod_1.z.array(zod_1.z.string()).optional(),
    correctAnswer: zod_1.z.string().min(1, 'Correct answer is required'),
    explanation: zod_1.z.string().min(1, 'Explanation is required'),
    hints: zod_1.z.array(zod_1.z.string()).default([]),
    tags: zod_1.z.array(zod_1.z.string()).default([]),
});
const getQuestionsSchema = zod_1.z.object({
    topic: zod_1.z.string().optional(),
    subtopic: zod_1.z.string().optional(),
    difficulty: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    type: zod_1.z.enum(['multiple-choice', 'numerical', 'open-ended']).optional(),
    tags: zod_1.z.array(zod_1.z.string()).optional(),
    limit: zod_1.z.number().min(1).max(50).default(10),
    page: zod_1.z.number().min(1).default(1),
});
// Create a new question
const createQuestion = async (req, res, next) => {
    try {
        const validatedData = createQuestionSchema.parse(req.body);
        // Validate multiple choice options
        if (validatedData.type === 'multiple-choice' &&
            (!validatedData.options || validatedData.options.length < 2)) {
            throw new errorHandler_1.ApiError('Multiple choice questions must have at least 2 options', 400);
        }
        const question = await Question_1.Question.create(validatedData);
        res.status(201).json({
            status: 'success',
            data: {
                question,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createQuestion = createQuestion;
// Get questions with filters
const getQuestions = async (req, res, next) => {
    var _a;
    try {
        const validatedData = getQuestionsSchema.parse(req.query);
        // Build query
        const query = {};
        if (validatedData.topic)
            query.topic = validatedData.topic;
        if (validatedData.subtopic)
            query.subtopic = validatedData.subtopic;
        if (validatedData.difficulty)
            query.difficulty = validatedData.difficulty;
        if (validatedData.type)
            query.type = validatedData.type;
        if ((_a = validatedData.tags) === null || _a === void 0 ? void 0 : _a.length)
            query.tags = { $in: validatedData.tags };
        // Calculate pagination
        const skip = (validatedData.page - 1) * validatedData.limit;
        // Execute query
        const [questions, total] = await Promise.all([
            Question_1.Question.find(query)
                .skip(skip)
                .limit(validatedData.limit)
                .sort({ createdAt: -1 }),
            Question_1.Question.countDocuments(query),
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                questions,
                pagination: {
                    page: validatedData.page,
                    limit: validatedData.limit,
                    total,
                    pages: Math.ceil(total / validatedData.limit),
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuestions = getQuestions;
// Get a single question by ID
const getQuestionById = async (req, res, next) => {
    try {
        const question = await Question_1.Question.findById(req.params.id);
        if (!question) {
            throw new errorHandler_1.ApiError('Question not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: {
                question,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getQuestionById = getQuestionById;
// Update a question
const updateQuestion = async (req, res, next) => {
    try {
        const validatedData = createQuestionSchema.partial().parse(req.body);
        // Validate multiple choice options
        if (validatedData.type === 'multiple-choice' &&
            validatedData.options &&
            validatedData.options.length < 2) {
            throw new errorHandler_1.ApiError('Multiple choice questions must have at least 2 options', 400);
        }
        const question = await Question_1.Question.findByIdAndUpdate(req.params.id, validatedData, {
            new: true,
            runValidators: true,
        });
        if (!question) {
            throw new errorHandler_1.ApiError('Question not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: {
                question,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateQuestion = updateQuestion;
// Delete a question
const deleteQuestion = async (req, res, next) => {
    try {
        const question = await Question_1.Question.findByIdAndDelete(req.params.id);
        if (!question) {
            throw new errorHandler_1.ApiError('Question not found', 404);
        }
        res.status(204).json({
            status: 'success',
            data: null,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteQuestion = deleteQuestion;

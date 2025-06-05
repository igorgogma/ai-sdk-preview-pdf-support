"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTopicSummary = exports.updateProgress = exports.getUserProgress = void 0;
const zod_1 = require("zod");
const Progress_1 = require("../models/Progress");
// Validation schemas
const updateProgressSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, 'Topic is required'),
    subtopic: zod_1.z.string().min(1, 'Subtopic is required'),
    isCorrect: zod_1.z.boolean(),
});
const getProgressSchema = zod_1.z.object({
    topic: zod_1.z.string().optional(),
    subtopic: zod_1.z.string().optional(),
});
// Get user progress
const getUserProgress = async (req, res, next) => {
    var _a;
    try {
        const validatedData = getProgressSchema.parse(req.query);
        const query = Object.assign(Object.assign({ userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id }, (validatedData.topic && { topic: validatedData.topic })), (validatedData.subtopic && { subtopic: validatedData.subtopic }));
        const progress = await Progress_1.Progress.find(query).sort({ updatedAt: -1 });
        res.status(200).json({
            status: 'success',
            data: {
                progress,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getUserProgress = getUserProgress;
// Update user progress
const updateProgress = async (req, res, next) => {
    var _a, _b;
    try {
        const validatedData = updateProgressSchema.parse(req.body);
        // Find or create progress record
        let progress = await Progress_1.Progress.findOne({
            userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
            topic: validatedData.topic,
            subtopic: validatedData.subtopic,
        });
        if (!progress) {
            progress = new Progress_1.Progress({
                userId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                topic: validatedData.topic,
                subtopic: validatedData.subtopic,
            });
        }
        // Update progress
        progress.questionsAttempted += 1;
        if (validatedData.isCorrect) {
            progress.questionsCorrect += 1;
        }
        progress.lastAttempted = new Date();
        progress.updateStatus();
        await progress.save();
        res.status(200).json({
            status: 'success',
            data: {
                progress,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProgress = updateProgress;
// Get topic summary
const getTopicSummary = async (req, res, next) => {
    var _a;
    try {
        const summary = await Progress_1.Progress.aggregate([
            {
                $match: {
                    userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id,
                },
            },
            {
                $group: {
                    _id: '$topic',
                    totalSubtopics: { $sum: 1 },
                    averageScore: { $avg: '$score' },
                    greenCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'green'] }, 1, 0] },
                    },
                    yellowCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'yellow'] }, 1, 0] },
                    },
                    redCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'red'] }, 1, 0] },
                    },
                },
            },
            {
                $project: {
                    topic: '$_id',
                    totalSubtopics: 1,
                    averageScore: { $round: ['$averageScore', 2] },
                    greenCount: 1,
                    yellowCount: 1,
                    redCount: 1,
                },
            },
            {
                $sort: { topic: 1 },
            },
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                summary,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getTopicSummary = getTopicSummary;

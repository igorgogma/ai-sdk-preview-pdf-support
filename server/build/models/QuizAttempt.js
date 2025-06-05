"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizAttempt = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Quiz attempt schema
const quizAttemptSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    topic: {
        type: String,
        required: [true, 'Topic is required'],
        trim: true,
    },
    subtopic: {
        type: String,
        required: [true, 'Subtopic is required'],
        trim: true,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: [true, 'Difficulty level is required'],
    },
    questions: [
        {
            questionId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: 'Question',
                required: true,
            },
            userAnswer: {
                type: String,
                required: true,
            },
            isCorrect: {
                type: Boolean,
                required: true,
            },
            timeSpent: {
                type: Number,
                required: true,
                min: 0,
            },
        },
    ],
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    timeSpent: {
        type: Number,
        required: true,
        min: 0,
    },
    completed: {
        type: Boolean,
        required: true,
        default: false,
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now,
    },
    completedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});
// Create indexes for efficient querying
quizAttemptSchema.index({ userId: 1, topic: 1, subtopic: 1 });
quizAttemptSchema.index({ userId: 1, completed: 1 });
quizAttemptSchema.index({ startedAt: -1 });
// Method to calculate score
quizAttemptSchema.methods.calculateScore = function () {
    const totalQuestions = this.questions.length;
    const correctAnswers = this.questions.filter((q) => q.isCorrect).length;
    this.score = (correctAnswers / totalQuestions) * 100;
};
// Method to complete quiz attempt
quizAttemptSchema.methods.complete = function () {
    this.completed = true;
    this.completedAt = new Date();
    this.calculateScore();
};
// Export QuizAttempt model
exports.QuizAttempt = mongoose_1.default.model('QuizAttempt', quizAttemptSchema);

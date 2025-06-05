"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Question = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Question schema
const questionSchema = new mongoose_1.default.Schema({
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
    type: {
        type: String,
        enum: ['multiple-choice', 'numerical', 'open-ended'],
        required: [true, 'Question type is required'],
    },
    question: {
        type: String,
        required: [true, 'Question text is required'],
        trim: true,
    },
    options: {
        type: [String],
        validate: {
            validator: function (options) {
                return this.type !== 'multiple-choice' || options.length >= 2;
            },
            message: 'Multiple choice questions must have at least 2 options',
        },
    },
    correctAnswer: {
        type: String,
        required: [true, 'Correct answer is required'],
        trim: true,
    },
    explanation: {
        type: String,
        required: [true, 'Explanation is required'],
        trim: true,
    },
    hints: {
        type: [String],
        default: [],
    },
    tags: {
        type: [String],
        default: [],
    },
}, {
    timestamps: true,
});
// Create indexes for efficient querying
questionSchema.index({ topic: 1, subtopic: 1 });
questionSchema.index({ difficulty: 1 });
questionSchema.index({ tags: 1 });
// Export Question model
exports.Question = mongoose_1.default.model('Question', questionSchema);

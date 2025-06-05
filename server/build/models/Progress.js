"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Progress = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Progress schema
const progressSchema = new mongoose_1.default.Schema({
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
    status: {
        type: String,
        enum: ['red', 'yellow', 'green'],
        default: 'red',
    },
    score: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0,
    },
    questionsAttempted: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    questionsCorrect: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    lastAttempted: {
        type: Date,
        default: Date.now,
    },
}, {
    timestamps: true,
});
// Create compound index for userId and topic/subtopic
progressSchema.index({ userId: 1, topic: 1, subtopic: 1 }, { unique: true });
// Method to update progress based on new score
progressSchema.methods.updateStatus = function () {
    const accuracy = (this.questionsCorrect / this.questionsAttempted) * 100;
    if (accuracy >= 80) {
        this.status = 'green';
    }
    else if (accuracy >= 60) {
        this.status = 'yellow';
    }
    else {
        this.status = 'red';
    }
    this.score = accuracy;
};
// Export Progress model
exports.Progress = mongoose_1.default.model('Progress', progressSchema);

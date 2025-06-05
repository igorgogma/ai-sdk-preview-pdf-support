"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionService = void 0;
const uuid_1 = require("uuid");
class SessionService {
    constructor(sessionDurationMs = 24 * 60 * 60 * 1000) {
        this.sessions = new Map();
        this.sessionDuration = sessionDurationMs;
        // Set up periodic cleanup of expired sessions
        setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000); // Run every hour
    }
    /**
     * Create a new session
     */
    createSession(userId) {
        const sessionId = (0, uuid_1.v4)();
        const now = new Date();
        const expiresAt = new Date(now.getTime() + this.sessionDuration);
        const session = {
            id: sessionId,
            userId,
            createdAt: now,
            expiresAt,
            data: {}
        };
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Get a session by ID
     */
    getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return undefined;
        }
        // Check if session has expired
        if (new Date() > session.expiresAt) {
            this.sessions.delete(sessionId);
            return undefined;
        }
        return session;
    }
    /**
     * Update session data
     */
    updateSession(sessionId, data) {
        const session = this.getSession(sessionId);
        if (!session) {
            return undefined;
        }
        // Update session data
        session.data = Object.assign(Object.assign({}, session.data), data);
        // Extend session expiration
        session.expiresAt = new Date(new Date().getTime() + this.sessionDuration);
        this.sessions.set(sessionId, session);
        return session;
    }
    /**
     * Delete a session
     */
    deleteSession(sessionId) {
        return this.sessions.delete(sessionId);
    }
    /**
     * Save quiz progress in session
     */
    saveQuizProgress(sessionId, topic, difficulty, questions, currentQuestionIndex, answers = []) {
        return this.updateSession(sessionId, {
            currentQuiz: {
                topic,
                difficulty,
                questions,
                currentQuestionIndex,
                answers
            }
        });
    }
    /**
     * Get quiz progress from session
     */
    getQuizProgress(sessionId) {
        const session = this.getSession(sessionId);
        return session === null || session === void 0 ? void 0 : session.data.currentQuiz;
    }
    /**
     * Clean up expired sessions
     */
    cleanupExpiredSessions() {
        const now = new Date();
        for (const [sessionId, session] of this.sessions.entries()) {
            if (now > session.expiresAt) {
                this.sessions.delete(sessionId);
            }
        }
    }
}
// Export a singleton instance
exports.sessionService = new SessionService();

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionMiddleware = void 0;
const sessionService_1 = require("../services/sessionService");
const config_1 = require("../config");
/**
 * Session middleware
 * Creates a new session if one doesn't exist, or retrieves an existing session
 */
const sessionMiddleware = (req, res, next) => {
    var _a;
    // Get session ID from cookie
    const sessionId = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.sessionId;
    if (sessionId) {
        // Try to get existing session
        const session = sessionService_1.sessionService.getSession(sessionId);
        if (session) {
            // Session exists and is valid
            req.sessionId = sessionId;
            req.sessionData = session.data;
            return next();
        }
    }
    // Create a new session
    const newSession = sessionService_1.sessionService.createSession();
    // Set session cookie
    res.cookie('sessionId', newSession.id, {
        httpOnly: true,
        secure: config_1.config.NODE_ENV === 'production',
        maxAge: config_1.config.SESSION_EXPIRY,
        sameSite: 'lax'
    });
    // Attach session to request
    req.sessionId = newSession.id;
    req.sessionData = newSession.data;
    next();
};
exports.sessionMiddleware = sessionMiddleware;

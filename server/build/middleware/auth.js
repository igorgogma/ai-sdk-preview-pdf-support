"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guestAuth = void 0;
const uuid_1 = require("uuid");
// Simple guest authentication middleware
// This creates a guest user if one doesn't exist
const guestAuth = (req, res, next) => {
    try {
        // If no user exists, create a guest user
        if (!req.user) {
            req.user = {
                id: (0, uuid_1.v4)(),
                role: 'guest'
            };
        }
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.guestAuth = guestAuth;

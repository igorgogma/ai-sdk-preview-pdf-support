"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ApiError = void 0;
const zod_1 = require("zod");
// Custom error class for API errors
class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.ApiError = ApiError;
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            status: 'fail',
            message: 'Validation error',
            errors: err.errors.map((error) => ({
                field: error.path.join('.'),
                message: error.message,
            })),
        });
    }
    // Handle API errors
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    }
    // Handle other errors
    console.error('Error:', err);
    return res.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;

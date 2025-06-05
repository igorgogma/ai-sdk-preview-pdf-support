"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = void 0;
const zod_1 = require("zod");
const User_1 = require("../models/User");
const errorHandler_1 = require("../middleware/errorHandler");
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(8, 'Password must be at least 8 characters long'),
    firstName: zod_1.z.string().min(1, 'First name is required'),
    lastName: zod_1.z.string().min(1, 'Last name is required'),
    role: zod_1.z.enum(['student', 'teacher', 'admin']).default('student'),
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email address'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
// Register a new user
const register = async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = registerSchema.parse(req.body);
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email: validatedData.email });
        if (existingUser) {
            throw new errorHandler_1.ApiError('User already exists', 400);
        }
        // Create new user
        const user = await User_1.User.create(validatedData);
        // Generate token
        const token = user.generateAuthToken();
        res.status(201).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
// Login user
const login = async (req, res, next) => {
    try {
        // Validate request body
        const validatedData = loginSchema.parse(req.body);
        // Find user and include password
        const user = await User_1.User.findOne({ email: validatedData.email }).select('+password');
        if (!user) {
            throw new errorHandler_1.ApiError('Invalid email or password', 401);
        }
        // Check password
        const isPasswordValid = await user.comparePassword(validatedData.password);
        if (!isPasswordValid) {
            throw new errorHandler_1.ApiError('Invalid email or password', 401);
        }
        // Generate token
        const token = user.generateAuthToken();
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
// Get current user
const getCurrentUser = async (req, res, next) => {
    var _a;
    try {
        const user = await User_1.User.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!user) {
            throw new errorHandler_1.ApiError('User not found', 404);
        }
        res.status(200).json({
            status: 'success',
            data: {
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getCurrentUser = getCurrentUser;

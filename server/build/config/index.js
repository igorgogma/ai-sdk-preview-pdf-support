"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables from .env file
dotenv_1.default.config();
// Define the environment variables schema
const envSchema = zod_1.z.object({
    // Server Configuration
    PORT: zod_1.z.string().default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    APP_URL: zod_1.z.string().url().optional().default('http://localhost:3000'),
    // Authentication & Session
    JWT_SECRET: zod_1.z.string().min(1).optional().default('science_quiz_generator_jwt_secret'),
    JWT_EXPIRES_IN: zod_1.z.string().default('7d'),
    COOKIE_SECRET: zod_1.z.string().min(1).default('science_quiz_generator_secret'),
    SESSION_EXPIRY: zod_1.z.string().transform(Number).default('86400000'), // 24 hours in milliseconds
    // LLM API Configuration
    OPENAI_API_KEY: zod_1.z.string().min(1),
    OPENROUTER_API_KEY: zod_1.z.string().optional(),
    // Kognity Configuration (optional)
    KOGNITY_USERNAME: zod_1.z.string().min(1).optional().default(''),
    KOGNITY_PASSWORD: zod_1.z.string().min(1).optional().default(''),
    // CORS Configuration
    CORS_ORIGIN: zod_1.z.string().url().default('http://localhost:3000'),
    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: zod_1.z.string().transform(Number).default('900000'),
    RATE_LIMIT_MAX_REQUESTS: zod_1.z.string().transform(Number).default('100'),
});
// Parse and validate environment variables
const parseEnvVars = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
            throw new Error(`Missing or invalid environment variables: ${missingVars}`);
        }
        throw error;
    }
};
// Export validated configuration
exports.config = parseEnvVars();

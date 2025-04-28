import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

// Define the environment variables schema
const envSchema = z.object({
  // Server Configuration
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // MongoDB Configuration
  MONGODB_URI: z.string().url(),

  // JWT Configuration
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),

  // OpenAI Configuration
  OPENAI_API_KEY: z.string().min(1),

  // Kognity Configuration
  KOGNITY_USERNAME: z.string().min(1),
  KOGNITY_PASSWORD: z.string().min(1),

  // CORS Configuration
  CORS_ORIGIN: z.string().url().default('http://localhost:3000'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),
});

// Parse and validate environment variables
const parseEnvVars = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((err) => err.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

// Export validated configuration
export const config = parseEnvVars(); 
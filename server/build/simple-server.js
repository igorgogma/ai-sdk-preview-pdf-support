"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("./config");
// Initialize Express app
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
// Health check route
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Simple route to test OpenRouter
app.get('/api/test', (_req, res) => {
    res.status(200).json({
        message: 'Server is working!',
        config: {
            port: config_1.config.PORT,
            environment: config_1.config.NODE_ENV,
            hasOpenRouterKey: !!config_1.config.OPENROUTER_API_KEY,
            hasOpenAIKey: !!config_1.config.OPENAI_API_KEY
        }
    });
});
// Start server
const PORT = config_1.config.PORT;
app.listen(PORT, () => {
    console.log(`Simple server is running on port ${PORT}`);
    console.log(`Environment: ${config_1.config.NODE_ENV}`);
});

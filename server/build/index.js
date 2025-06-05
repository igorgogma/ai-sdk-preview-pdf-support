"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const aiRoutes_1 = __importDefault(require("./routes/aiRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
const session_1 = require("./middleware/session");
// Initialize Express app
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)({ origin: config_1.config.CORS_ORIGIN }));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use((0, cookie_parser_1.default)(config_1.config.COOKIE_SECRET));
app.use(session_1.sessionMiddleware);
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: config_1.config.RATE_LIMIT_WINDOW_MS,
    max: config_1.config.RATE_LIMIT_MAX_REQUESTS,
    message: 'Too many requests from this IP, please try again later.',
});
app.use(limiter);
// Health check route
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});
// Root route - serve welcome message
app.get('/', (_req, res) => {
    // Always serve the welcome message directly
    res.status(200).send(`
    <html>
      <head>
        <title>Science Quiz Generator API</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #4f46e5; }
          p { line-height: 1.6; }
          code { background: #f1f5f9; padding: 2px 4px; border-radius: 4px; }
          .button {
            display: inline-block;
            background-color: #4f46e5;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #4338ca;
          }
          .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <h1>Science Quiz Generator API</h1>

        <div class="card">
          <h2>Welcome to the Science Quiz Generator!</h2>
          <p>This application helps students learn science concepts by generating interactive quizzes on any science topic with AI-powered explanations and feedback.</p>

          <h3>Features:</h3>
          <ul>
            <li>Generate quizzes on any science topic</li>
            <li>Choose difficulty levels and quiz length</li>
            <li>Get detailed explanations for answers</li>
            <li>Track your progress across sessions</li>
          </ul>

          <a href="/api/ai/topics" class="button">View Science Topics</a>
        </div>

        <div class="card">
          <h2>API Endpoints</h2>
          <p>Available endpoints:</p>
          <ul>
            <li><code>/api/ai/topics</code> - Get science topics</li>
            <li><code>/api/ai/practice-questions</code> - Generate practice questions</li>
            <li><code>/api/ai/evaluate</code> - Evaluate answers</li>
            <li><code>/api/ai/quiz-progress</code> - Get current quiz progress</li>
            <li><code>/api/ai/explain</code> - Get explanations for science concepts</li>
            <li><code>/api/ai/chat</code> - Chat with AI tutor</li>
          </ul>
        </div>
      </body>
    </html>
  `);
});
// API Routes - these should come before static file serving
app.use('/api/ai', aiRoutes_1.default);
// Serve static files from the client build directory if it exists
const clientBuildPath = path_1.default.join(__dirname, '../../client/build');
try {
    if (require('fs').existsSync(clientBuildPath)) {
        // Serve static files
        app.use('/static', express_1.default.static(path_1.default.join(clientBuildPath, 'static')));
        app.use('/assets', express_1.default.static(path_1.default.join(clientBuildPath, 'assets')));
        // For client-side routes (not API or root), serve the index.html file
        app.get('/quiz/*', (_req, res) => {
            res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
        });
        console.log('Serving client assets from:', clientBuildPath);
    }
}
catch (error) {
    console.log('Client build directory not found, serving API only');
}
// Error handling
app.use(errorHandler_1.errorHandler);
// Start server
const PORT = config_1.config.PORT;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${config_1.config.NODE_ENV}`);
});

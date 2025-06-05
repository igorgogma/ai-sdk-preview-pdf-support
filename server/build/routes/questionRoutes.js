"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const questionController_1 = require("../controllers/questionController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_1.authenticate);
// Public routes (authenticated users)
router.get('/', questionController_1.getQuestions);
router.get('/:id', questionController_1.getQuestionById);
// Protected routes (teachers and admins only)
router.post('/', (0, auth_1.authorize)('teacher', 'admin'), questionController_1.createQuestion);
router.patch('/:id', (0, auth_1.authorize)('teacher', 'admin'), questionController_1.updateQuestion);
router.delete('/:id', (0, auth_1.authorize)('teacher', 'admin'), questionController_1.deleteQuestion);
exports.default = router;

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const aiController_1 = require("../controllers/aiController");
const router = express_1.default.Router();
// Science topics route
router.get('/topics', aiController_1.getPhysicsTopics);
// Quiz endpoints
router.post('/practice-questions', aiController_1.getPracticeQuestions);
router.post('/evaluate', aiController_1.evaluateStudentAnswer);
router.get('/quiz-progress', aiController_1.getQuizProgress);
// Other AI endpoints
router.post('/explain', aiController_1.getExplanation);
router.post('/chat', aiController_1.tutorChat);
exports.default = router;

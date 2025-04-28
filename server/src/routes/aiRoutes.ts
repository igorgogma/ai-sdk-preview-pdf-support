import express from 'express';
import {
  getExplanation,
  getPracticeQuestions,
  evaluateStudentAnswer,
  getPhysicsTopics,
  getSubtopicContent,
  tutorChat,
} from '../controllers/aiController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Kognity integration routes
router.get('/topics', getPhysicsTopics);
router.get('/subtopic/:subtopicUrl', getSubtopicContent);

// AI endpoints
router.post('/explain', getExplanation);
router.post('/practice-questions', getPracticeQuestions);
router.post('/evaluate', evaluateStudentAnswer);
router.post('/chat', tutorChat);

export default router; 
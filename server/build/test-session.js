"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sessionService_1 = require("./services/sessionService");
// Test the session service
console.log('Testing session service...');
// Create a new session
const session = sessionService_1.sessionService.createSession();
console.log('Created session:', session.id);
// Add some data to the session
sessionService_1.sessionService.updateSession(session.id, {
    testData: 'This is a test'
});
// Get the session
const retrievedSession = sessionService_1.sessionService.getSession(session.id);
console.log('Retrieved session data:', retrievedSession === null || retrievedSession === void 0 ? void 0 : retrievedSession.data);
// Save quiz progress
sessionService_1.sessionService.saveQuizProgress(session.id, 'Physics', 'medium', [
    {
        question: 'What is the formula for force?',
        options: ['F = ma', 'E = mc²', 'F = G(m₁m₂)/r²', 'p = mv'],
        correctAnswer: 'F = ma',
        explanation: 'Force equals mass times acceleration (Newton\'s Second Law).'
    }
], 0, []);
// Get quiz progress
const quizProgress = sessionService_1.sessionService.getQuizProgress(session.id);
console.log('Quiz progress:', quizProgress);
console.log('Session test completed successfully!');

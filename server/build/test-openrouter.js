"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const openaiService_1 = require("./services/openaiService");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Test function
async function testOpenRouter() {
    try {
        console.log('Testing OpenRouter integration...');
        const topic = 'Quantum Physics';
        const question = 'What is quantum entanglement?';
        console.log(`Asking: ${question} (Topic: ${topic})`);
        const explanation = await (0, openaiService_1.generateScienceExplanation)(topic, question);
        console.log('\nResponse from OpenRouter:');
        console.log('------------------------');
        console.log(explanation);
        console.log('------------------------');
        console.log('\nTest completed successfully!');
    }
    catch (error) {
        console.error('Error testing OpenRouter:', error);
    }
}
// Run the test
testOpenRouter();

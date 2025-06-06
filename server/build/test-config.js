"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
console.log('Testing configuration...');
console.log('Configuration loaded successfully:');
console.log('PORT:', config_1.config.PORT);
console.log('NODE_ENV:', config_1.config.NODE_ENV);
console.log('OPENAI_API_KEY:', config_1.config.OPENAI_API_KEY ? '[REDACTED]' : 'Not set');
console.log('OPENROUTER_API_KEY:', config_1.config.OPENROUTER_API_KEY ? '[REDACTED]' : 'Not set');
console.log('COOKIE_SECRET:', config_1.config.COOKIE_SECRET ? '[REDACTED]' : 'Not set');
console.log('\nConfiguration test completed successfully!');

const { spawn } = require('child_process');
const path = require('path');

console.log('Starting development server...');

// Run npm run dev
const npmProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

npmProcess.on('error', (error) => {
  console.error(`Error starting development server: ${error.message}`);
});

npmProcess.on('close', (code) => {
  if (code !== 0) {
    console.error(`Development server exited with code ${code}`);
  }
});

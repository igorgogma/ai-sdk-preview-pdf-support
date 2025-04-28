const http = require('http');
const { exec } = require('child_process');

console.log('Checking if the application is running...');

// Check if the application is running on port 3000
http.get('http://localhost:3000', (res) => {
  console.log(`Application is running. Status code: ${res.statusCode}`);
  
  // Open the application in the default browser
  console.log('Opening the application in the default browser...');
  
  if (process.platform === 'win32') {
    exec('start http://localhost:3000');
  } else if (process.platform === 'darwin') {
    exec('open http://localhost:3000');
  } else {
    exec('xdg-open http://localhost:3000');
  }
}).on('error', (err) => {
  console.error('Application is not running:', err.message);
  console.log('Please start the application with: npm run dev');
});

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Path to client build directory
const clientBuildPath = path_1.default.join(__dirname, '../../client/build');
// Check if client build directory exists
if (!fs_1.default.existsSync(clientBuildPath)) {
    console.log('Client build directory not found, creating placeholder...');
    // Create the directory structure if it doesn't exist
    fs_1.default.mkdirSync(clientBuildPath, { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(clientBuildPath, 'static'), { recursive: true });
    fs_1.default.mkdirSync(path_1.default.join(clientBuildPath, 'assets'), { recursive: true });
    // Create a simple CSS file
    const cssContent = `
body {
  font-family: Arial, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  line-height: 1.6;
}
h1 {
  color: #4f46e5;
}
.card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}
.button {
  display: inline-block;
  background-color: #4f46e5;
  color: white;
  padding: 10px 20px;
  border-radius: 4px;
  text-decoration: none;
  font-weight: bold;
}
.button:hover {
  background-color: #4338ca;
}
`;
    fs_1.default.writeFileSync(path_1.default.join(clientBuildPath, 'assets', 'style.css'), cssContent);
    // Create a simple JavaScript file
    const jsContent = `
document.addEventListener('DOMContentLoaded', function() {
  // Add a timestamp to show the page is dynamic
  const timestampElement = document.getElementById('timestamp');
  if (timestampElement) {
    timestampElement.textContent = new Date().toLocaleString();
  }

  // Add event listener to the API test button
  const testButton = document.getElementById('test-api');
  if (testButton) {
    testButton.addEventListener('click', async function(e) {
      e.preventDefault();
      const resultElement = document.getElementById('api-result');

      try {
        resultElement.textContent = 'Loading...';
        const response = await fetch('/api/ai/topics');
        const data = await response.json();
        resultElement.textContent = 'Success! Topics: ' + JSON.stringify(data.data);
      } catch (error) {
        resultElement.textContent = 'Error: ' + error.message;
      }
    });
  }
});
`;
    fs_1.default.writeFileSync(path_1.default.join(clientBuildPath, 'assets', 'script.js'), jsContent);
    // Create a simple index.html file
    const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Science Quiz Generator</title>
  <link rel="stylesheet" href="/assets/style.css">
  <script src="/assets/script.js"></script>
</head>
<body>
  <h1>Science Quiz Generator</h1>

  <div class="card">
    <h2>Welcome to Science Quiz Generator!</h2>
    <p>This is a placeholder page. The actual client application is not built yet.</p>
    <p>Current time: <span id="timestamp">Loading...</span></p>
    <p>The Science Quiz Generator allows you to:</p>
    <ul>
      <li>Generate quizzes on any science topic</li>
      <li>Choose difficulty levels and quiz length</li>
      <li>Get detailed explanations for answers</li>
      <li>Track your progress across sessions</li>
    </ul>
    <p>To use the full application, you need to build the client:</p>
    <pre>cd ../client && npm install && npm run build</pre>
  </div>

  <div class="card">
    <h2>API Status</h2>
    <p>The API server is running and ready to use.</p>
    <p>You can test the API directly:</p>
    <button id="test-api" class="button">Test API Connection</button>
    <p id="api-result"></p>
  </div>
</body>
</html>
  `;
    // Write the file
    fs_1.default.writeFileSync(path_1.default.join(clientBuildPath, 'index.html'), indexHtml);
    console.log('Placeholder created successfully!');
}
else {
    console.log('Client build directory exists, no need to create placeholder.');
}

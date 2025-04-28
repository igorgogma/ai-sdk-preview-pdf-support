const fs = require('fs');
const path = require('path');

// Check if the slider component exists
const sliderPath = path.join(__dirname, 'components', 'ui', 'slider.tsx');
console.log(`Checking if slider component exists at: ${sliderPath}`);
console.log(`File exists: ${fs.existsSync(sliderPath)}`);

// List all files in the components/ui directory
const uiDirPath = path.join(__dirname, 'components', 'ui');
console.log(`\nListing files in ${uiDirPath}:`);
try {
  const files = fs.readdirSync(uiDirPath);
  files.forEach(file => {
    console.log(`- ${file}`);
  });
} catch (error) {
  console.error(`Error reading directory: ${error.message}`);
}

// Check if the utils.ts file exists
const utilsPath = path.join(__dirname, 'lib', 'utils.ts');
console.log(`\nChecking if utils.ts exists at: ${utilsPath}`);
console.log(`File exists: ${fs.existsSync(utilsPath)}`);

// List all files in the lib directory
const libDirPath = path.join(__dirname, 'lib');
console.log(`\nListing files in ${libDirPath}:`);
try {
  const files = fs.readdirSync(libDirPath);
  files.forEach(file => {
    console.log(`- ${file}`);
  });
} catch (error) {
  console.error(`Error reading directory: ${error.message}`);
}

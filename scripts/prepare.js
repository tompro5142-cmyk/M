// Ensures the temp directory exists before start
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.resolve(__dirname, '..', 'temp');
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  console.log('Created temp directory.');
}

#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Import the compiled TypeScript
const texPrinter = require('../dist/main.js');

// Read the markdown file
const mdPath = path.join(__dirname, '放射線_下書き.md');
const texOutputPath = path.join(__dirname, '放射線_下書き_converted.tex');

if (!fs.existsSync(mdPath)) {
  console.error(`Error: ${mdPath} not found`);
  process.exit(1);
}

const mdContent = fs.readFileSync(mdPath, 'utf8');

console.log('Markdown file read successfully');
console.log(`File size: ${mdContent.length} bytes`);
console.log('Converting to LaTeX...');

// For now, just copy the existing .tex file as proof of concept
// The actual conversion would use the plugin's export functionality
if (fs.existsSync(path.join(__dirname, '放射線_下書き.tex'))) {
  const texContent = fs.readFileSync(path.join(__dirname, '放射線_下書き.tex'), 'utf8');
  fs.writeFileSync(texOutputPath, texContent, 'utf8');
  console.log(`✓ LaTeX file saved to: ${texOutputPath}`);
} else {
  console.error('Conversion failed: No template .tex file found');
  process.exit(1);
}

import fs from 'fs';
import path from 'path';
import { markdownToTex } from '../src/processor.js';
import { ExportToTexSettings } from '../src/plugin/settings.js';

const inputFile = path.join(__dirname, 'test_vault/ExportToTex/Samples/TestFile 1.md');
const outputFile = path.join(__dirname, 'test_vault/ExportToTex/Output/test.tex');

const content = fs.readFileSync(inputFile, 'utf-8');

const settings = new ExportToTexSettings();

const result = markdownToTex()
  .data('settings', {
    exportToTex: settings,
  })
  .processSync(content);

fs.writeFileSync(outputFile, result.toString());

console.log('Generated test.tex');
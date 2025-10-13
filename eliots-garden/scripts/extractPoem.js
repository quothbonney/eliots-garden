// Script to extract the clean poem text from wasteland.txt
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawText = fs.readFileSync(path.join(__dirname, '../../wasteland.txt'), 'utf-8');
const lines = rawText.split('\n');

// The actual poem is from line 63 to line 550 (0-indexed: 62-549)
// Section markers in the original:
// Line 60: I. THE BURIAL OF THE DEAD
// Line 146: II. A GAME OF CHESS  
// Line 254: III. THE FIRE SERMON
// Line 411: IV. DEATH BY WATER
// Line 428: V. WHAT THE THUNDER SAID

const poemStart = 62; // "April is the cruellest month"
const poemEnd = 549; // "Shantih    shantih    shantih"

const cleanedLines = [];
let lineNumber = 0;
let currentSection = '';

for (let i = poemStart; i <= poemEnd; i++) {
  const line = lines[i].trim();
  
  // Skip section headers and empty lines between sections
  if (line.match(/^\s*(I+V?|V)\.\s+/)) {
    currentSection = line;
    continue;
  }
  
  // Skip completely empty lines between sections
  if (line === '' && (i === 61 || i === 144 || i === 252 || i === 409 || i === 426)) {
    continue;
  }
  
  // Track actual poem lines
  lineNumber++;
  
  // Determine section
  let section = 'I';
  if (lineNumber > 76) section = 'II';
  if (lineNumber > 172) section = 'III';  
  if (lineNumber > 311) section = 'IV';
  if (lineNumber > 321) section = 'V';
  
  // Check for italics (foreign text)
  const isItalic = line.startsWith('_') && line.endsWith('_');
  const cleanText = isItalic ? line.slice(1, -1) : line;
  
  // Preserve original line numbers from the printed edition
  const originalLineNum = lines[i].match(/\s+(\d+)\s*$/);
  
  cleanedLines.push({
    number: lineNumber,
    text: cleanText.replace(/\s+\d+\s*$/, '').trimEnd(), // Remove line numbers
    section,
    isItalic,
    originalPrintLineNumber: originalLineNum ? parseInt(originalLineNum[1]) : null
  });
}

// Create the JSON data structure
const poemData = {
  title: "The Waste Land",
  author: "T.S. Eliot",
  year: 1922,
  sections: {
    I: { title: "THE BURIAL OF THE DEAD", startLine: 1, endLine: 76 },
    II: { title: "A GAME OF CHESS", startLine: 77, endLine: 172 },
    III: { title: "THE FIRE SERMON", startLine: 173, endLine: 311 },
    IV: { title: "DEATH BY WATER", startLine: 312, endLine: 321 },
    V: { title: "WHAT THE THUNDER SAID", startLine: 322, endLine: 433 }
  },
  lines: cleanedLines,
  arcConnections: [] // To be populated
};

// Write to JSON file
fs.writeFileSync(
  path.join(__dirname, '../src/data/wasteland-clean.json'),
  JSON.stringify(poemData, null, 2)
);

// Also create a TypeScript data file
const tsContent = `// Auto-generated from extractPoem.js
export const WASTE_LAND_DATA = ${JSON.stringify(poemData, null, 2)} as const;

export type PoemLine = typeof WASTE_LAND_DATA.lines[number];
export type Section = keyof typeof WASTE_LAND_DATA.sections;
`;

fs.writeFileSync(
  path.join(__dirname, '../src/data/wastelandData.ts'),
  tsContent
);

console.log(`Extracted ${cleanedLines.length} lines of poetry`);
console.log('Files created:');
console.log('  - src/data/wasteland-clean.json');
console.log('  - src/data/wastelandData.ts');

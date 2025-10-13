// Parse the cleaned wasteland.txt and create a complete JSON structure
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawText = fs.readFileSync(path.join(__dirname, '../public/wasteland.txt'), 'utf-8');
const lines = rawText.split('\n');

const poemData = {
  title: "The Waste Land",
  author: "T.S. Eliot",
  year: 1922,
  structure: {
    epigraph: {
      startLine: 1,
      endLine: 3,
      type: "epigraph",
      language: "mixed",
      description: "Petronius Satyricon - Sibyl of Cumae"
    },
    dedication: {
      startLine: 5,
      endLine: 6,
      type: "dedication", 
      language: "italian",
      description: "For Ezra Pound - il miglior fabbro (the better craftsman)"
    },
    sections: {}
  },
  lines: [],
  poemLineMapping: {},
  metadata: {
    totalLines: 0,
    totalVerseLines: 0,
    epigraphLines: 3,
    dedicationLines: 2,
    sectionHeaders: 0,
    blankLines: 0
  }
};

// Track actual poem verse line numbers (for cross-referencing)
let verseLineNumber = 0;
let currentSection = null;
const sectionInfo = {};

// Process each line
lines.forEach((line, index) => {
  const lineNum = index + 1;
  const trimmed = line.trim();
  
  let lineObj = {
    number: lineNum,
    text: line,
    type: "verse",
    section: currentSection
  };
  
  // Determine line type
  if (lineNum <= 3) {
    lineObj.type = "epigraph";
    lineObj.section = null;
  } else if (lineNum === 5 || lineNum === 6) {
    lineObj.type = "dedication";
    lineObj.section = null;
    lineObj.italic = true;
    // Remove markdown italic markers from dedication
    if (line.includes('_')) {
      lineObj.text = line.replace(/_/g, '');
    }
  } else if (trimmed === '') {
    lineObj.type = "blank";
    poemData.metadata.blankLines++;
  } else if (trimmed.match(/^\s*(I{1,3}|IV|V)\.\s+/)) {
    // Section header
    lineObj.type = "section_header";
    const match = trimmed.match(/^\s*(I{1,3}|IV|V)\.\s+(.+)/);
    if (match) {
      currentSection = match[1];
      const title = match[2];
      
      if (!sectionInfo[currentSection]) {
        sectionInfo[currentSection] = {
          title: title,
          headerLine: lineNum,
          startLine: null,
          endLine: null
        };
        poemData.metadata.sectionHeaders++;
      }
    }
  } else {
    // Regular verse line
    if (currentSection && !sectionInfo[currentSection].startLine) {
      sectionInfo[currentSection].startLine = lineNum;
    }
    
    // Track verse line number
    if (lineObj.type === "verse") {
      verseLineNumber++;
      poemData.poemLineMapping[verseLineNumber] = lineNum;
      
      // Update section end line
      if (currentSection) {
        sectionInfo[currentSection].endLine = lineNum;
      }
    }
    
    // Check for italic text (foreign language)
    // Match underscores wrapping text OR at start/end of line
    if (line.includes('_')) {
      lineObj.italic = true;
      // Remove markdown italic markers from the text
      lineObj.text = line.replace(/_/g, '');
    }
    
    // Check for specific languages
    if (trimmed.includes('Bin gar keine Russin') || 
        trimmed.includes('Frisch weht der Wind') ||
        trimmed.includes('Oed\' und leer das Meer')) {
      lineObj.language = "german";
    } else if (trimmed.includes('Et O ces voix') || 
               trimmed.includes('Poi s\'ascose') ||
               trimmed.includes('Le Prince d\'Aquitaine')) {
      lineObj.language = "french/italian";
    }
  }
  
  poemData.lines.push(lineObj);
});

// Update metadata
poemData.structure.sections = sectionInfo;
poemData.metadata.totalLines = lines.length;
poemData.metadata.totalVerseLines = verseLineNumber;

// Write the complete JSON
fs.writeFileSync(
  path.join(__dirname, '../src/data/wasteland-complete.json'),
  JSON.stringify(poemData, null, 2)
);

// Create a simplified version with just verse lines for poem rendering
const verseOnly = {
  title: "The Waste Land", 
  sections: sectionInfo,
  verses: poemData.lines
    .filter(l => l.type === "verse")
    .map((l, idx) => ({
      verseNumber: idx + 1,
      lineNumber: l.number,
      text: l.text.replace(/_/g, '').trim(), // Remove italic markers
      section: l.section,
      italic: l.italic || false,
      language: l.language || "english"
    }))
};

fs.writeFileSync(
  path.join(__dirname, '../src/data/wasteland-verses.json'),
  JSON.stringify(verseOnly, null, 2)
);

console.log(`Parsed ${lines.length} total lines`);
console.log(`  - ${verseLineNumber} verse lines`);
console.log(`  - ${poemData.metadata.epigraphLines} epigraph lines`);
console.log(`  - ${poemData.metadata.dedicationLines} dedication lines`);
console.log(`  - ${poemData.metadata.sectionHeaders} section headers`);
console.log(`  - ${poemData.metadata.blankLines} blank lines`);
console.log('\nFiles created:');
console.log('  - src/data/wasteland-complete.json (full structure)');
console.log('  - src/data/wasteland-verses.json (verse lines only)');

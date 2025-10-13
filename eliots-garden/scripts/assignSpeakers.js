// Assign speakers to verse lines based on semantic cues
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load data
const versesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/wasteland-verses.json'), 'utf-8'));
const verses = versesData.verses;
const speakersData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/speakers.json'), 'utf-8'));
const speakers = speakersData.speakers;

// Helper to normalize text for comparison
function normalize(text) {
  return text.toLowerCase().trim()
    .replace(/['"'"]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/[.,;:!?—]/g, '');
}

// Find verse by text fragment
function findVerseByText(fragment) {
  const normalized = normalize(fragment);
  for (const verse of verses) {
    if (normalize(verse.text).includes(normalized) || 
        normalized.includes(normalize(verse.text).slice(0, 15))) {
      return verse.verseNumber;
    }
  }
  return null;
}

// Manual speaker assignments based on the analysis
// Format: [speakerId, startCue, endCue (or null for continuation), rangeExtension]
const speakerAssignments = [
  // Part I — The Burial of the Dead
  ['speaker-1', 'April is the cruellest month', 'Dull roots', 4],
  ['speaker-2', 'Winter kept us warm', 'going south', 3],
  ['speaker-3', 'Summer surprised us', 'go south in the winter', 11],
  ['speaker-4', 'What are the roots', 'handful of dust', 12],
  ['speaker-5', 'You gave me hyacinths', 'the silence', 12],
  ['speaker-6', 'Madame Sosostris', 'One must be so careful', 17],
  ['speaker-7', 'Those are pearls', 'Look', 1], // interleaved within Sosostris
  ['speaker-8', 'Unreal City', 'I had not thought death', 9],
  ['speaker-9', 'Stetson', 'mon frère', 8],
  
  // Part II — A Game of Chess
  ['speaker-10', 'The Chair she sat in', 'unstoppered', 34],
  ['speaker-11', 'My nerves are bad', 'Is there nothing in your head', 17],
  ['speaker-12', 'O O O O that Shakespeherian Rag', 'So intelligent', 3],
  ['speaker-13', 'What shall I do now', 'shall we ever do', 8],
  ['speaker-14', 'When Lil', 'You are a proper fool', 31],
  ['speaker-15', 'HURRY UP PLEASE', 'HURRY UP PLEASE', 1], // interleaved, multiple instances
  ['speaker-15a', 'Good night, ladies', 'sweet ladies', 2],
  
  // Part III — The Fire Sermon
  ['speaker-16', 'river', 'last fingers of leaf', 3],
  ['speaker-17', 'Sweet Thames', 'end my song', 11],
  ['speaker-18', 'The sound of horns', 'Unreal City', 35],
  ['speaker-19', 'Mr. Eugenides', 'Metropole', 6],
  ['speaker-20', 'I think we are in rats', 'White bodies naked', 14],
  ['speaker-21', 'I Tiresias', 'awaited the expected guest', 4],
  ['speaker-22', 'At the violet hour', 'makes a welcome', 25],
  ['speaker-23', 'her brain allows', 'automatic hand', 6],
  ['speaker-24', 'O City city', 'Inexplicable splendour', 10],
  ['speaker-25', 'Weialala', 'la la', 40],
  ['speaker-26', 'To Carthage', 'burning burning burning', 5],
  
  // Part IV — Death by Water
  ['speaker-27', 'Phlebas the Phoenician', 'Gentile or Jew', 10],
  
  // Part V — What the Thunder Said
  ['speaker-28', 'After the torchlight', 'tumbled graves', 13],
  ['speaker-29', 'If there were water', 'dry sterile thunder', 24],
  ['speaker-30', 'Who is the third', 'beside you', 7],
  ['speaker-31', 'What is that sound', 'Unreal', 11],
  ['speaker-32', 'Datta', 'The awful daring', 25],
  ['speaker-33', 'Shall I at least', 'set my lands in order', 1],
  ['speaker-34', 'London Bridge is falling', 'Le Prince', 4],
  ['speaker-35', 'These fragments', 'Shantih', 4]
];

console.log('Assigning speakers to verses...\n');

// Build speaker ranges
const speakerRanges = [];
let notFound = [];

speakerAssignments.forEach(([speakerId, startCue, endCue, rangeExtension = 5]) => {
  const startVerse = findVerseByText(startCue);
  
  if (!startVerse) {
    notFound.push({ speaker: speakerId, cue: startCue });
    return;
  }
  
  let endVerse;
  if (endCue) {
    endVerse = findVerseByText(endCue);
    if (!endVerse) {
      // If end cue not found, use range extension
      endVerse = startVerse + rangeExtension;
    }
  } else {
    // Use range extension
    endVerse = startVerse + rangeExtension;
  }
  
  speakerRanges.push({
    speakerId,
    startVerse,
    endVerse: endVerse >= startVerse ? endVerse : startVerse
  });
});

console.log(`Found ${speakerRanges.length} speaker ranges`);
console.log(`Could not match ${notFound.length} cues\n`);

if (notFound.length > 0) {
  console.log('Not found:');
  notFound.forEach(nf => {
    console.log(`  ${nf.speaker}: "${nf.cue}"`);
  });
  console.log();
}

// Assign speaker to each verse
const verseToSpeaker = {};
speakerRanges.forEach(range => {
  for (let v = range.startVerse; v <= range.endVerse; v++) {
    // If verse already has a speaker, check if this is an interleaved one
    if (verseToSpeaker[v]) {
      // Keep the first assignment unless it's a special interleaved voice
      if (['speaker-7', 'speaker-15', 'speaker-15a'].includes(range.speakerId)) {
        verseToSpeaker[v] = range.speakerId;
      }
    } else {
      verseToSpeaker[v] = range.speakerId;
    }
  }
});

// Manual overrides for specific lines

// === PART I: THE BURIAL OF THE DEAD ===
// Narrator (opening - merge "The We" into this, goes until Marie starts)
for (let v = 1; v <= 7; v++) {
  verseToSpeaker[v] = 'speaker-1';
}

// Marie starts with "Summer surprised us" and continues
for (let v = 8; v <= 18; v++) {
  verseToSpeaker[v] = 'speaker-3';
}

// City Voice - all 9 lines of the Unreal City passage
for (let v = 60; v <= 68; v++) {
  verseToSpeaker[v] = 'speaker-8';
}

// Nerves Woman and Her Conscience dialogue
// Nerves Woman speaks first (111-114)
for (let v = 111; v <= 114; v++) {
  verseToSpeaker[v] = 'speaker-11';
}

// Her Conscience (rats' alley)
verseToSpeaker[115] = 'speaker-11a';
verseToSpeaker[116] = 'speaker-11a';

// Nerves Woman asks questions
verseToSpeaker[117] = 'speaker-11'; // "What is that noise?"
verseToSpeaker[119] = 'speaker-11'; // "What is that noise now? What is the wind doing?"

// Her Conscience gives terse answers
verseToSpeaker[118] = 'speaker-11a'; // "The wind under the door"
verseToSpeaker[120] = 'speaker-11a'; // "Nothing again nothing"

// Nerves Woman (121-123: "Do you know nothing...")
for (let v = 121; v <= 123; v++) {
  verseToSpeaker[v] = 'speaker-11';
}

// Her Conscience again (remembering pearls)
verseToSpeaker[124] = 'speaker-11a';
verseToSpeaker[125] = 'speaker-11a';

// Line 126 "Are you alive" is back to Nerves Woman (speaker-11)
verseToSpeaker[126] = 'speaker-11';

// Boudoir Scene extends all the way to "savagely still" (except Philomela's "Jug Jug")
for (let v = 77; v <= 110; v++) {
  if (v !== 103) { // Skip "Jug Jug" line
    verseToSpeaker[v] = 'speaker-10';
  }
}

// Philomela speaks "Jug Jug"
verseToSpeaker[103] = 'speaker-10a';

// Shell-shocked Man (includes the "But", the Rag, and all the interior dialogue)
for (let v = 127; v <= 138; v++) {
  verseToSpeaker[v] = 'speaker-13';
}
// Exception: The Rag itself gets its own color
verseToSpeaker[128] = 'speaker-12';
verseToSpeaker[129] = 'speaker-12';
verseToSpeaker[130] = 'speaker-12';

// All HURRY UP PLEASE instances to Publican
[141, 152, 165, 168, 169].forEach(v => {
  verseToSpeaker[v] = 'speaker-15';
});

// Lil's Friend continues through the entire pub monologue (including lines that were City Lamenter)
for (let v = 139; v <= 171; v++) {
  // Skip the HURRY UP PLEASE lines (they stay Publican)
  if (![141, 152, 165, 168, 169].includes(v)) {
    verseToSpeaker[v] = 'speaker-14';
  }
}

// === SECTION III: THE FIRE SERMON ===
// River-Singer (opening elegiac frame and refrains)
verseToSpeaker[173] = 'speaker-16'; // "The river's tent is broken"
verseToSpeaker[174] = 'speaker-16'; // "Clutch and sink..."
verseToSpeaker[175] = 'speaker-16'; // "Crosses the brown land..."
verseToSpeaker[176] = 'speaker-16'; // "Sweet Thames, run softly, till I end my song"
verseToSpeaker[177] = 'speaker-16'; // "The river bears no empty bottles"
verseToSpeaker[178] = 'speaker-16';
verseToSpeaker[179] = 'speaker-16';
verseToSpeaker[180] = 'speaker-16';
verseToSpeaker[181] = 'speaker-16';
verseToSpeaker[182] = 'speaker-16'; // "By the waters of Leman..."
verseToSpeaker[183] = 'speaker-16'; // "Sweet Thames, run softly..." (refrain)
verseToSpeaker[184] = 'speaker-16'; // "Sweet Thames, run softly..." (refrain)

// Bone-Whisper (first intrusion)
verseToSpeaker[185] = 'speaker-18'; // "But at my back in a cold blast I hear"
verseToSpeaker[186] = 'speaker-18'; // "The rattle of the bones..."

// Fisherman (gritty first-person narration)
for (let v = 187; v <= 195; v++) {
  verseToSpeaker[v] = 'speaker-17'; // "A rat crept..." through "year to year"
}

// Bone-Whisper (second intrusion)
verseToSpeaker[196] = 'speaker-18'; // "But at my back from time to time I hear"

// Fisherman continues (Sweeney/Mrs. Porter section)
for (let v = 197; v <= 202; v++) {
  verseToSpeaker[v] = 'speaker-17';
}

// Bird sounds (Twit/Jug/Tereu) - Philomela
verseToSpeaker[203] = 'speaker-10a';
verseToSpeaker[204] = 'speaker-10a';
verseToSpeaker[205] = 'speaker-10a';
verseToSpeaker[206] = 'speaker-10a';

// City Voice (Unreal City returns)
verseToSpeaker[207] = 'speaker-8';
verseToSpeaker[208] = 'speaker-8';

// Typist & Clerk scene (properly divided)
// Typist & Clerk (the seduction scene, 231-242)
for (let v = 231; v <= 242; v++) {
  verseToSpeaker[v] = 'speaker-22';
}

// Tiresias interrupts with his commentary (243-248)
for (let v = 243; v <= 248; v++) {
  verseToSpeaker[v] = 'speaker-21';
}

// The Typist alone (249-256: aftermath)
for (let v = 249; v <= 256; v++) {
  verseToSpeaker[v] = 'speaker-23';
}

// City Mourner and Thames-Daughters section
// City Mourner (257-265: "This music crept..." through before river)
for (let v = 257; v <= 265; v++) {
  verseToSpeaker[v] = 'speaker-24';
}

// Thames-Daughters (266-276: "The river sweats" through "Isle of Dogs")
for (let v = 266; v <= 276; v++) {
  verseToSpeaker[v] = 'speaker-25';
}

// Thames-Daughters continue (277-291: "Weialala leia" through Elizabeth/Leicester)
for (let v = 277; v <= 291; v++) {
  verseToSpeaker[v] = 'speaker-25';
}

// City Mourner (292-305: "Trams and dusty trees" through "Nothing")
for (let v = 292; v <= 305; v++) {
  verseToSpeaker[v] = 'speaker-24';
}

// Thames-Daughters (only the final "la la")
verseToSpeaker[306] = 'speaker-25';

// Augustine & Buddha
verseToSpeaker[307] = 'speaker-26'; // To Carthage then I came
verseToSpeaker[308] = 'speaker-26'; // Burning burning burning burning
verseToSpeaker[309] = 'speaker-26'; // O Lord Thou pluckest me out
verseToSpeaker[310] = 'speaker-26'; // O Lord Thou pluckest
verseToSpeaker[311] = 'speaker-26'; // burning

// === PART IV: DEATH BY WATER ===
// Phlebas ending (319-321: "Gentile or Jew..." through "tall as you") - Narrator speaks
verseToSpeaker[319] = 'speaker-1';
verseToSpeaker[320] = 'speaker-1';
verseToSpeaker[321] = 'speaker-1';

// === PART V: WHAT THE THUNDER SAID ===
// Emmaus (360-366: "Who is the third who walks...")
for (let v = 360; v <= 366; v++) {
  verseToSpeaker[v] = 'speaker-30';
}

// Apocalyptic Cataloguer (367-377: "What is that sound high in the air..." through "Unreal")
for (let v = 367; v <= 377; v++) {
  verseToSpeaker[v] = 'speaker-31';
}

// Torchlight Voice - Chapel section (386-400: full passage)
for (let v = 386; v <= 400; v++) {
  verseToSpeaker[v] = 'speaker-28';
}

// Datta section - Chorus of Gods (excluding the DA line itself)
verseToSpeaker[402] = 'speaker-32';
verseToSpeaker[403] = 'speaker-32';
verseToSpeaker[404] = 'speaker-32';
verseToSpeaker[405] = 'speaker-32';
verseToSpeaker[406] = 'speaker-32';
verseToSpeaker[407] = 'speaker-32';
verseToSpeaker[408] = 'speaker-32';
verseToSpeaker[409] = 'speaker-32';
verseToSpeaker[410] = 'speaker-32';

// Dayadhvam section - Chorus of Humans (excluding the DA line itself)
verseToSpeaker[412] = 'speaker-32a';
verseToSpeaker[413] = 'speaker-32a';
verseToSpeaker[414] = 'speaker-32a';
verseToSpeaker[415] = 'speaker-32a';
verseToSpeaker[416] = 'speaker-32a';
verseToSpeaker[417] = 'speaker-32a';

// Thunder speaks "DA" (just the word DA itself - must come AFTER the chorus assignments)
verseToSpeaker[401] = 'speaker-31a';
verseToSpeaker[411] = 'speaker-31a';
verseToSpeaker[418] = 'speaker-31a';

// Damyata section - Chorus of Demons
verseToSpeaker[419] = 'speaker-32b';
verseToSpeaker[420] = 'speaker-32b';
verseToSpeaker[421] = 'speaker-32b';
verseToSpeaker[422] = 'speaker-32b';
verseToSpeaker[423] = 'speaker-32b';

// Fisher King (after Damyata, fishing and lands in order)
verseToSpeaker[424] = 'speaker-33';
verseToSpeaker[425] = 'speaker-33';
verseToSpeaker[426] = 'speaker-33';

// Unspoken (final Shantih)
verseToSpeaker[434] = 'speaker-36';

// Create output mapping with speaker colors
const speakerMap = {};
speakers.forEach(s => {
  speakerMap[s.id] = {
    name: s.name,
    casualName: s.casualName,
    type: s.type,
    color: s.color,
    description: s.description
  };
});

const output = {
  speakers: speakerMap,
  verseAssignments: verseToSpeaker,
  metadata: {
    poem: "The Waste Land",
    totalVerses: verses.length,
    assignedVerses: Object.keys(verseToSpeaker).length,
    description: "Speaker-to-verse mapping for voice coloring"
  }
};

fs.writeFileSync(
  path.join(__dirname, '../src/data/speakerAssignments.json'),
  JSON.stringify(output, null, 2)
);

console.log(`Assigned speakers to ${Object.keys(verseToSpeaker).length} verses`);
console.log(`Coverage: ${Math.round(Object.keys(verseToSpeaker).length / verses.length * 100)}%`);
console.log('\nWrote speakerAssignments.json');


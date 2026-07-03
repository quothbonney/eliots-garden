// Generate arc connections from the scholarly catalog
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the verse data
const versesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/wasteland-verses.json'), 'utf-8'));
const verses = versesData.verses;

// Helper to find verse number by text fragment
function findVerseByText(fragment) {
  // Clean and normalize the fragment
  const normalized = fragment.toLowerCase().trim()
    .replace(/['"'"]/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/\.\.\./g, '');
  
  for (const verse of verses) {
    const verseText = verse.text.toLowerCase().trim()
      .replace(/['"'"]/g, "'")
      .replace(/\s+/g, ' ');
    
    if (verseText.includes(normalized) || normalized.includes(verseText.slice(0, 20))) {
      return verse.verseNumber;
    }
  }
  return null;
}

// Catalog of arcs with search fragments
const arcCatalog = [
  // Prophecy & fulfillment
  { source: "Is your card, the drowned Phoenician Sailor", target: "Phlebas the Phoenician, a fortnight dead", type: "motif", desc: "Madame Sosostris's card materializes as Phlebas in 'Death by Water'" },
  { source: "I do not find / The Hanged Man. Fear death by water", target: "DEATH BY WATER", type: "motif", desc: "Her warning becomes the section's event and epitaph" },
  { source: "And here is the one-eyed merchant", target: "Mr. Eugenides, the Smyrna merchant", type: "reference", desc: "The Tarot figure reappears as a named merchant in the city" },
  { source: "I see crowds of people, walking round in a ring", target: "Who are those hooded hordes swarming", type: "motif", desc: "Sosostris's 'crowds' return as apocalyptic masses" },
  { source: "Here is the man with three staves", target: "I sat upon the shore / Fishing", type: "motif", desc: "The Tarot's Fisher King literalized at poem's close" },
  { source: "Here is Belladonna, the Lady of the Rocks", target: "The Chair she sat in, like a burnished throne", type: "reference", desc: "The Tarot's 'lady of situations' as Cleopatra-like figure" },
  { source: "I do not find / The Hanged Man", target: "Gliding wrapt in a brown mantle, hooded", type: "allusion", desc: "The missing Hanged Man returns as the hooded figure in Part V" },
  { source: "Those are pearls that were his eyes. Look", target: "I remember / Those are pearls that were his eyes", type: "echo", desc: "The Tempest tag resurfaces mid-quarrel as involuntary echo" },
  { source: "One must be so careful these days", target: "Hurry up please its time", type: "motif", desc: "The fortune-teller's anxious clock merges into the pub's time-call" },
  
  // London / Unreal City
  { source: "Unreal City, / Under the brown fog of a winter dawn", target: "Unreal City / Under the brown fog of a winter noon", type: "echo", desc: "Same epithet, different time of day: one city, two sickly lights" },
  { source: "A crowd flowed over London Bridge, so many", target: "London Bridge is falling down falling down", type: "motif", desc: "From daily traffic to nursery-rhyme collapse" },
  { source: "Saint Mary Woolnoth kept the hours", target: "towers / Tolling reminiscent bells, that kept the hours", type: "echo", desc: "Bell-time returns, but spectral, in the climactic vision" },
  { source: "And each man fixed his eyes before his feet", target: "At the violet hour, when the eyes and back", type: "motif", desc: "City bodies choreographed by clocks and desks" },
  { source: "Flowed up the hill and down King William Street", target: "And along the Strand, up Queen Victoria Street", type: "reference", desc: "Named arteries recur, mapping the financial-civic core" },
  { source: "A crowd flowed", target: "O City city, I can sometimes hear", type: "voice", desc: "The impersonal crowd narrows to one ear in the same zone" },
  
  // Water, drought, Fisher King
  { source: "And the dry stone no sound of water", target: "If there were the sound of water only", type: "motif", desc: "The wish for water returns as conditional prayer" },
  { source: "There is shadow under this red rock", target: "Here is no water but only rock", type: "imagery", desc: "Early desert image amplifies into total parched landscape" },
  { source: "I will show you fear in a handful of dust", target: "stumbling in cracked earth", type: "imagery", desc: "Dust's terror realizes as drought-cracked plains" },
  { source: "By the waters of Leman I sat down and wept", target: "But there is no water", type: "motif", desc: "The lake of memory set against absolute thirst" },
  { source: "The river's tent is broken", target: "The river sweats / Oil and tar", type: "imagery", desc: "The Thames reappears degraded" },
  { source: "Sweet Thames, run softly, till I end my song", target: "Sweet Thames, run softly till I end my song", type: "echo", desc: "Pastoral invocation recurs, now undercut by urban refuse" },
  { source: "Phlebas the Phoenician", target: "The boat responded / Gaily", type: "motif", desc: "Seafaring resurfaces after drowning's lesson" },
  { source: "Ganga was sunken", target: "Sweet Thames, run softly", type: "imagery", desc: "Two sacred rivers mirror: one polluted, one parched" },
  { source: "A current under sea / Picked his bones in whispers", target: "the rattle of the bones", type: "imagery", desc: "Subaqueous whisper becomes audible rattle ashore" },
  { source: "If there were water", target: "By the waters of Leman", type: "motif", desc: "The longing for a pool answers a remembered shore" },
  { source: "Drip drop drip drop", target: "The river bears no empty bottles", type: "imagery", desc: "False auditory water vs. conspicuously absent waste" },
  { source: "Shall I at least set my lands in order", target: "The river's tent is broken", type: "motif", desc: "The Fisher King's desire meets a broken river-tent" },
  { source: "I sat upon the shore / Fishing, with the arid plain behind me", target: "While I was fishing in the dull canal", type: "echo", desc: "Two fishing scenes close a karmic loop" },
  { source: "He who was living is now dead", target: "neither / Living nor dead", type: "echo", desc: "Water's absence converts liminal living/dead into collective dying" },
  
  // Bones, graves, corpses
  { source: "I think we are in rats' alley", target: "the rattle of the bones", type: "imagery", desc: "The alley's lost bones reappear rattling by the Thames" },
  { source: "That corpse you planted last year", target: "Dry bones can harm no one", type: "motif", desc: "Stetson's corpse concludes as harmless bones" },
  { source: "White bodies naked on the low damp ground", target: "Over the tumbled graves, about the chapel", type: "imagery", desc: "Scattered bodies become tumbled graves" },
  { source: "I had not thought death had undone so many", target: "Who are those hooded hordes swarming", type: "allusion", desc: "Infernal procession returns as larger horde" },
  { source: "Oh keep the Dog far hence", target: "Dry bones can harm no one", type: "motif", desc: "Fear of disturbed burial ends with bleak reassurance" },
  
  // Birds, song, violated voice
  { source: "The change of Philomel", target: "Twit twit twit / Jug jug jug jug", type: "echo", desc: "Philomel's rape-song returns as crude birdsong parody" },
  { source: "nightingale", target: "Where the hermit-thrush sings", type: "imagery", desc: "Another bird replaces Philomel as tentative, purer music" },
  { source: "Good night, ladies", target: "Only a cock stood on the rooftree", type: "echo", desc: "Ophelia-farewell answered by cock's daybreak call" },
  { source: "O O O O that Shakespeherian Rag", target: "This music crept by me upon the waters", type: "reference", desc: "Vulgar rag and haunted music: two faces of quoted song" },
  
  // Fire, heat, burning
  { source: "Under the firelight", target: "Burning burning burning burning", type: "imagery", desc: "Quiet domestic fire becomes ascetic conflagration" },
  { source: "Huge sea-wood fed with copper", target: "After the torchlight red on sweaty faces", type: "imagery", desc: "Decorative burning returns as communal torchlight" },
  
  // Time, clocks, violet hour
  { source: "kept the hours / With a dead sound on the final stroke of nine", target: "At the violet hour", type: "motif", desc: "City's bell strikes become embodied as office fatigue" },
  { source: "Goonight Bill. Goonight Lou", target: "Good night, ladies, good night, sweet ladies", type: "echo", desc: "Pub's goodnights crescendo into Ophelia farewell" },
  
  // Soundscapes
  { source: "What is that noise? / The wind under the door", target: "What is that sound high in the air", type: "echo", desc: "Two sound-questions frame the poem's sonic anxiety" },
  { source: "The pleasant whining of a mandoline", target: "fiddled whisper music on those strings", type: "imagery", desc: "Bar-music returns as eerier string whispering" },
  { source: "Sighs, short and infrequent, were exhaled", target: "Murmur of maternal lamentation", type: "echo", desc: "Breath-sounds scale from office sighs to world-lament" },
  
  // Eyes, looking, mirrors
  { source: "my eyes failed, I was neither", target: "At the violet hour, when the eyes and back", type: "motif", desc: "Failed eyes recur as strained office eyes" },
  { source: "Pressing lidless eyes and waiting", target: "At the violet hour, when the eyes and back", type: "imagery", desc: "Eyes return as collective bodily metronome" },
  { source: "Looking into the heart of light, the silence", target: "She turns and looks a moment in the glass", type: "imagery", desc: "Vision moves from numinous light to domestic mirror" },
  
  // Rats, alleys, urban decay
  { source: "rats' alley / Where the dead men lost their bones", target: "A rat crept softly through the vegetation", type: "imagery", desc: "The named alley's rat slinks into the riverside" },
  { source: "And bones cast in a little low dry garret", target: "Dry bones can harm no one", type: "imagery", desc: "From rat-rattled bones to chapel's dry bones" },
  
  // Sex, violation, refrains
  { source: "Philomel", target: "Flushed and decided, he assaults at once", type: "allusion", desc: "Myth of rape foreshadows the typist's coercion" },
  { source: "Jug Jug", target: "So rudely forc'd", type: "echo", desc: "Both quote/echo the same violence in different registers" },
  { source: "When lovely woman stoops to folly", target: "Good night, ladies", type: "voice", desc: "Poem's women recur as Ophelia-drift and post-act pacing" },
  
  // Commerce, accounts, sea
  { source: "Mr. Eugenides", target: "And the profit and loss", type: "motif", desc: "Bills of lading and ledgers return as drowned profit/loss" },
  { source: "Asked me in demotic French", target: "Along the Strand, up Queen Victoria Street", type: "reference", desc: "Merchant hospitality maps onto mercantile avenues" },
  { source: "brings the sailor home from sea", target: "Phlebas the Phoenician", type: "motif", desc: "The sailor came home—or didn't; two maritime fates rhyme" },
  
  // Gardens, silence, aftermaths
  { source: "Yet when we came back", target: "After the frosty silence in the gardens", type: "imagery", desc: "Charged garden scene returns as frozen hush" },
  { source: "Looking into the heart of light, the silence", target: "After the frosty silence in the gardens", type: "motif", desc: "Two silences: visionary and wintry" },
  
  // Bells, churches, chapels
  { source: "Saint Mary Woolnoth kept the hours", target: "There is the empty chapel", type: "reference", desc: "From functioning church to emptied chapel" },
  { source: "the final stroke of nine", target: "towers / Tolling reminiscent bells", type: "echo", desc: "Same time-keeping, resurrected as memory" },
  
  // Classical & biblical
  { source: "Son of man", target: "Datta", type: "allusion", desc: "Prophetic address meets the Upanishadic triad" },
  { source: "Poi s'ascose nel foco che gli affina", target: "I had not thought death had undone so many", type: "allusion", desc: "Dante frames both crowds and purgation by fire" },
  { source: "You! hypocrite lecteur", target: "We who were living are now dying", type: "voice", desc: "Baudelaire's implicated reader returns as implicated 'we'" },
  { source: "To Carthage then I came", target: "After the torchlight red on sweaty faces", type: "allusion", desc: "Augustine's inner fire echoes in final section's torches" },
  
  // Wind, weather, air
  { source: "Summer surprised us, coming over the Starnbergersee", target: "In a flash of lightning. Then a damp gust", type: "imagery", desc: "Early shower returns as long-deferred storm" },
  { source: "The wind / Crosses the brown land, unheard", target: "Only the wind's home", type: "imagery", desc: "Anonymous wind evolves from mute crossing to sole inhabitant" },
  { source: "The wind under the door", target: "Only the wind's home", type: "echo", desc: "Domestic draft becomes metaphysical tenant" },
  
  // Smell, stain, sense
  { source: "strange synthetic perfumes", target: "The river sweats / Oil and tar", type: "imagery", desc: "Overpowering scents recur as industrial reek" },
  { source: "In which sad light a carved dolphin swam", target: "The river bears no empty bottles", type: "imagery", desc: "Aquarium-like art reappears as river detritus" },
  
  // Mirrors, doors, thresholds
  { source: "What is that noise", target: "I have heard the key / Turn in the door", type: "motif", desc: "Door as anxious barrier returns with key's carceral click" },
  { source: "She turns and looks a moment in the glass", target: "Thinking of the key, each confirms a prison", type: "imagery", desc: "Self-regard slides into self-confinement" },
  
  // War & empire
  { source: "You who were with me in the ships at Mylae", target: "To Carthage then I came", type: "allusion", desc: "Punic War glimmers twice: naval battle and Augustine's Carthage" },
  { source: "Unreal City", target: "Jerusalem Athens Alexandria", type: "motif", desc: "London's unreality joins global list of falling cities" },
  
  // Work, fatigue, mechanized bodies
  { source: "each man fixed his eyes before his feet", target: "the human engine waits", type: "imagery", desc: "Commuter and machine converge as habit" },
  { source: "The time is now propitious", target: "At the violet hour", type: "motif", desc: "Fatigue in private and public spheres mirrors" },
  
  // Hands, touch, control
  { source: "I will show you fear in a handful of dust", target: "Exploring hands encounter no defence", type: "motif", desc: "Hand first holds dust, later enacts coercion" },
  { source: "The boat responded / Gaily", target: "Controlling hands", type: "motif", desc: "Hands recur as Da-lesson of controlled desire" },
  { source: "The broken fingernails of dirty hands", target: "Controlling hands", type: "imagery", desc: "From broken laboring hands to disciplined control" },
  
  // Interiors echo exteriors
  { source: "The Chair she sat in, like a burnished throne", target: "The sea was calm, your heart would have responded", type: "imagery", desc: "Queenly interior's poise reappears as sea-craft's response" },
  { source: "Footsteps shuffled on the stair", target: "finding the stairs unlit", type: "reference", desc: "Same staircase returns: noisy then dark" },
  
  // Phrases returning in altered form
  { source: "Unreal City", target: "Unreal", type: "echo", desc: "Epithet detaches from City and hangs over shattered capitals" },
  { source: "living nor dead", target: "He who was living is now dead", type: "echo", desc: "Phrase becomes collective sentence" },
  { source: "Are you alive, or not", target: "We think of the key, each in his prison", type: "voice", desc: "Taunt about emptiness returns as shared mental lock" },
  { source: "What is that noise", target: "What is that sound", type: "echo", desc: "Identical interrogative form, wider horizon" },
  { source: "Speak to me. Why do you never speak", target: "These fragments I have shored against my ruins", type: "voice", desc: "Failed dialogue resolves in fragmentary monologue" },
  
  // Place-names ricochet
  { source: "On Margate Sands", target: "By the waters of Leman", type: "reference", desc: "Two shores—one numb, one weeping—frame breakdown and memory" },
  { source: "Down Greenwich reach", target: "At the Cannon Street Hotel", type: "reference", desc: "River reach and city hub: same London arc" },
  { source: "Highbury bore me. Richmond and Kew", target: "O City city", type: "reference", desc: "Boroughs within the larger city refrain" },
  
  // Mechanical / ritual echoes
  { source: "The human engine waits", target: "The boat responded / Gaily", type: "imagery", desc: "Engine and boat mirror as diagrams of discipline vs. drift" },
  { source: "We shall play a game of chess", target: "Datta. Dayadhvam. Damyata", type: "motif", desc: "Sterile game answered by three ethical moves" },
  
  // Final weavings
  { source: "A heap of broken images", target: "These fragments I have shored against my ruins", type: "motif", desc: "Opening heap returns as closing fragments, now shored" },
  { source: "Come in under the shadow of this red rock", target: "A pool among the rock", type: "imagery", desc: "Red rock's shadow longs to harbor a pool of grace" },
  { source: "Your shadow at morning", target: "Who is the third who walks always beside you", type: "imagery", desc: "Multiple shadows prefigure the mysterious third" },
  { source: "With a dead sound on the final stroke of nine", target: "Shantih shantih shantih", type: "motif", desc: "Dead bell-sound yields to final triple peace" },
  
  // Tiresias knitting scenes
  { source: "I Tiresias, though blind, throbbing between two lives", target: "I Tiresias, old man with wrinkled dugs", type: "voice", desc: "Same seer speaks twice to stitch perspectives into one substance" },
  { source: "At the violet hour", target: "brings the sailor home from sea", type: "motif", desc: "Sailor/typist pairing unified under Tiresias" },
  
  // Further precise reprises
  { source: "Et, O ces voix d'enfants", target: "Murmur of maternal lamentation", type: "echo", desc: "Sacred children's voices reappear as maternal mourning" },
  { source: "This music crept by me upon the waters", target: "I sat upon the shore / Fishing", type: "reference", desc: "Quoted music's watery creep returns at final shore" },
  { source: "Are you alive, or not", target: "He who was living is now dead", type: "voice", desc: "Private accusation finds collective verdict" }
];

console.log(`Processing ${arcCatalog.length} arc connections...`);

const connections = [];
let notFound = [];

arcCatalog.forEach((arc, idx) => {
  const sourceVerse = findVerseByText(arc.source);
  const targetVerse = findVerseByText(arc.target);
  
  if (sourceVerse && targetVerse && Math.abs(sourceVerse - targetVerse) >= 6) {
    connections.push({
      id: `arc-${idx + 1}`,
      source: sourceVerse,
      target: targetVerse,
      type: arc.type,
      description: arc.desc
    });
  } else if (!sourceVerse || !targetVerse) {
    notFound.push({ source: arc.source.slice(0, 40), target: arc.target.slice(0, 40) });
  }
});

console.log(`Found ${connections.length} valid connections`);
console.log(`Could not match ${notFound.length} arcs`);

if (notFound.length > 0) {
  console.log('\nNot found:');
  notFound.slice(0, 10).forEach(nf => {
    console.log(`  "${nf.source}" → "${nf.target}"`);
  });
}

// Write the new connections file
const output = {
  connections: connections,
  metadata: {
    poem: "The Waste Land",
    totalConnections: connections.length,
    connectionTypes: {
      reference: "Direct quotation or allusion",
      echo: "Thematic or verbal echo",
      allusion: "Literary/mythological allusion",
      motif: "Recurring motif or symbol",
      voice: "Same speaker or voice",
      imagery: "Shared imagery or symbolism"
    }
  }
};

fs.writeFileSync(
  path.join(__dirname, '../src/data/arcConnections.json'),
  JSON.stringify(output, null, 2)
);

console.log(`\nWrote ${connections.length} connections to arcConnections.json`);








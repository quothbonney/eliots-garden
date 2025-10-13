// Extract and structure the actual poem text from wasteland.txt
// Lines 63-551 contain the actual poem (excluding notes)

export const POEM_SECTIONS = {
  I: { title: "THE BURIAL OF THE DEAD", startLine: 1, endLine: 76 },
  II: { title: "A GAME OF CHESS", startLine: 77, endLine: 172 },
  III: { title: "THE FIRE SERMON", startLine: 173, endLine: 311 },
  IV: { title: "DEATH BY WATER", startLine: 312, endLine: 321 },
  V: { title: "WHAT THE THUNDER SAID", startLine: 322, endLine: 433 }
} as const;

export interface ArcConnection {
  id: string;
  source: number; // line number
  target: number; // line number
  type: 'reference' | 'echo' | 'allusion' | 'motif' | 'voice' | 'imagery';
  description: string;
  bidirectional?: boolean;
}

export interface LineData {
  number: number; // 1-433
  text: string;
  section: keyof typeof POEM_SECTIONS;
  indent?: number; // indentation level if any
  isItalic?: boolean; // for foreign language passages
  speaker?: string; // if there's a specific voice
}

// This will be populated with the cleaned poem text
export const POEM_LINES: LineData[] = [];

// Arc connections will be added here
export const ARC_CONNECTIONS: ArcConnection[] = [];

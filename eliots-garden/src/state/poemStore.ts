import { create } from 'zustand'
import type { Annotation, Token } from '../components/poem/Word'
import wastelandComplete from '../data/wasteland-complete.json'
import wastelandVerses from '../data/wasteland-verses.json'
import arcConnectionsData from '../data/arcConnections.json'
import speakerAssignments from '../data/speakerAssignments.json'
import annotationsData from '../data/annotations.json'

export type PoemLine = {
  id: string
  lineNumber: number  // Actual line number in file (1-502)
  verseNumber?: number  // Verse number if it's a verse line (1-434)
  section: string | null
  text: string
  type: 'epigraph' | 'dedication' | 'section_header' | 'verse' | 'blank'
  words: Token[]
  italic?: boolean
  language?: string
  speakerId?: string
  annotationId?: string  // ID of scholarly annotation for this line
}

export type Speaker = {
  name: string
  casualName: string
  type: string
  color: string
  description: string
}

export type ArcConnection = {
  id: string
  source: number
  target: number
  type: 'reference' | 'echo' | 'allusion' | 'motif' | 'voice' | 'imagery'
  description: string
}

export type ScholarlyAnnotation = {
  id: string
  phrase: string
  lineNumber: number
  annotation: string
  sources: string[]
}

type PoemState = {
  isLoading: boolean
  lines: PoemLine[]
  activeWordIds: Set<string>
  activeAnnotations: Annotation[]
  hoveredArcId: string | null
  arcConnections: ArcConnection[]
  speakers: Record<string, Speaker>
  showSpeakerColors: boolean
  scholarlyAnnotations: ScholarlyAnnotation[]
  activeScholarlyAnnotation: ScholarlyAnnotation | null
  loadPoem: () => void
  toggleWord: (tokenId: string) => void
  setHoveredArc: (arcId: string | null) => void
  toggleSpeakerColors: () => void
  setActiveAnnotation: (annotationId: string | null) => void
}

export const usePoemStore = create<PoemState>((set, get) => ({
  isLoading: false,
  lines: [],
  activeWordIds: new Set(),
  activeAnnotations: [],
  hoveredArcId: null,
  arcConnections: arcConnectionsData.connections as ArcConnection[],
  speakers: speakerAssignments.speakers as Record<string, Speaker>,
  showSpeakerColors: false,
  scholarlyAnnotations: annotationsData.annotations as ScholarlyAnnotation[],
  activeScholarlyAnnotation: null,
  loadPoem() {
    set({ isLoading: true })
    
    // Use the structured JSON data
    const lines = wastelandComplete.lines.map((line: any) => {
      const poemLine: PoemLine = {
        id: `line-${line.number}`,
        lineNumber: line.number,
        section: line.section,
        text: line.text,
        type: line.type,
        words: [],
        italic: line.italic,
        language: line.language
      }
      
      // Find corresponding verse number and speaker if it's a verse line
      if (line.type === 'verse') {
        const verseEntry = wastelandVerses.verses.find((v: any) => v.lineNumber === line.number)
        if (verseEntry) {
          poemLine.verseNumber = verseEntry.verseNumber
          // Assign speaker based on verse number
          const speakerId = (speakerAssignments.verseAssignments as Record<string, string>)[verseEntry.verseNumber]
          if (speakerId) {
            poemLine.speakerId = speakerId
          }
        }
      }
      
      // Parse the line into tokens
      if (line.text && line.type !== 'blank') {
        let cursor = 0
        const pieces = line.text.split(/(\s+)/)
        poemLine.words = pieces.map((piece: string, idx: number) => {
          const token: any = {
            id: `${poemLine.id}-w${idx}`,
            text: piece,
            lineId: poemLine.id,
            charStart: cursor,
            charEnd: cursor + piece.length,
            isWhitespace: /^\s+$/.test(piece),
            annotations: []
          }
          cursor += piece.length
          return token
        })
        
        // Find annotations that match this line and mark the relevant words
        const lineAnnotations = (annotationsData.annotations as ScholarlyAnnotation[]).filter(
          (ann) => ann.lineNumber === line.number
        )
        
        for (const ann of lineAnnotations) {
          // Normalize the phrase and line text for matching
          const normalizedPhrase = ann.phrase.toLowerCase().replace(/[.,;:!?—\-'"]/g, '').trim()
          const normalizedLineText = line.text.toLowerCase().replace(/[.,;:!?—\-'"]/g, '')
          
          // Find where the phrase appears in the line
          const phraseIndex = normalizedLineText.indexOf(normalizedPhrase)
          if (phraseIndex !== -1) {
            const phraseEnd = phraseIndex + normalizedPhrase.length
            
            // Mark words that fall within this phrase range
            poemLine.words.forEach((word: any) => {
              if (!word.isWhitespace) {
                const wordStart = word.charStart
                const wordEnd = word.charEnd
                
                // Check if word overlaps with phrase
                if (wordStart < phraseEnd && wordEnd > phraseIndex) {
                  word.annotationId = ann.id
                }
              }
            })
          }
        }
      }
      
      return poemLine
    })
    
    set({ lines, isLoading: false })
  },
  toggleWord(tokenId) {
    const active = new Set(get().activeWordIds)
    if (active.has(tokenId)) active.delete(tokenId)
    else active.add(tokenId)
    const annotations: Annotation[] = Array.from(active).slice(0, 3).map((id, i) => ({
      id: `a-${id}-${i}`,
      kind: i % 2 === 0 ? 'reference' : 'gloss',
      content: 'Placeholder annotation. Real content TBD.',
      targets: [],
    }))
    set({ activeWordIds: active, activeAnnotations: annotations })
  },
  setHoveredArc(arcId: string | null) {
    set({ hoveredArcId: arcId })
  },
  toggleSpeakerColors() {
    set({ showSpeakerColors: !get().showSpeakerColors })
  },
  setActiveAnnotation(annotationId: string | null) {
    const annotation = annotationId
      ? get().scholarlyAnnotations.find((a) => a.id === annotationId) || null
      : null
    set({ activeScholarlyAnnotation: annotation })
  },
}))



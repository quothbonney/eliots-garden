import { create } from 'zustand'
import type { Annotation, Token } from '../components/poem/Word'
import wastelandComplete from '../data/wasteland-complete.json'
import wastelandVerses from '../data/wasteland-verses.json'
import arcConnectionsData from '../data/arcConnections.json'
import speakerAssignments from '../data/speakerAssignments.json'
import annotationsText from '../data/annotations.txt?raw'
import speakerAnnotationsText from '../data/speaker_annotations.txt?raw'
import { parseSpeakerAnnotations } from '../utils/annotationParser'
import { resolveAnnotations } from '../utils/scholarlyAnnotations'
import type { ScholarlyAnnotation } from '../utils/scholarlyAnnotations'

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
  annotation?: string // New field for speaker-specific annotations
}

export type ArcConnection = {
  id: string
  source: number
  target: number
  type: 'reference' | 'echo' | 'allusion' | 'motif' | 'voice' | 'imagery'
  description: string
}

export type { ScholarlyAnnotation }

type PoemState = {
  isLoading: boolean
  lines: PoemLine[]
  activeWordIds: Set<string>
  activeAnnotations: Annotation[]
  hoveredArcId: string | null
  arcConnections: ArcConnection[]
  speakers: Record<string, Speaker>
  showSpeakerColors: boolean
  showInlineArcs: boolean
  showAnnotationHighlights: boolean
  scholarlyAnnotations: ScholarlyAnnotation[]
  activeScholarlyAnnotation: ScholarlyAnnotation | null
  annotationViewMode: 'focused' | 'all' | 'speakers'
  hasUserScrolled: boolean
  // Scroll tracking for minimap
  scrollState: {
    scrollTop: number
    viewportHeight: number
    scrollHeight: number
  }
  // New state for speaker annotation selection
  activeSpeakerAnnotationId: string | null

  loadPoem: () => void
  toggleWord: (tokenId: string) => void
  setHoveredArc: (arcId: string | null) => void
  toggleSpeakerColors: () => void
  toggleInlineArcs: () => void
  toggleAnnotationHighlights: () => void
  setActiveAnnotation: (annotationId: string | null) => void
  setAnnotationViewMode: (mode: 'focused' | 'all' | 'speakers') => void
  setScrollState: (scrollTop: number, viewportHeight: number, scrollHeight: number) => void
  setActiveSpeakerAnnotation: (speakerId: string | null) => void
}

export const usePoemStore = create<PoemState>((set, get) => ({
  isLoading: false,
  lines: [],
  activeWordIds: new Set(),
  activeAnnotations: [],
  hoveredArcId: null,
  arcConnections: (() => {
    // Create a map of verse number to global line number
    const verseToGlobal = new Map<number, number>()
    wastelandVerses.verses.forEach((v: any) => {
      verseToGlobal.set(v.verseNumber, v.lineNumber)
    })

    return (arcConnectionsData.connections as ArcConnection[]).map(conn => ({
      ...conn,
      source: verseToGlobal.get(conn.source) || conn.source,
      target: verseToGlobal.get(conn.target) || conn.target
    }))
  })(),
  // Augment speaker data with annotations
  speakers: (() => {
    const annotations = parseSpeakerAnnotations(speakerAnnotationsText)
    const speakersWithAnnotations = { ...speakerAssignments.speakers } as Record<string, Speaker>


    // Helper to find speaker ID by various keys
    const findSpeakerId = (key: string): string | undefined => {
      // 1. Try exact ID match
      if (speakersWithAnnotations[key]) return key

      const lowerKey = key.toLowerCase()
      const entry = Object.entries(speakersWithAnnotations).find(([_, s]) =>
        s.name.toLowerCase() === lowerKey || s.casualName.toLowerCase() === lowerKey
      )

      return entry ? entry[0] : undefined
    }

    // Merge annotations into speakers
    Object.entries(annotations).forEach(([key, annotation]) => {
      const speakerId = findSpeakerId(key)
      if (speakerId && speakersWithAnnotations[speakerId]) {
        speakersWithAnnotations[speakerId] = {
          ...speakersWithAnnotations[speakerId],
          annotation
        }
      }
    })

    return speakersWithAnnotations
  })(),
  showSpeakerColors: false,
  showInlineArcs: true,
  showAnnotationHighlights: true,
  scholarlyAnnotations: [],
  activeScholarlyAnnotation: null,
  annotationViewMode: 'focused',
  hasUserScrolled: false,
  scrollState: {
    scrollTop: 0,
    viewportHeight: 0,
    scrollHeight: 0
  },
  activeSpeakerAnnotationId: null,

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
        language: line.language,
        // Assign speaker based on line type or verse number
        speakerId: line.type === 'epigraph'
          ? 'speaker-epigraph'
          : undefined // Default to undefined, will be set for verses below
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

      }

      return poemLine
    })

    // Anchor scholarly annotations onto the tokenized poem
    const { annotations, problems } = resolveAnnotations(lines, annotationsText)
    if (problems.length > 0) {
      console.warn(
        `[annotations] ${problems.length} annotation(s) failed to anchor:\n` +
          problems.map((p) => `  - ${p}`).join('\n')
      )
    }

    set({ lines, scholarlyAnnotations: annotations, isLoading: false })
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
  toggleInlineArcs() {
    set({ showInlineArcs: !get().showInlineArcs })
  },
  toggleAnnotationHighlights() {
    set({ showAnnotationHighlights: !get().showAnnotationHighlights })
  },
  setActiveAnnotation(annotationId: string | null) {
    // Clear speaker annotation if setting a scholarly one
    if (annotationId) {
      set({ activeSpeakerAnnotationId: null, annotationViewMode: 'focused' })
    }
    const annotation = annotationId
      ? get().scholarlyAnnotations.find((a) => a.id === annotationId) || null
      : null
    set({ activeScholarlyAnnotation: annotation })
  },
  setActiveSpeakerAnnotation(speakerId: string | null) {
    // Clear scholarly annotation if setting a speaker one
    if (speakerId) {
      set({ activeScholarlyAnnotation: null, annotationViewMode: 'focused' })
    }
    set({ activeSpeakerAnnotationId: speakerId })
  },
  setAnnotationViewMode(mode: 'focused' | 'all' | 'speakers') {
    set({ annotationViewMode: mode })
  },
  setScrollState(scrollTop: number, viewportHeight: number, scrollHeight: number) {
    const alreadyScrolled = get().hasUserScrolled
    const nowScrolled = alreadyScrolled || scrollTop > 0
    set({
      scrollState: { scrollTop, viewportHeight, scrollHeight },
      hasUserScrolled: nowScrolled,
    })
  },
}))

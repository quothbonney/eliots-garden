import type { PoemLine } from '../state/poemStore'

export type ScholarlyAnnotation = {
  id: string
  phrase: string
  // Human-readable anchor shown in the UI: 'Epigraph', 'Dedication', 'Line 60', 'Lines 60–63'
  displayRef: string
  annotation: string
  sources: string[]
}

type AnchorSpec =
  | { kind: 'epigraph' }
  | { kind: 'dedication' }
  | { kind: 'verse'; start: number; end: number }

type Block = {
  id?: string
  anchor?: AnchorSpec
  anchorRaw?: string
  phrase: string
  sources: string[]
  body: string
  blockIndex: number
}

export type ResolveResult = {
  annotations: ScholarlyAnnotation[]
  problems: string[]
}

// ---------------------------------------------------------------------------
// Parsing: the annotations.txt block format
//
//   ===
//   id: unreal-city          (optional — defaults to a slug of the phrase)
//   line: 60                 (verse number; also `60-63`, `epigraph`, `dedication`;
//                             optional when the phrase is unique in the poem)
//   phrase: Unreal City
//   source: Baudelaire | Dante, Inferno III   (optional, `|`-separated)
//   annotation:
//   Markdown body until the next `===`.
//
// Lines starting with `#` outside the annotation body are comments.
// ---------------------------------------------------------------------------

export function parseAnnotationBlocks(text: string): { blocks: Block[]; problems: string[] } {
  const problems: string[] = []
  const blocks: Block[] = []

  const chunks = text.split(/^===\s*$/m).slice(1) // ignore preamble before first ===

  chunks.forEach((chunk, blockIndex) => {
    const lines = chunk.split('\n')
    const block: Partial<Block> & { sources: string[] } = { sources: [], blockIndex }
    let bodyStart = -1

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (/^\s*#/.test(line)) continue
      if (/^\s*$/.test(line)) continue

      const m = line.match(/^(id|line|phrase|source|sources|annotation)\s*:\s*(.*)$/i)
      if (!m) {
        problems.push(`Block ${blockIndex + 1}: unexpected header line ${JSON.stringify(line.trim())} (expected id/line/phrase/source/annotation)`)
        continue
      }
      const key = m[1].toLowerCase()
      const value = m[2].trim()

      if (key === 'annotation') {
        bodyStart = i + 1
        break
      } else if (key === 'id') {
        block.id = value
      } else if (key === 'phrase') {
        block.phrase = value
      } else if (key === 'source' || key === 'sources') {
        block.sources.push(...value.split('|').map((s) => s.trim()).filter(Boolean))
      } else if (key === 'line') {
        block.anchorRaw = value
        const lower = value.toLowerCase()
        if (lower === 'epigraph') block.anchor = { kind: 'epigraph' }
        else if (lower === 'dedication') block.anchor = { kind: 'dedication' }
        else {
          const range = lower.match(/^(\d+)\s*[-–]\s*(\d+)$/)
          const single = lower.match(/^(\d+)$/)
          if (range) block.anchor = { kind: 'verse', start: +range[1], end: +range[2] }
          else if (single) block.anchor = { kind: 'verse', start: +single[1], end: +single[1] }
          else problems.push(`Block ${blockIndex + 1}: cannot parse line anchor ${JSON.stringify(value)}`)
        }
      }
    }

    const phrase = block.phrase
    if (!phrase) {
      problems.push(`Block ${blockIndex + 1}: missing phrase`)
      return
    }
    if (bodyStart === -1) {
      problems.push(`Block ${blockIndex + 1} (${phrase}): missing "annotation:" body`)
      return
    }

    const body = lines.slice(bodyStart).join('\n').trim()
    if (!body) {
      problems.push(`Block ${blockIndex + 1} (${phrase}): empty annotation body`)
      return
    }

    blocks.push({ ...block, phrase, body } as Block)
  })

  return { blocks, problems }
}

// ---------------------------------------------------------------------------
// Matching
// ---------------------------------------------------------------------------

// Strip BOM/CR, unify quote glyphs, drop punctuation, collapse whitespace.
const normalizeText = (s: string) =>
  s
    .replace(/[﻿\r]/g, '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/[“”«»]/g, '"')
    .replace(/[.,;:!?—–\-'"()[\]/…]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const normalizedWords = (s: string) => {
  const n = normalizeText(s)
  return n ? n.split(' ') : []
}

const slugify = (s: string) =>
  normalizeText(s).replace(/ /g, '-').slice(0, 48).replace(/-+$/, '') || 'annotation'

type WordEntry = {
  norm: string
  lineIdx: number
  wordIdx: number
}

const ANNOTATABLE = new Set(['verse', 'epigraph', 'dedication'])

function describeLocation(line: PoemLine): string {
  if (line.type === 'epigraph') return 'Epigraph'
  if (line.type === 'dedication') return 'Dedication'
  return `Line ${line.verseNumber ?? `(doc ${line.lineNumber})`}`
}

function displayRefFor(startLine: PoemLine, endLine: PoemLine): string {
  if (startLine.type === 'epigraph') return 'Epigraph'
  if (startLine.type === 'dedication') return 'Dedication'
  const a = startLine.verseNumber
  const b = endLine.verseNumber
  if (a && b && b > a) return `Lines ${a}–${b}`
  return `Line ${a}`
}

/**
 * Resolves annotation blocks against the tokenized poem. Marks matched tokens
 * with `annotationId` (mutating `lines`) and returns the annotation list in
 * poem order plus a list of human-readable problems (unmatched phrases,
 * ambiguous anchors, overlaps). An annotation with a problem is never
 * silently half-applied: it either anchors cleanly or is reported.
 */
export function resolveAnnotations(lines: PoemLine[], text: string): ResolveResult {
  const { blocks, problems } = parseAnnotationBlocks(text)

  // Flatten poem into a stream of normalized words that point back at tokens.
  const entries: WordEntry[] = []
  lines.forEach((line, lineIdx) => {
    if (!ANNOTATABLE.has(line.type)) return
    line.words.forEach((word, wordIdx) => {
      if (word.isWhitespace) return
      for (const norm of normalizedWords(word.text)) {
        entries.push({ norm, lineIdx, wordIdx })
      }
    })
  })

  type Match = { start: number; end: number } // inclusive entry indices
  const findMatches = (phraseWords: string[]): Match[] => {
    const matches: Match[] = []
    outer: for (let i = 0; i + phraseWords.length <= entries.length; i++) {
      for (let j = 0; j < phraseWords.length; j++) {
        if (entries[i + j].norm !== phraseWords[j]) continue outer
        // Don't let a phrase bridge distant lines (e.g. across a stanza gap).
        if (j > 0) {
          const prev = lines[entries[i + j - 1].lineIdx].lineNumber
          const cur = lines[entries[i + j].lineIdx].lineNumber
          if (cur - prev > 3) continue outer
        }
      }
      matches.push({ start: i, end: i + phraseWords.length - 1 })
    }
    return matches
  }

  const matchesAnchor = (m: Match, anchor: AnchorSpec): boolean => {
    const line = lines[entries[m.start].lineIdx]
    if (anchor.kind === 'epigraph') return line.type === 'epigraph'
    if (anchor.kind === 'dedication') return line.type === 'dedication'
    const v = line.verseNumber
    return v !== undefined && v >= anchor.start && v <= anchor.end
  }

  const claimed = new Map<string, string>() // token id -> annotation id
  const usedIds = new Set<string>()
  const resolved: Array<ScholarlyAnnotation & { order: number }> = []

  for (const block of blocks) {
    const label = block.phrase.length > 40 ? block.phrase.slice(0, 40) + '…' : block.phrase
    const phraseWords = normalizedWords(block.phrase)
    if (phraseWords.length === 0) {
      problems.push(`"${label}": phrase is empty after normalization`)
      continue
    }

    const all = findMatches(phraseWords)
    let candidates = all
    if (block.anchor) {
      candidates = all.filter((m) => matchesAnchor(m, block.anchor!))
      if (candidates.length === 0 && all.length > 0) {
        const where = all.map((m) => describeLocation(lines[entries[m.start].lineIdx])).join(', ')
        problems.push(`"${label}": not found at ${block.anchorRaw}, but found at: ${where}`)
        continue
      }
    }
    if (candidates.length === 0) {
      problems.push(`"${label}": phrase not found in the poem`)
      continue
    }
    if (candidates.length > 1) {
      const where = candidates.map((m) => describeLocation(lines[entries[m.start].lineIdx])).join(', ')
      problems.push(`"${label}": ambiguous — found at ${where}. Add or narrow the line: anchor.`)
      continue
    }

    const match = candidates[0]
    const id = block.id ?? slugify(block.phrase)
    if (usedIds.has(id)) {
      problems.push(`"${label}": duplicate id "${id}"`)
      continue
    }

    // Collect the tokens this match covers and refuse to stack annotations.
    const tokens: Array<{ lineIdx: number; wordIdx: number }> = []
    const seen = new Set<string>()
    let conflict: string | null = null
    for (let i = match.start; i <= match.end; i++) {
      const { lineIdx, wordIdx } = entries[i]
      const token = lines[lineIdx].words[wordIdx]
      if (seen.has(token.id)) continue
      seen.add(token.id)
      const owner = claimed.get(token.id)
      if (owner) conflict = owner
      tokens.push({ lineIdx, wordIdx })
    }
    if (conflict) {
      problems.push(`"${label}": overlaps annotation "${conflict}" — annotations must not share words`)
      continue
    }

    usedIds.add(id)
    for (const { lineIdx, wordIdx } of tokens) {
      const token = lines[lineIdx].words[wordIdx] as any
      token.annotationId = id
      claimed.set(token.id, id)
    }

    const startLine = lines[entries[match.start].lineIdx]
    const endLine = lines[entries[match.end].lineIdx]
    resolved.push({
      id,
      phrase: block.phrase,
      displayRef: displayRefFor(startLine, endLine),
      annotation: block.body,
      sources: block.sources,
      order: match.start,
    })
  }

  resolved.sort((a, b) => a.order - b.order)
  return {
    annotations: resolved.map(({ order: _order, ...a }) => a),
    problems,
  }
}

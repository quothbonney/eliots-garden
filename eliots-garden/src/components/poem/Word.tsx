import { usePoemStore } from '../../state/poemStore'
import { clsx } from 'clsx'

interface WordProps {
  word: Token
  lineType?: string
}

export function Word({ word, lineType }: WordProps) {
  const toggleWord = usePoemStore((s) => s.toggleWord)
  const isActive = usePoemStore((s) => s.activeWordIds.has(word.id))

  if (word.isWhitespace) {
    return <span>{word.text}</span>
  }

  // Don't make epigraph, dedication, or headers interactive
  if (lineType && ['epigraph', 'dedication', 'section_header'].includes(lineType)) {
    return <span>{word.text}</span>
  }

  return (
    <button
      onClick={() => toggleWord(word.id)}
      className={clsx('px-0.5 rounded-sm transition-colors', isActive ? 'bg-white/10' : 'hover:bg-white/5')}
    >
      <span>{word.text}</span>
    </button>
  )
}

export type Token = {
  id: string
  text: string
  lineId: string
  charStart: number
  charEnd: number
  isWhitespace: boolean
  annotations: Annotation[]
}

export type Annotation = {
  id: string
  kind: 'reference' | 'footnote' | 'translation' | 'allusion' | 'gloss'
  content: string
  targets: Array<{ lineId: string; tokenId: string }>
}



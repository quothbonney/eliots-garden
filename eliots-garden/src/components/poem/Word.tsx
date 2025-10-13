import { usePoemStore } from '../../state/poemStore'
import { clsx } from 'clsx'

interface WordProps {
  word: Token
  lineType?: string
  speakerColor?: string
  hasNextInGroup?: boolean
}

export function Word({ word, lineType, speakerColor, hasNextInGroup }: WordProps) {
  const toggleWord = usePoemStore((s) => s.toggleWord)
  const isActive = usePoemStore((s) => s.activeWordIds.has(word.id))
  const showSpeakerColors = usePoemStore((s) => s.showSpeakerColors)
  const setActiveAnnotation = usePoemStore((s) => s.setActiveAnnotation)
  const activeAnnotation = usePoemStore((s) => s.activeScholarlyAnnotation)

  if (word.isWhitespace) {
    return <span>{word.text}</span>
  }

  // Don't make epigraph, dedication, or headers interactive
  if (lineType && ['epigraph', 'dedication', 'section_header'].includes(lineType)) {
    return <span style={showSpeakerColors && speakerColor ? { color: speakerColor } : undefined}>{word.text}</span>
  }

  const style = showSpeakerColors && speakerColor ? { color: speakerColor } : undefined
  const isAnnotated = !!word.annotationId
  const isAnnotationActive = word.annotationId && activeAnnotation?.id === word.annotationId

  return (
    <button
      onClick={() => {
        if (word.annotationId) {
          setActiveAnnotation(isAnnotationActive ? null : word.annotationId)
        } else {
          toggleWord(word.id)
        }
      }}
      className={clsx(
        'px-0.5 transition-all duration-300 relative inline-block',
        isAnnotated && 'cursor-pointer',
        !isAnnotated && (isActive ? 'bg-white/10 rounded-sm' : 'hover:bg-white/5 rounded-sm')
      )}
      style={style}
    >
      <span className="relative group/word">
        {word.text}
        {isAnnotated && (
          <span
            className={clsx(
              'absolute bottom-0 h-[1px] transition-all duration-300',
              hasNextInGroup ? 'left-0 right-[-2px]' : 'left-0 right-0',
              isAnnotationActive
                ? 'bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : 'bg-amber-400/60 group-hover/word:bg-amber-400/85 group-hover/word:shadow-[0_0_6px_rgba(251,191,36,0.4)]'
            )}
            style={{
              animation: isAnnotationActive ? 'none' : 'pulse-underline 3s ease-in-out infinite',
            }}
          />
        )}
      </span>
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
  annotationId?: string  // ID of scholarly annotation
}

export type Annotation = {
  id: string
  kind: 'reference' | 'footnote' | 'translation' | 'allusion' | 'gloss'
  content: string
  targets: Array<{ lineId: string; tokenId: string }>
}



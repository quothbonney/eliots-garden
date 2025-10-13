import { usePoemStore } from '../../state/poemStore'
import { Word } from './Word'
import { InlineArcs } from './InlineArcs'
import { clsx } from 'clsx'

export function PoemView() {
  const lines = usePoemStore((s) => s.lines)
  const isLoading = usePoemStore((s) => s.isLoading)

  if (isLoading) {
    return <div className="p-12 text-white/60">Loading poem…</div>
  }

  return (
    <div className="relative">
      {/* Inline arcs SVG overlay */}
      <InlineArcs />
      
      {/* Poem text */}
      <div id="poem-content" className="p-12 max-w-4xl mx-auto relative z-10">
        {lines.map((line) => {
          // Style based on line type
          const lineClasses = clsx({
            // Epigraph - centered, smaller, italic
            'text-center text-sm italic text-white/80 mb-1': line.type === 'epigraph',
            // Dedication - centered, italic, indented
            'text-center italic text-white/90 mb-1': line.type === 'dedication',
            // Section headers - centered, uppercase, spaced
            'text-center uppercase tracking-wider text-lg font-light my-8': line.type === 'section_header',
            // Regular verse
            'leading-relaxed': line.type === 'verse',
            // Blank lines
            'h-4': line.type === 'blank',
            // Foreign language passages
            'italic': line.italic,
          })
          
          // Add line numbers for verse lines
          const showLineNumber = line.type === 'verse' && line.verseNumber && line.verseNumber % 10 === 0
          
          return (
            <div 
              key={line.id} 
              className="group relative"
              data-line-number={line.lineNumber}
              {...(line.verseNumber ? { 'data-verse-number': line.verseNumber } : {})}
            >
              {showLineNumber && (
                <span className="absolute -left-12 text-xs text-white/30 select-none">
                  {line.verseNumber}
                </span>
              )}
              <div className={lineClasses}>
                {line.type === 'blank' ? (
                  <>&nbsp;</>
                ) : line.type === 'section_header' ? (
                  <span>{line.text}</span>
                ) : (
                  line.words.map((w) => (
                    <Word key={w.id} word={w} lineType={line.type} />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}



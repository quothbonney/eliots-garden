import { usePoemStore } from '../../state/poemStore'
import { Word } from './Word'
import { InlineArcs } from './InlineArcs'
import { clsx } from 'clsx'

export function PoemView() {
  const lines = usePoemStore((s) => s.lines)
  const isLoading = usePoemStore((s) => s.isLoading)
  const speakers = usePoemStore((s) => s.speakers)
  const showSpeakerColors = usePoemStore((s) => s.showSpeakerColors)

  if (isLoading) {
    return <div className="p-12 text-white/60">Loading poem…</div>
  }

  return (
    <div className="relative">
      {/* Inline arcs SVG overlay */}
      <InlineArcs />
      
      {/* Poem text */}
      <div id="poem-content" className="p-12 poem-container mx-auto relative z-10">
        {lines.map((line, lineIndex) => {
          // Check if this is the first line with a new speaker
          const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : null
          const isNewSpeaker = line.speakerId && line.speakerId !== prevLine?.speakerId
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
          
          const isFirstVerseInSection = line.type === 'verse' && line.verseNumber && (line.verseNumber === 1 || (lines.findIndex(l => l.lineNumber === line.lineNumber) > 0 && lines[lines.findIndex(l => l.lineNumber === line.lineNumber) - 1].type === 'section_header'))

          return (
            <div 
              key={line.id} 
              className={clsx('group relative', line.type === 'section_header' && 'poem-section', isFirstVerseInSection && 'first-verse')}
              data-line-number={line.lineNumber}
              {...(line.verseNumber ? { 'data-verse-number': line.verseNumber } : {})}
            >
              {/* Speaker label for new speaker */}
              {showSpeakerColors && isNewSpeaker && line.speakerId && (
                <div className="text-xs mb-1 mt-3" style={{ color: speakers[line.speakerId]?.color, opacity: 0.7 }}>
                  <span className="font-light tracking-wide">[ {speakers[line.speakerId]?.casualName} ]</span>
                </div>
              )}
              
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
                  line.words.map((w, i) => {
                    const speakerColor = line.speakerId ? speakers[line.speakerId]?.color : undefined
                    if (isFirstVerseInSection && i === 0 && !w.isWhitespace) {
                      return (
                        <span key={w.id} className="dropcap-letter">{w.text.charAt(0)}</span>
                      )
                    }
                    return <Word key={w.id} word={w} lineType={line.type} speakerColor={speakerColor} />
                  })
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}



import { usePoemStore } from '../../state/poemStore'
import { Word } from './Word'
import { InlineArcs } from './InlineArcs'
import { clsx } from 'clsx'
import wastelandWhiteSvg from '../../assets/wasteland_white.svg'
import { useEffect } from 'react'
import type { RefObject } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

interface PoemViewProps {
  scrollContainerRef?: RefObject<any>
}

export function PoemView({ scrollContainerRef }: PoemViewProps) {
  const lines = usePoemStore((s) => s.lines)
  const isLoading = usePoemStore((s) => s.isLoading)
  const speakers = usePoemStore((s) => s.speakers)
  const showSpeakerColors = usePoemStore((s) => s.showSpeakerColors)
  const showInlineArcs = usePoemStore((s) => s.showInlineArcs)
  const showAnnotationHighlights = usePoemStore((s) => s.showAnnotationHighlights)
  const activeScholarlyAnnotation = usePoemStore((s) => s.activeScholarlyAnnotation)
  const setScrollState = usePoemStore((s) => s.setScrollState)
  const setActiveAnnotation = usePoemStore((s) => s.setActiveAnnotation)
  const setActiveSpeakerAnnotation = usePoemStore((s) => s.setActiveSpeakerAnnotation)
  const activeSpeakerAnnotationId = usePoemStore((s) => s.activeSpeakerAnnotationId)

  // Scroll-based fade out for title
  const { scrollY } = useScroll({
    container: scrollContainerRef
  })

  const titleOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const titleScale = useTransform(scrollY, [0, 300], [1, 0.95])
  const titleBlur = useTransform(scrollY, [0, 300], ["0px", "10px"])

  // Handle scroll effect for minimap only; title animation is handled
  // separately in a lightweight component that reads scroll state.
  useEffect(() => {
    let rafId: number | null = null

    const handleScroll = (e: Event) => {
      const container = e.target as HTMLElement
      if (!container) return

      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight
      const scrollHeight = container.scrollHeight

      // Throttle visual updates
      if (rafId === null) {
        rafId = requestAnimationFrame(() => {
          setScrollState(scrollTop, clientHeight, scrollHeight)
          rafId = null
        })
      }
    }

    // Attach to the main scrollable area
    const scrollContainer = document.querySelector('main')
    if (scrollContainer) {
      // Initialize with current state
      setScrollState(scrollContainer.scrollTop, scrollContainer.clientHeight, scrollContainer.scrollHeight)

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true })
      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll)
        if (rafId !== null) cancelAnimationFrame(rafId)
      }
    }
  }, [setScrollState])

  if (isLoading) {
    return <div className="p-12 text-white/60">Loading poem…</div>
  }

  return (
    <div className="relative w-full">
      {/* Inline arcs SVG overlay */}
      {showInlineArcs && <InlineArcs />}

      {/* Static SVG Title - with scroll-based animation */}
      <motion.div
        className="absolute left-0 right-0 z-20 flex justify-center items-center pointer-events-none"
        style={{
          top: '100px',
          height: '200px',
          opacity: titleOpacity,
          scale: titleScale,
          filter: useTransform(titleBlur, (blur) => `blur(${blur})`),
        }}
      >
        <div className="relative w-full flex justify-center items-center h-full">
          <img
            src={wastelandWhiteSvg}
            alt="The Waste Land"
            className="w-[90vw] max-w-[675px] object-contain"
            style={{
              filter: 'drop-shadow(0 0 40px rgba(255,255,255,0.4))',
              opacity: 0.95,
            }}
          />
          {/* Subtle glow reflection underneath */}
          <div
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-32 blur-3xl pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(255,255,255,0.25) 0%, transparent 70%)',
              width: '70vw',
              maxWidth: '450px',
            }}
          />
        </div>
      </motion.div>

      {/* Poem text */}
      <div id="poem-content" className="px-6 py-12 sm:p-12 poem-container mx-auto relative z-10">
        {/* Spacer for absolute positioned title - Increased spacing */}
        <div className="h-[400px] w-full"></div>

        {lines.map((line, lineIndex) => {
          // Check if this is the first line with a new speaker
          const prevLine = lineIndex > 0 ? lines[lineIndex - 1] : null
          const isNewSpeaker = line.speakerId && line.speakerId !== prevLine?.speakerId
          const hasSpeakerAnnotation = isNewSpeaker && line.speakerId && speakers[line.speakerId]?.annotation

          // Style based on line type
          const lineClasses = clsx({
            // Epigraph - centered, smaller, italic
            'text-center text-sm italic text-white/80 mb-1': line.type === 'epigraph',
            // Dedication - centered, italic, indented
            'text-center italic text-white/90 mb-1': line.type === 'dedication',
            // Section headers - centered, uppercase, spaced
            'text-center uppercase tracking-wider text-lg font-light my-8 drop-shadow-[0_4px_6px_rgba(0,0,0,0.9)] text-shadow-sm': line.type === 'section_header',
            // Regular verse
            'leading-relaxed': line.type === 'verse',
            // Blank lines
            'h-4': line.type === 'blank',
            // Foreign language passages
            'italic': line.italic,
          })

          // Add line numbers for verse lines
          const showLineNumber = line.type === 'verse' && line.verseNumber && line.verseNumber % 10 === 0

          // First verse of a section: previous non-blank line is its header
          const prevContent = (() => {
            for (let k = lineIndex - 1; k >= 0; k--) {
              if (lines[k].type !== 'blank') return lines[k]
            }
            return null
          })()
          const isFirstVerseInSection = line.type === 'verse' && prevContent?.type === 'section_header'
          const dropcapIdx = isFirstVerseInSection
            ? line.words.findIndex((w) => !w.isWhitespace && w.text.length > 0)
            : -1

          return (
            <div
              key={line.id}
              className={clsx('group relative', line.type === 'section_header' && 'poem-section', isFirstVerseInSection && 'first-verse')}
              data-line-number={line.lineNumber}
              {...(line.verseNumber ? { 'data-verse-number': line.verseNumber } : {})}
            >
              {/* Speaker label for new speaker */}
              {showSpeakerColors && isNewSpeaker && line.speakerId && (
                <div
                  className="text-xs mb-1 mt-3 flex items-center gap-2 group/speaker"
                  style={{ color: speakers[line.speakerId]?.color, opacity: 0.9 }}
                >
                  <span className="font-light tracking-wide">[ {speakers[line.speakerId]?.casualName} ]</span>

                  {/* Speaker annotation indicator */}
                  {hasSpeakerAnnotation && (
                    <button
                      onClick={() => setActiveSpeakerAnnotation(line.speakerId!)}
                      className={clsx(
                        "w-4 h-4 flex items-center justify-center rounded-full border transition-all duration-300",
                        activeSpeakerAnnotationId === line.speakerId
                          ? "bg-current text-black scale-110 shadow-[0_0_10px_currentColor]"
                          : "border-current hover:bg-current/20 hover:scale-110"
                      )}
                      title="View speaker note"
                    >
                      <span className="text-[10px] font-bold">i</span>
                    </button>
                  )}
                </div>
              )}

              {showLineNumber && (
                <span className="hidden sm:block absolute -left-12 text-xs text-white/30 select-none">
                  {line.verseNumber}
                </span>
              )}
              <div className={lineClasses}>
                {line.type === 'blank' ? (
                  <>&nbsp;</>
                ) : line.type === 'section_header' ? (
                  <span>{line.text}</span>
                ) : (
                  (() => {
                    const elements: React.ReactElement[] = []

                    for (let i = 0; i < line.words.length; i++) {
                      const w = line.words[i]
                      const speakerColor =
                        showSpeakerColors && line.speakerId ? speakers[line.speakerId]?.color : undefined

                      // Group contiguous annotated tokens, bridging whitespace to the next annotated token with same id
                      if (showAnnotationHighlights && w.annotationId) {
                        const annId = w.annotationId
                        let j = i
                        while (j + 1 < line.words.length) {
                          const next = line.words[j + 1]
                          if (!next) break
                          if (next.isWhitespace) {
                            // Look ahead to next non-whitespace
                            let k = j + 1
                            while (k + 1 < line.words.length && line.words[k + 1].isWhitespace) k++
                            const nextNonWs = line.words[k + 1]
                            if (nextNonWs && nextNonWs.annotationId === annId) {
                              j = k + 1
                              continue
                            }
                            break
                          }
                          if (next.annotationId === annId) {
                            j = j + 1
                            continue
                          }
                          break
                        }

                        // Always use group rendering for annotated words (even single ones)
                        const groupWords = line.words.slice(i, j + 1)
                        const isActive = activeScholarlyAnnotation?.id === annId
                        const underlineClass = clsx(
                          'absolute bottom-0 left-0 right-0 h-[1.5px] transition-all duration-300',
                          isActive
                            ? 'bg-amber-400/90 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                            : 'bg-amber-400/75 group-hover:bg-amber-400/90 group-hover:shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                        )
                        elements.push(
                          <button
                            key={`${w.id}-grp`}
                            className="relative inline-block group cursor-pointer text-left"
                            onClick={() => setActiveAnnotation(isActive ? null : annId)}
                            aria-expanded={isActive}
                            aria-label={`Annotation: ${groupWords.filter((gw) => !gw.isWhitespace).map((gw) => gw.text).join(' ')}`}
                          >
                            {groupWords.map((gw, gi) => (
                              <Word
                                key={gw.id}
                                word={gw}
                                speakerColor={speakerColor}
                                dropcap={i + gi === dropcapIdx}
                              />
                            ))}
                            <span
                              className={underlineClass}
                              style={{
                                animation: isActive ? 'none' : 'pulse-underline 3s ease-in-out infinite',
                              }}
                            />
                          </button>
                        )
                        i = j
                        continue
                      }

                      // Non-annotated words
                      elements.push(
                        <Word
                          key={w.id}
                          word={w}
                          speakerColor={speakerColor}
                          dropcap={i === dropcapIdx}
                        />
                      )
                    }

                    return elements
                  })()
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

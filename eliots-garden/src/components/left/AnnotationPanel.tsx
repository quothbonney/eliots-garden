import { lazy, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePoemStore } from '../../state/poemStore'

// react-markdown (plus its remark pipeline) is ~40 kB gz; load it off the
// critical path since it only renders annotation prose
const ReactMarkdownLazy = lazy(() => import('react-markdown'))
const ReactMarkdown = ({ components, children }: { components: any; children: string }) => (
  <Suspense fallback={null}>
    <ReactMarkdownLazy components={components}>{children}</ReactMarkdownLazy>
  </Suspense>
)

export function AnnotationPanel({ hideTitle = false }: { hideTitle?: boolean }) {
  const activeAnnotation = usePoemStore((s) => s.activeScholarlyAnnotation)
  const activeSpeakerId = usePoemStore((s) => s.activeSpeakerAnnotationId)
  const setActiveSpeakerAnnotation = usePoemStore((s) => s.setActiveSpeakerAnnotation)
  const speakers = usePoemStore((s) => s.speakers)
  const viewMode = usePoemStore((s) => s.annotationViewMode)
  const setViewMode = usePoemStore((s) => s.setAnnotationViewMode)
  const allAnnotations = usePoemStore((s) => s.scholarlyAnnotations)
  const setActiveAnnotation = usePoemStore((s) => s.setActiveAnnotation)

  // Helper to handle view mode switching
  const handleViewModeChange = (mode: 'focused' | 'all' | 'speakers') => {
    // Clear selections when switching to list views
    if (mode === 'all' || mode === 'speakers') {
      setActiveAnnotation(null)
      setActiveSpeakerAnnotation(null)
    }
    setViewMode(mode)
  }

  // Markdown components configuration
  const markdownComponents = {
    p: ({ children }: any) => <p className="mb-4 last:mb-0 leading-[1.75]">{children}</p>,
    em: ({ children }: any) => <em className="font-serif italic text-amber-100/80">{children}</em>,
    strong: ({ children }: any) => <strong className="font-medium text-white/90">{children}</strong>,
    a: ({ href, children }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-amber-300/80 hover:text-amber-300 underline decoration-amber-300/30 underline-offset-2 transition-colors"
      >
        {children}
      </a>
    ),
    img: ({ src, alt }: any) => (
      <img
        src={src}
        alt={alt}
        className="rounded-sm border border-white/10 my-4 w-full object-cover"
      />
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-white/20 pl-4 my-4 italic text-white/60">
        {children}
      </blockquote>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-black/40 flex flex-col">
      {/* Header */}
      <div className={hideTitle ? 'px-6 pt-3 pb-3' : 'px-6 pt-6 pb-4'}>
        {!hideTitle && (
          <div className="flex justify-between items-baseline mb-4">
            <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 font-light">
              Marginalia
            </h2>
          </div>
        )}

        {/* View Mode Toggle */}
        <div className="flex gap-2 p-1 bg-white/5 rounded-sm justify-start">
          {(['focused', 'speakers', 'all'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => handleViewModeChange(mode)}
              className="px-3 py-1.5 text-[10px] font-light tracking-wider uppercase rounded-sm transition-all duration-200"
              style={{
                backgroundColor: viewMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: viewMode === mode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)',
                boxShadow: viewMode === mode ? '0 1px 2px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {mode === 'all' ? 'All Notes' : mode}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">

          {/* SPEAKERS LIST VIEW */}
          {viewMode === 'speakers' && (
            <motion.div
              key="speakers-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-1"
            >
              {Object.entries(speakers).map(([id, speaker]) => (
                <button
                  key={id}
                  onClick={() => {
                    setActiveSpeakerAnnotation(id)
                    setViewMode('focused')
                  }}
                  className="w-full text-left group py-2 px-2 hover:bg-white/5 rounded transition-colors flex items-center gap-3"
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: speaker.color, boxShadow: `0 0 8px ${speaker.color}40` }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-[11px] font-medium tracking-wide text-white/80 group-hover:text-white transition-colors truncate">
                        {speaker.casualName}
                      </div>
                      {speaker.annotation && (
                        <div className="w-3.5 h-3.5 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                          <span className="text-[8px] font-serif italic text-white/60">i</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[10px] text-white/50 font-light truncate">
                      {speaker.type}
                    </div>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {/* ALL NOTES LIST VIEW */}
          {viewMode === 'all' && (
            <motion.div
              key="notes-list"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {allAnnotations.map((annotation) => (
                <article
                  key={annotation.id}
                  className="relative cursor-pointer group"
                  onClick={() => {
                    setActiveAnnotation(annotation.id)
                    setViewMode('focused')
                  }}
                >
                  <div className="absolute -left-2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-amber-400/20 via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="space-y-2">
                    <div className="pl-2 font-serif text-amber-200/70 text-sm leading-[1.4] tracking-wide group-hover:text-amber-200/90 transition-colors">
                      {annotation.phrase}
                    </div>
                    <div className="text-[12px] leading-[1.6] text-white/60 font-light tracking-wide line-clamp-3 group-hover:text-white/70 transition-colors">
                      <ReactMarkdown components={markdownComponents}>
                        {annotation.annotation}
                      </ReactMarkdown>
                    </div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-white/40 font-light">
                      {annotation.displayRef}
                    </div>
                  </div>
                </article>
              ))}
            </motion.div>
          )}

          {/* FOCUSED VIEW */}
          {viewMode === 'focused' && (
            <motion.div
              key={activeSpeakerId ? `speaker-${activeSpeakerId}` : activeAnnotation ? `annotation-${activeAnnotation.id}` : 'empty'}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {/* Case 1: Active Speaker Annotation */}
              {activeSpeakerId && speakers[activeSpeakerId] ? (
                <div className="space-y-5 pt-2">
                  {/* Speaker Name with Gradient Bar (matching Scholarly Phrase) */}
                  <div className="relative">
                    <div
                      className="absolute -left-2 top-0 bottom-0 w-[2px]"
                      style={{
                        background: `linear-gradient(to bottom, ${speakers[activeSpeakerId].color}66, ${speakers[activeSpeakerId].color}33, transparent)`
                      }}
                    />
                    <div
                      className="pl-4 font-serif text-base leading-[1.5] tracking-wide"
                      style={{ color: speakers[activeSpeakerId].color }}
                    >
                      {speakers[activeSpeakerId].casualName}
                    </div>
                  </div>

                  {/* Annotation Text (matching Scholarly Body) */}
                  <div className="text-[14px] leading-[1.75] text-white/75 font-light tracking-wide">
                    {speakers[activeSpeakerId].annotation ? (
                      <ReactMarkdown components={markdownComponents}>
                        {speakers[activeSpeakerId].annotation}
                      </ReactMarkdown>
                    ) : (
                      <span className="text-white/30 italic">No annotation available for this speaker.</span>
                    )}
                  </div>

                  <button
                    onClick={() => setViewMode('speakers')}
                    className="text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white/75 transition-colors font-light mt-6 flex items-center gap-2"
                  >
                    <span>←</span> Back to Speakers
                  </button>
                </div>
              ) :
                /* Case 2: Active Scholarly Annotation */
                activeAnnotation ? (
                  <article className="space-y-5 pt-2">
                    <div className="relative">
                      <div className="absolute -left-2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />
                      <div className="pl-4 font-serif text-amber-200/90 text-base leading-[1.5] tracking-wide">
                        {activeAnnotation.phrase}
                      </div>
                    </div>

                    <div className="text-[14px] leading-[1.75] text-white/75 font-light tracking-wide">
                      <ReactMarkdown components={markdownComponents}>
                        {activeAnnotation.annotation}
                      </ReactMarkdown>
                    </div>

                    {activeAnnotation.sources.length > 0 && (
                      <div className="pt-3 text-[10px] uppercase tracking-[0.15em] text-white/25 font-light">
                        {activeAnnotation.sources.map((source, i) => (
                          <span key={i}>
                            {i > 0 && <span className="mx-2">·</span>}
                            {source}
                          </span>
                        ))}
                      </div>
                    )}

                    <button
                      onClick={() => setViewMode('all')}
                      className="text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-white/75 transition-colors font-light mt-6 flex items-center gap-2"
                    >
                      <span>←</span> Back to All Notes
                    </button>
                  </article>
                ) : (
                  /* Case 3: Nothing Selected */
                  <div className="text-white/30 text-[13px] leading-[1.8] font-light tracking-wide pt-4 flex flex-col h-full justify-center items-center text-center space-y-6 opacity-60">
                    <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center">
                      <span className="text-xl font-serif italic text-white/20">i</span>
                    </div>
                    <div className="max-w-[200px]">
                      <p className="mb-2">
                        Select an item to view details.
                      </p>
                      <p className="text-white/20 text-[11px]">
                        Choose from All Notes or Speakers.
                      </p>
                    </div>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

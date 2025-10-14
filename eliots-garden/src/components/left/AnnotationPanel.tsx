import { motion, AnimatePresence } from 'framer-motion'
import { usePoemStore } from '../../state/poemStore'

export function AnnotationPanel() {
  const activeAnnotation = usePoemStore((s) => s.activeScholarlyAnnotation)
  const viewMode = usePoemStore((s) => s.annotationViewMode)
  const setViewMode = usePoemStore((s) => s.setAnnotationViewMode)
  const allAnnotations = usePoemStore((s) => s.scholarlyAnnotations)
  const setActiveAnnotation = usePoemStore((s) => s.setActiveAnnotation)

  return (
    <div className="h-full overflow-y-auto bg-black/40 flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 font-light">
          Marginalia
        </h2>
        <div className="mt-2 h-[1px] bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
        
        {/* View mode controls */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setViewMode('single')}
            className="px-2 py-1 text-[10px] font-light tracking-wider rounded-sm border transition-all duration-200"
            style={{
              backgroundColor: viewMode === 'single' ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderColor: viewMode === 'single' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              color: viewMode === 'single' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'
            }}
          >
            FOCUSED
          </button>
          <button
            onClick={() => setViewMode('all')}
            className="px-2 py-1 text-[10px] font-light tracking-wider rounded-sm border transition-all duration-200"
            style={{
              backgroundColor: viewMode === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderColor: viewMode === 'all' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
              color: viewMode === 'all' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'
            }}
          >
            ALL NOTES
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {viewMode === 'all' ? (
            <motion.div
              key="all"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {allAnnotations.map((annotation) => (
                <motion.article
                  key={annotation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative cursor-pointer group"
                  onClick={() => {
                    setActiveAnnotation(annotation.id)
                    setViewMode('single')
                  }}
                >
                  <div className="absolute -left-2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-amber-400/20 via-amber-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="space-y-2">
                    <div className="pl-2 font-serif text-amber-200/70 text-sm leading-[1.4] tracking-wide group-hover:text-amber-200/90 transition-colors">
                      {annotation.phrase}
                    </div>
                    <div className="text-[12px] leading-[1.6] text-white/60 font-light tracking-wide line-clamp-3 group-hover:text-white/70 transition-colors">
                      {annotation.annotation}
                    </div>
                    <div className="text-[9px] uppercase tracking-[0.15em] text-white/20 font-light">
                      Line {annotation.lineNumber}
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          ) : !activeAnnotation ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/30 text-[13px] leading-[1.8] font-light tracking-wide pt-4"
            >
              <p className="mb-4">
                Amber threads mark the annotated passages.
              </p>
              <p className="text-white/20">
                Touch them to unveil their meanings.
              </p>
            </motion.div>
          ) : (
            <motion.article
              key={activeAnnotation.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="space-y-5"
            >
              {/* Back button when in single view */}
              <button
                onClick={() => setViewMode('all')}
                className="text-[10px] uppercase tracking-[0.15em] text-white/30 hover:text-white/50 transition-colors font-light"
              >
                ← View All
              </button>
              
              {/* Phrase */}
              <div className="relative">
                <div className="absolute -left-2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-amber-400/40 via-amber-400/20 to-transparent" />
                <div className="pl-4 font-serif text-amber-200/90 text-base leading-[1.5] tracking-wide">
                  {activeAnnotation.phrase}
                </div>
              </div>

              {/* Annotation Text */}
              <div className="text-[14px] leading-[1.75] text-white/75 font-light tracking-wide">
                {activeAnnotation.annotation}
              </div>

              {/* Sources */}
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
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}



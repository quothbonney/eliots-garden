import { motion, AnimatePresence } from 'framer-motion'
import { usePoemStore } from '../../state/poemStore'

export function AnnotationPanel() {
  const activeAnnotation = usePoemStore((s) => s.activeScholarlyAnnotation)

  return (
    <div className="h-full overflow-y-auto bg-white/[0.02] flex flex-col">
      {/* Header */}
      <div className="border-b border-white/10 p-6 pb-4">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 font-light">
          Marginalia
        </h2>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <AnimatePresence mode="wait">
          {!activeAnnotation ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-white/40 text-sm leading-relaxed pt-8"
            >
              <p className="mb-3">
                Look for the subtle amber underlines throughout the poem.
              </p>
              <p>
                Click any underlined phrase to reveal scholarly annotations.
              </p>
            </motion.div>
          ) : (
            <motion.article
              key={activeAnnotation.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="space-y-6"
            >
              {/* Phrase */}
              <div className="space-y-2">
                <div className="font-serif italic text-amber-300/95 text-lg leading-snug">
                  "{activeAnnotation.phrase}"
                </div>
                <div className="h-px bg-gradient-to-r from-amber-400/30 via-amber-400/10 to-transparent" />
              </div>

              {/* Annotation Text */}
              <div className="text-[15px] leading-[1.7] text-white/85 font-light">
                {activeAnnotation.annotation}
              </div>

              {/* Sources */}
              {activeAnnotation.sources.length > 0 && (
                <div className="pt-4 border-t border-white/5 text-xs text-white/50 font-light tracking-wide">
                  <span className="text-white/40">Sources:</span>{' '}
                  {activeAnnotation.sources.join(', ')}
                </div>
              )}
            </motion.article>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}



import { motion } from 'framer-motion'
import { usePoemStore } from '../../state/poemStore'

export function AnnotationPanel() {
  const activeAnnotations = usePoemStore((s) => s.activeAnnotations)

  return (
    <div className="h-full overflow-y-auto p-6">
      <h2 className="text-xl tracking-wide mb-4">Annotations</h2>
      <div className="space-y-3">
        {activeAnnotations.length === 0 ? (
          <p className="text-sm text-white/60">Select a word to see notes.</p>
        ) : (
          activeAnnotations.map((a) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-md p-4"
            >
              <div className="text-xs uppercase tracking-wider text-white/60">{a.kind}</div>
              <div className="mt-1 text-sm leading-relaxed">{a.content}</div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}



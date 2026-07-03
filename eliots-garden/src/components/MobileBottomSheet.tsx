import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AnnotationPanel } from './left/AnnotationPanel'
import { usePoemStore } from '../state/poemStore'

const SHEET_HEIGHT = 'min(55dvh, 480px)'

export function MobileBottomSheet() {
  const [isOpen, setIsOpen] = useState(false)

  const showSpeakerColors = usePoemStore((s) => s.showSpeakerColors)
  const toggleSpeakerColors = usePoemStore((s) => s.toggleSpeakerColors)
  const showInlineArcs = usePoemStore((s) => s.showInlineArcs)
  const toggleInlineArcs = usePoemStore((s) => s.toggleInlineArcs)
  const showAnnotationHighlights = usePoemStore((s) => s.showAnnotationHighlights)
  const toggleAnnotationHighlights = usePoemStore((s) => s.toggleAnnotationHighlights)

  const activeAnnotationId = usePoemStore((s) => s.activeScholarlyAnnotation?.id ?? null)
  const activeSpeakerId = usePoemStore((s) => s.activeSpeakerAnnotationId)

  // Open the sheet when the reader taps an annotated word or speaker note,
  // so the annotation is actually visible on mobile.
  const prevSelectionRef = useRef<string | null>(null)
  useEffect(() => {
    const selection = activeAnnotationId ?? activeSpeakerId
    if (selection && selection !== prevSelectionRef.current) {
      setIsOpen(true)
    }
    prevSelectionRef.current = selection
  }, [activeAnnotationId, activeSpeakerId])

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{
          background: 'linear-gradient(to bottom, rgb(15,10,30), rgb(10,6,20))',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Handle / Toolbar */}
        <div className="flex items-center justify-between px-2 h-12 select-none">
          {/* Left: expand/collapse button (label + drag pill) */}
          <button
            className="flex items-center gap-3 h-12 px-2 cursor-pointer"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse marginalia panel' : 'Expand marginalia panel'}
          >
            <div
              className="w-8 h-[3px] rounded-full bg-white/20 transition-transform duration-300"
              style={{ transform: isOpen ? 'scaleX(0.6)' : 'scaleX(1)' }}
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/60 font-light">
              Marginalia
            </span>
          </button>

          {/* Right: control toggles */}
          <div className="flex items-center gap-1.5">
            {[
              { label: 'Speakers', active: showSpeakerColors, toggle: toggleSpeakerColors },
              { label: 'Arcs', active: showInlineArcs, toggle: toggleInlineArcs },
              { label: 'Notes', active: showAnnotationHighlights, toggle: toggleAnnotationHighlights },
            ].map(({ label, active, toggle }) => (
              <button
                key={label}
                onClick={toggle}
                aria-pressed={active}
                className="px-2.5 min-h-[44px] text-[11px] font-light tracking-wider rounded-sm transition-all duration-200"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: `1px solid ${active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Panel Content — height animates via CSS so the collapsed state is always exactly the toolbar */}
        <div
          style={{
            height: isOpen ? SHEET_HEIGHT : '0px',
            transition: 'height 320ms cubic-bezier(0.32, 0.72, 0, 1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ height: SHEET_HEIGHT }}>
            <AnnotationPanel hideTitle />
          </div>
        </div>
      </div>
    </>
  )
}

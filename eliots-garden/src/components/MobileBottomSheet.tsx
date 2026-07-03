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
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden shadow-[0_-12px_40px_rgba(0,0,0,0.55)]"
        style={{
          background: 'rgba(11,11,12,0.92)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Top hairline, mirroring the header rule */}
        <div className="relative">
          <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
          <div className="absolute left-1/4 right-1/4 h-[1px] bg-white/[0.06]" />
        </div>

        {/* Handle / Toolbar */}
        <div className="flex items-center justify-between px-2 h-12 select-none">
          {/* Left: expand/collapse button (label + drag pill) */}
          <button
            className="flex items-center gap-2.5 h-12 px-2 cursor-pointer"
            onClick={() => setIsOpen((v) => !v)}
            aria-expanded={isOpen}
            aria-label={isOpen ? 'Collapse marginalia panel' : 'Expand marginalia panel'}
          >
            <div
              className="w-6 h-[3px] rounded-full bg-white/20 transition-transform duration-300"
              style={{ transform: isOpen ? 'scaleX(0.6)' : 'scaleX(1)' }}
            />
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-light">
              Marginalia
            </span>
          </button>

          {/* Right: control toggles (styling mirrors the desktop Controls panel) */}
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
                className="px-2.5 min-h-[44px] text-[10px] font-light tracking-wider uppercase border transition-all duration-300"
                style={{
                  backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                  borderColor: active ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                  color: active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
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

import { useEffect, useState, useRef } from 'react'
import { usePoemStore } from '../state/poemStore'

export function SpeakerDisclaimer() {
  const showSpeakerColors = usePoemStore((s) => s.showSpeakerColors)
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const hasShownRef = useRef(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleDismiss = () => {
    setIsVisible(false)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setTimeout(() => setShouldRender(false), 700)
  }

  useEffect(() => {
    let animTimer: ReturnType<typeof setTimeout>

    // Only show if enabled, not currently visible, and hasn't been shown this session
    if (showSpeakerColors && !hasShownRef.current) {
      hasShownRef.current = true
      setShouldRender(true)

      // Small delay to ensure DOM is present before transition
      animTimer = setTimeout(() => setIsVisible(true), 50)

      timeoutRef.current = setTimeout(() => {
        handleDismiss()
      }, 8000) // Increased to 8s to allow reading the title and text

      return () => {
        clearTimeout(animTimer)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
      }
    } else if (!showSpeakerColors && isVisible) {
      // If toggled off, immediately start hiding if it's currently showing
      handleDismiss()
    }
  }, [showSpeakerColors]) // Removed isVisible from deps to avoid loops

  if (!shouldRender) return null

  return (
    <div
      className={`fixed top-[100px] left-1/2 -translate-x-1/2 max-w-2xl w-[90vw] z-50 transition-opacity duration-700 ease-in-out pointer-events-none
        ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        onClick={handleDismiss}
        className="pointer-events-auto cursor-pointer p-6 rounded-sm backdrop-blur-md transition-colors group"
        style={{
          background: 'rgba(17,17,19,0.92)',
          border: '1px solid rgba(251,191,36,0.18)',
          boxShadow: '0 12px 50px rgba(0,0,0,0.6), 0 0 40px rgba(251,191,36,0.06)',
        }}
      >
        <h3 className="text-[11px] uppercase tracking-[0.2em] text-amber-200/60 font-light mb-3 group-hover:text-amber-200/90 transition-colors">
          A Note on Speakers
        </h3>
        <div className="space-y-3 text-sm font-serif leading-relaxed tracking-wide font-light text-white/75">
          <p>
            This is one reader's interpretation, designed as a pedagogical tool to make the poem more accessible.
            The actual poem knowingly resists this clarity; that resistance is part of its meaning.
          </p>
          <p>
            Eliot’s voices are fleeting and anonymous. The seamless handoff from one speaker to another is part of the drama.
            The most sublime moments come from the impossibility of direct attribution. When ready, you are encouraged to
            disable the speaker annotations and read the poem in its original form.
          </p>
        </div>
      </div>
    </div>
  )
}

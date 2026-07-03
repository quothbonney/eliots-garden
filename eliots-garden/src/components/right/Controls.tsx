import { usePoemStore } from '../../state/poemStore'

export function Controls() {
  const showSpeakerColors = usePoemStore((s) => s.showSpeakerColors)
  const toggleSpeakerColors = usePoemStore((s) => s.toggleSpeakerColors)
  const showInlineArcs = usePoemStore((s) => s.showInlineArcs)
  const toggleInlineArcs = usePoemStore((s) => s.toggleInlineArcs)
  const showAnnotationHighlights = usePoemStore((s) => s.showAnnotationHighlights)
  const toggleAnnotationHighlights = usePoemStore((s) => s.toggleAnnotationHighlights)
  
  return (
    <div className="h-full bg-black/40">
      <div className="px-4 pt-6 pb-5">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-white/40 font-light mb-4">
          Controls
        </h2>
        
        <div className="space-y-2">
          {/* Speaker Voices Toggle */}
          <button
            onClick={toggleSpeakerColors}
            aria-pressed={showSpeakerColors}
            className="w-full px-3 py-2 text-[11px] font-light tracking-wider rounded-sm border transition-all duration-300 hover:shadow-lg text-left"
            style={{
              backgroundColor: showSpeakerColors ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderColor: showSpeakerColors ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              color: showSpeakerColors ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
              boxShadow: showSpeakerColors ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
            }}
          >
            <span className="inline-block mr-2" style={{ 
              fontSize: '9px',
              verticalAlign: 'middle'
            }}>
              {showSpeakerColors ? '●' : '○'}
            </span>
            SPEAKERS
          </button>
          
          {/* Inline Arcs Toggle */}
          <button
            onClick={toggleInlineArcs}
            aria-pressed={showInlineArcs}
            className="w-full px-3 py-2 text-[11px] font-light tracking-wider rounded-sm border transition-all duration-300 hover:shadow-lg text-left"
            style={{
              backgroundColor: showInlineArcs ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderColor: showInlineArcs ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              color: showInlineArcs ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
              boxShadow: showInlineArcs ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
            }}
          >
            <span className="inline-block mr-2" style={{ 
              fontSize: '9px',
              verticalAlign: 'middle'
            }}>
              {showInlineArcs ? '●' : '○'}
            </span>
            ARCS
          </button>
          
          {/* Annotations Toggle */}
          <button
            onClick={toggleAnnotationHighlights}
            aria-pressed={showAnnotationHighlights}
            className="w-full px-3 py-2 text-[11px] font-light tracking-wider rounded-sm border transition-all duration-300 hover:shadow-lg text-left"
            style={{
              backgroundColor: showAnnotationHighlights ? 'rgba(255,255,255,0.08)' : 'transparent',
              borderColor: showAnnotationHighlights ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
              color: showAnnotationHighlights ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.65)',
              boxShadow: showAnnotationHighlights ? '0 0 20px rgba(255,255,255,0.1)' : 'none'
            }}
          >
            <span className="inline-block mr-2" style={{ 
              fontSize: '9px',
              verticalAlign: 'middle'
            }}>
              {showAnnotationHighlights ? '●' : '○'}
            </span>
            NOTES
          </button>
        </div>
      </div>
    </div>
  )
}

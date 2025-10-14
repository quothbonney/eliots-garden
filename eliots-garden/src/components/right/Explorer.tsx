import { ArcDiagram } from './ArcDiagram'

export function Explorer() {
  const connectionTypes = [
    { type: 'reference', color: '#60a5fa', label: 'Ref' },
    { type: 'echo', color: '#a78bfa', label: 'Echo' },
    { type: 'allusion', color: '#f472b6', label: 'Allu' },
    { type: 'motif', color: '#34d399', label: 'Motif' },
    { type: 'voice', color: '#fbbf24', label: 'Voice' },
    { type: 'imagery', color: '#fb923c', label: 'Image' }
  ]

  return (
    <div className="h-full flex flex-col bg-black/40">
      <header className="px-6 pt-4 pb-2">
        <h2 className="text-sm uppercase tracking-[0.2em] text-white/50 font-light">
          Arc Diagram
        </h2>
      </header>
      
      {/* Connection types legend - compact but readable */}
      <div className="px-6 pb-2">
        <div className="flex gap-x-3">
          {connectionTypes.map(({ type, color, label }) => (
            <div key={type} className="flex items-center gap-1.5 text-[11px]">
              <div 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                style={{ 
                  backgroundColor: color,
                  boxShadow: `0 0 6px ${color}50`
                }}
              />
              <span className="text-white/40 font-light tracking-wide uppercase whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex-1 min-h-0 px-2 pt-0 pb-0">
        <div className="h-full w-full">
          <ArcDiagram />
        </div>
      </div>
    </div>
  )
}



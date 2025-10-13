import { ArcDiagram } from './ArcDiagram'

export function Explorer() {
  const connectionTypes = [
    { type: 'reference', color: '#60a5fa', label: 'Reference' },
    { type: 'echo', color: '#a78bfa', label: 'Echo' },
    { type: 'allusion', color: '#f472b6', label: 'Allusion' },
    { type: 'motif', color: '#34d399', label: 'Motif' },
    { type: 'voice', color: '#fbbf24', label: 'Voice' },
    { type: 'imagery', color: '#fb923c', label: 'Imagery' }
  ]

  return (
    <div className="h-full flex flex-col">
      <header className="p-6 pb-3">
        <h2 className="text-xl tracking-wide">Explorer</h2>
        <p className="text-sm text-white/60">Connections across the poem.</p>
      </header>
      <div className="px-6 pb-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          {connectionTypes.map(({ type, color, label }) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-sm" 
                style={{ backgroundColor: color, opacity: 0.8 }}
              />
              <span className="text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 px-6 pb-6">
        <div className="h-full w-full">
          <ArcDiagram />
        </div>
      </div>
    </div>
  )
}



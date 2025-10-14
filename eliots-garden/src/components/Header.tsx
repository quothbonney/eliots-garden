export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/90 via-black/70 to-transparent backdrop-blur-[2px]">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Site Title - aligned with Marginalia */}
        <h1 className="text-[13px] font-light tracking-[0.35em] text-white/60 uppercase">
          Eliot's Garden
        </h1>
        
        {/* Navigation */}
        <nav className="flex gap-6">
          <button 
            className="text-[10px] font-light tracking-[0.25em] text-white/45 uppercase hover:text-white/70 transition-all duration-500 px-2 py-1"
            onClick={() => {
              // TODO: Implement about modal or page
              console.log('About clicked')
            }}
          >
            About
          </button>
          <button 
            className="text-[10px] font-light tracking-[0.25em] text-white/45 uppercase hover:text-white/70 transition-all duration-500 px-2 py-1"
            onClick={() => {
              // TODO: Implement references modal or page
              console.log('References clicked')
            }}
          >
            References
          </button>
        </nav>
      </div>
      {/* Subtle dark grey horizontal rule */}
      <div className="relative">
        <div className="absolute inset-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
        <div className="absolute left-1/4 right-1/4 h-[1px] bg-white/[0.06]" />
      </div>
    </header>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { usePoemStore } from '../../state/poemStore'
import wastelandVerses from '../../data/wasteland-verses.json'
import { motion, AnimatePresence } from 'framer-motion'

const typeColors = {
  reference: '#60a5fa',
  echo: '#a78bfa',
  allusion: '#f472b6',
  motif: '#34d399',
  voice: '#fbbf24',
  imagery: '#fb923c'
}

export function InlineArcs() {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const arcConnections = usePoemStore((s) => s.arcConnections)
  const hoveredArcId = usePoemStore((s) => s.hoveredArcId)
  const setHoveredArc = usePoemStore((s) => s.setHoveredArc)
  const lines = usePoemStore((s) => s.lines)
  const [previewData, setPreviewData] = useState<{
    sourceText: string
    targetText: string
    description: string
    type: string
    x: number
    y: number
  } | null>(null)

  // Build a map from full lineNumber -> verseNumber for fallback mapping
  const lineToVerse = useMemo(() => {
    const m = new Map<number, number>()
    const verses = (wastelandVerses as any).verses as Array<{ lineNumber: number; verseNumber: number }>
    verses.forEach(v => m.set(v.lineNumber, v.verseNumber))
    return m
  }, [])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    const updateArcs = () => {
      const svg = svgRef.current
      const overlay = containerRef.current
      const poemContainer = document.getElementById('poem-content')
      if (!svg || !overlay || !poemContainer) return

      // Clear previous paths
      while (svg.firstChild) {
        svg.removeChild(svg.firstChild)
      }

      // Get all line elements
      // Use verse numbering for arcs
      const lineElements = poemContainer.querySelectorAll('[data-verse-number]')
      const linePositions = new Map<number, number>()
      
      const overlayRect = overlay.getBoundingClientRect()
      lineElements.forEach((el) => {
        const verseNum = parseInt(el.getAttribute('data-verse-number') || '0')
        if (!verseNum) return
        const rect = (el as HTMLElement).getBoundingClientRect()
        const yPos = rect.top - overlayRect.top + rect.height / 2
        linePositions.set(verseNum, yPos)
      })

      // Create gradient definitions for opacity fading
      const defs = svg.querySelector('defs') || svg.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'))

      // Draw arcs for connections
      arcConnections.forEach((conn, idx) => {
        // Defensive defaults in case of malformed data
        const type = (conn as any)?.type || 'reference'
        const color = (typeColors as any)[type] || '#9ca3af' // fallback gray
        const desc = (conn as any)?.description || ''
        // Connections may be encoded in verse numbers or full line numbers.
        const srcKey = (conn as any).source
        const tgtKey = (conn as any).target
        const sourceY = linePositions.get(srcKey) ?? linePositions.get(lineToVerse.get(srcKey) || -1)
        const targetY = linePositions.get(tgtKey) ?? linePositions.get(lineToVerse.get(tgtKey) || -1)
        
        if (sourceY === undefined || targetY === undefined) return

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        
        // Create proper arc curve from source to target
        // SVG is shifted 280px left for horizontal space
        const poemRect = poemContainer.getBoundingClientRect()
        const x = poemRect.left - overlayRect.left + 280 - 32 // poem left edge + SVG offset - margin from text
        const arcLength = Math.abs(targetY - sourceY)
        
        // Scale control point distance based on arc length
        // Longer arcs curve out more to avoid intersections
        const baseControlOffset = Math.min(arcLength * 0.35, 220)
        const heightFactor = Math.max(1, arcLength / 3000) // Extra extension for very long arcs
        const controlOffset = baseControlOffset * heightFactor
        
        // Use quadratic bezier for cleaner arcs
        const controlX = x - controlOffset
        const controlY = (sourceY + targetY) / 2
        
        const d = `M ${x} ${sourceY} Q ${controlX} ${controlY}, ${x} ${targetY}`
        
        // Calculate fade strength based on arc length
        const maxLength = 3000 // approximate max arc length in pixels
        const lengthRatio = Math.min(arcLength / maxLength, 1)
        
        // Create unique gradient for this arc with opacity fade based on length
        // Longer arcs fade more in the middle
        const gradientId = `arc-gradient-${idx}`
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.setAttribute('id', gradientId)
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse')
        gradient.setAttribute('x1', `${x}`)
        gradient.setAttribute('y1', `${sourceY}`)
        gradient.setAttribute('x2', `${x}`)
        gradient.setAttribute('y2', `${targetY}`)
        
        // Calculate opacity at endpoints and midpoint based on arc length
        const endpointOpacity = hoveredArcId === conn.id ? 0.9 : 0.3
        const midpointOpacity = hoveredArcId === conn.id ? 0.9 : Math.max(0.0, 0.9 * (1 - lengthRatio * 0.9))
        
        const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop1.setAttribute('offset', '0%')
        stop1.setAttribute('stop-color', color)
        stop1.setAttribute('stop-opacity', `${endpointOpacity}`)
        
        const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop2.setAttribute('offset', '50%')
        stop2.setAttribute('stop-color', color)
        stop2.setAttribute('stop-opacity', `${midpointOpacity}`)
        
        const stop3 = document.createElementNS('http://www.w3.org/2000/svg', 'stop')
        stop3.setAttribute('offset', '100%')
        stop3.setAttribute('stop-color', color)
        stop3.setAttribute('stop-opacity', `${endpointOpacity}`)
        
        gradient.appendChild(stop1)
        gradient.appendChild(stop2)
        gradient.appendChild(stop3)
        defs.appendChild(gradient)
        
        path.setAttribute('d', d)
        path.setAttribute('fill', 'none')
        path.setAttribute('stroke', `url(#${gradientId})`)
        path.setAttribute('stroke-width', hoveredArcId === conn.id ? '2.5' : '1.5')
        path.setAttribute('class', 'transition-all duration-200 cursor-pointer')
        path.style.pointerEvents = 'stroke'
        
        // Add hover effects
        path.addEventListener('mouseenter', () => {
          setHoveredArc(conn.id)
          path.setAttribute('stroke-width', '2.5')
          
          // Update gradient opacity on hover
          const hoveredGradient = svg.querySelector(`#${gradientId}`)
          if (hoveredGradient) {
            hoveredGradient.querySelectorAll('stop').forEach((stop) => {
              stop.setAttribute('stop-opacity', '0.9')
            })
          }
          
          // Highlight source and target lines
          const sourceEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).source}"]`)
          const targetEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
          sourceEl?.classList.add('bg-white/5')
          targetEl?.classList.add('bg-white/5')
          
          // Get text for preview
          const sourceLine = lines.find(l => l.verseNumber === (conn as any).source)
          const targetLine = lines.find(l => l.verseNumber === (conn as any).target)
          
          if (sourceLine && targetLine) {
            // Find which endpoint (source or target) is closer to viewport center
            const sourceEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).source}"]`)
            const targetEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
            
            if (sourceEl && targetEl) {
              const viewportCenter = window.innerHeight / 2
              const sourceRect = (sourceEl as HTMLElement).getBoundingClientRect()
              const targetRect = (targetEl as HTMLElement).getBoundingClientRect()
              
              const sourceDistance = Math.abs(sourceRect.top + sourceRect.height / 2 - viewportCenter)
              const targetDistance = Math.abs(targetRect.top + targetRect.height / 2 - viewportCenter)
              
              // Use the endpoint closer to viewport center
              const closerRect = sourceDistance < targetDistance ? sourceRect : targetRect
              
              // Always position to the left of the arcs (before the poem text)
              setPreviewData({
                sourceText: sourceLine.text.trim(),
                targetText: targetLine.text.trim(),
                description: desc,
                type: type,
                x: poemRect.left,
                y: closerRect.top + closerRect.height / 2
              })
            }
          }
        })
        
        path.addEventListener('mouseleave', () => {
          setHoveredArc(null)
          path.setAttribute('stroke-width', '1.5')
          
          // Restore gradient opacity on leave
          const hoveredGradient = svg.querySelector(`#${gradientId}`)
          if (hoveredGradient) {
            const stops = hoveredGradient.querySelectorAll('stop')
            stops[0]?.setAttribute('stop-opacity', `${endpointOpacity}`)
            stops[1]?.setAttribute('stop-opacity', `${midpointOpacity}`)
            stops[2]?.setAttribute('stop-opacity', `${endpointOpacity}`)
          }
          
          // Remove highlight
          const sourceEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).source}"]`)
          const targetEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
          sourceEl?.classList.remove('bg-white/5')
          targetEl?.classList.remove('bg-white/5')
          
          // Clear preview
          setPreviewData(null)
        })
        
        // Add click to scroll
        path.addEventListener('click', () => {
          const targetEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Flash highlight
            targetEl.classList.add('bg-white/20')
            setTimeout(() => {
              targetEl.classList.remove('bg-white/20')
            }, 1000)
          }
        })

        // Add tooltip
        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title')
        const label = typeof type === 'string' ? type.toUpperCase() : 'CONNECTION'
        title.textContent = `${label}: Lines ${(conn as any).source} → ${(conn as any).target}${desc ? `\n${desc}` : ''}`
        path.appendChild(title)

        svg.appendChild(path)

        // Add small dots at endpoints
        const createDot = (y: number) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          circle.setAttribute('cx', `${x}`)
          circle.setAttribute('cy', `${y}`)
          circle.setAttribute('r', hoveredArcId === conn.id ? '3' : '2')
          circle.setAttribute('fill', color)
          circle.setAttribute('fill-opacity', hoveredArcId === conn.id ? '0.9' : '0.5')
          circle.setAttribute('class', 'transition-all duration-200')
          return circle
        }

        svg.appendChild(createDot(sourceY))
        svg.appendChild(createDot(targetY))
      })
    }

    // Initial render
    updateArcs()

    // Update on scroll
    const poemContainer = document.querySelector('main')
    poemContainer?.addEventListener('scroll', updateArcs)
    
    // Update on resize
    window.addEventListener('resize', updateArcs)
    
    // Cleanup
    return () => {
      poemContainer?.removeEventListener('scroll', updateArcs)
      window.removeEventListener('resize', updateArcs)
    }
  }, [arcConnections, hoveredArcId, setHoveredArc, lines, lineToVerse])

  return (
    <>
      <div 
        ref={containerRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 5 }}
      >
      <svg
        ref={svgRef}
        className="absolute w-full h-full pointer-events-auto"
        style={{ 
          left: '-280px',
          width: 'calc(100% + 280px)',
          overflow: 'visible' 
        }}
      />
      </div>
      
      {/* Preview tooltip */}
      <AnimatePresence>
        {previewData && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed pointer-events-none z-50"
            style={{
              left: `${previewData.x - 350}px`,
              top: `${previewData.y}px`,
              transform: 'translateY(-50%)'
            }}
          >
            <div className="bg-black/95 border border-white/20 rounded-lg p-4 max-w-sm shadow-2xl">
              <div className="text-xs uppercase tracking-wider mb-2" style={{ color: (typeColors as any)[previewData.type] }}>
                {previewData.type}
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-white/50 text-xs mb-1">From:</div>
                  <div className="text-white italic">{previewData.sourceText}</div>
                </div>
                <div className="border-t border-white/10 pt-2">
                  <div className="text-white/50 text-xs mb-1">To:</div>
                  <div className="text-white italic">{previewData.targetText}</div>
                </div>
                {previewData.description && (
                  <div className="border-t border-white/10 pt-2">
                    <div className="text-white/70 text-xs leading-relaxed">{previewData.description}</div>
                  </div>
                )}
              </div>
              <div className="mt-3 text-xs text-white/40">Click arc to navigate</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


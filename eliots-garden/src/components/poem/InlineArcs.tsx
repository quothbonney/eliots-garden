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
  const prevHoveredArcIdRef = useRef<string | null>(null)
  const [previewData, setPreviewData] = useState<{
    sourceText: string
    targetText: string
    description: string
    type: string
    sourceVerse: number
    targetVerse: number
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
      const svgEl = svgRef.current
      const overlay = containerRef.current
      const poemContainer = document.getElementById('poem-content')
      if (!svgEl || !overlay || !poemContainer) return

      // Clear previous nodes
      while (svgEl.firstChild) {
        svgEl.removeChild(svgEl.firstChild)
      }

      // Compute verse line vertical centers
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

      // Prepare defs
      const defs = svgEl.querySelector('defs') || svgEl.appendChild(document.createElementNS('http://www.w3.org/2000/svg', 'defs'))

      // Determine arc X anchor relative to SVG's computed left offset
      const poemRect = poemContainer.getBoundingClientRect()
      const svgComputedLeft = parseFloat(getComputedStyle(svgEl).left || '0') || 0 // e.g., -280
      const arcMargin = 32 // gap from poem text to arc spine
      const xAnchor = poemRect.left - overlayRect.left - svgComputedLeft - arcMargin

      // Draw arcs
      arcConnections.forEach((conn, idx) => {
        const type = (conn as any)?.type || 'reference'
        const color = (typeColors as any)[type] || '#9ca3af'
        const desc = (conn as any)?.description || ''

        const srcKey = (conn as any).source
        const tgtKey = (conn as any).target
        const sourceY = linePositions.get(srcKey) ?? linePositions.get(lineToVerse.get(srcKey) || -1)
        const targetY = linePositions.get(tgtKey) ?? linePositions.get(lineToVerse.get(tgtKey) || -1)
        if (sourceY === undefined || targetY === undefined) return

        const arcLength = Math.abs(targetY - sourceY)
        const baseControlOffset = Math.min(arcLength * 0.35, 220)
        const heightFactor = Math.max(1, arcLength / 3000)
        const controlOffset = baseControlOffset * heightFactor
        const controlX = xAnchor - controlOffset
        const controlY = (sourceY + targetY) / 2

        const d = `M ${xAnchor} ${sourceY} Q ${controlX} ${controlY}, ${xAnchor} ${targetY}`

        // Visual path
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')

        // Gradient with length-based fade (state-agnostic)
        const maxLength = 3000
        const lengthRatio = Math.min(arcLength / maxLength, 1)
        const endpointOpacity = 0.3
        const midpointOpacity = Math.max(0.0, 0.9 * (1 - lengthRatio * 0.9))
        const gradientId = `arc-gradient-${idx}`
        const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient')
        gradient.setAttribute('id', gradientId)
        gradient.setAttribute('gradientUnits', 'userSpaceOnUse')
        gradient.setAttribute('x1', `${xAnchor}`)
        gradient.setAttribute('y1', `${sourceY}`)
        gradient.setAttribute('x2', `${xAnchor}`)
        gradient.setAttribute('y2', `${targetY}`)

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
        path.setAttribute('stroke-width', '1.5')
        path.setAttribute('class', 'transition-all duration-200 cursor-pointer')
        path.setAttribute('data-arc-id', (conn as any).id)
        path.setAttribute('data-source-verse', String((conn as any).source))
        path.setAttribute('data-target-verse', String((conn as any).target))
        path.style.pointerEvents = 'stroke'

        svgEl.appendChild(path)

        // Larger invisible hit area for easier hover/click
        const hitPath = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        hitPath.setAttribute('d', d)
        hitPath.setAttribute('fill', 'none')
        hitPath.setAttribute('stroke', 'transparent')
        hitPath.setAttribute('stroke-width', '12')
        hitPath.setAttribute('data-arc-id', (conn as any).id)
        hitPath.setAttribute('data-source-verse', String((conn as any).source))
        hitPath.setAttribute('data-target-verse', String((conn as any).target))
        hitPath.setAttribute('data-hit', '1')
        hitPath.style.pointerEvents = 'stroke'

        const handleEnter = () => {
          setHoveredArc((conn as any).id)
          path.setAttribute('stroke-width', '2.5')
          const hoveredGradient = svgEl.querySelector(`#${gradientId}`)
          if (hoveredGradient) {
            hoveredGradient.querySelectorAll('stop').forEach((stop) => {
              stop.setAttribute('stop-opacity', '0.9')
            })
          }
          const srcEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).source}"]`)
          const tgtEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
          srcEl?.classList.add('bg-white/5')
          tgtEl?.classList.add('bg-white/5')

          const sourceLine = lines.find(l => l.verseNumber === (conn as any).source)
          const targetLine = lines.find(l => l.verseNumber === (conn as any).target)
          if (sourceLine && targetLine) {
            const sourceRect = (srcEl as HTMLElement | null)?.getBoundingClientRect()
            const targetRect = (tgtEl as HTMLElement | null)?.getBoundingClientRect()
            if (sourceRect && targetRect) {
              const viewportCenter = window.innerHeight / 2
              const sourceDistance = Math.abs(sourceRect.top + sourceRect.height / 2 - viewportCenter)
              const targetDistance = Math.abs(targetRect.top + targetRect.height / 2 - viewportCenter)
              const closerRect = sourceDistance < targetDistance ? sourceRect : targetRect
              setPreviewData({
                sourceText: sourceLine.text.trim(),
                targetText: targetLine.text.trim(),
                description: desc,
                type: type,
                sourceVerse: (conn as any).source,
                targetVerse: (conn as any).target,
                x: poemRect.left,
                y: closerRect.top + closerRect.height / 2
              })
            }
          }
        }

        const handleLeave = () => {
          setHoveredArc(null)
          path.setAttribute('stroke-width', '1.5')
          const hoveredGradient = svgEl.querySelector(`#${gradientId}`)
          if (hoveredGradient) {
            const stops = hoveredGradient.querySelectorAll('stop')
            stops[0]?.setAttribute('stop-opacity', '0.3')
            stops[1]?.setAttribute('stop-opacity', `${midpointOpacity}`)
            stops[2]?.setAttribute('stop-opacity', '0.3')
          }
          const srcEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).source}"]`)
          const tgtEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
          srcEl?.classList.remove('bg-white/5')
          tgtEl?.classList.remove('bg-white/5')
          setPreviewData(null)
        }

        const handleClick = () => {
          const srcEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).source}"]`)
          const tgtEl = poemContainer.querySelector(`[data-verse-number="${(conn as any).target}"]`)
          if (!srcEl || !tgtEl) return
          const viewportCenter = window.innerHeight / 2
          const sRect = (srcEl as HTMLElement).getBoundingClientRect()
          const tRect = (tgtEl as HTMLElement).getBoundingClientRect()
          const sDist = Math.abs(sRect.top + sRect.height / 2 - viewportCenter)
          const tDist = Math.abs(tRect.top + tRect.height / 2 - viewportCenter)
          const destination = sDist < tDist ? tgtEl : srcEl
          destination.scrollIntoView({ behavior: 'smooth', block: 'center' })
          destination.classList.add('bg-white/20')
          setTimeout(() => {
            destination.classList.remove('bg-white/20')
          }, 1000)
        }

        hitPath.addEventListener('mouseenter', handleEnter)
        hitPath.addEventListener('mouseleave', handleLeave)
        hitPath.addEventListener('click', handleClick)
        svgEl.appendChild(hitPath)

        // Endpoint dots
        const createDot = (y: number) => {
          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
          circle.setAttribute('cx', `${xAnchor}`)
          circle.setAttribute('cy', `${y}`)
          circle.setAttribute('r', '2')
          circle.setAttribute('fill', color)
          circle.setAttribute('fill-opacity', '0.5')
          circle.setAttribute('class', 'transition-all duration-200')
          circle.setAttribute('data-arc-id', (conn as any).id)
          circle.setAttribute('data-source-verse', String((conn as any).source))
          circle.setAttribute('data-target-verse', String((conn as any).target))
          return circle
        }
        svgEl.appendChild(createDot(sourceY))
        svgEl.appendChild(createDot(targetY))
      })
    }

    // Initial render
    updateArcs()

    // Update on scroll/resize
    const scrollEl = document.querySelector('main')
    scrollEl?.addEventListener('scroll', updateArcs)
    window.addEventListener('resize', updateArcs)

    // Reset hover/tooltip on leaving SVG region
    const svgEl = svgRef.current
    const handleSvgLeave = () => {
      setHoveredArc(null)
      setPreviewData(null)
    }
    svgEl?.addEventListener('mouseleave', handleSvgLeave)

    // Lenient dismissal via expanded bounds around hovered arc
    let lastHoveredBounds: { x1: number; y1: number; x2: number; y2: number } | null = null
    const computeLenientBounds = () => {
      if (!svgEl) return null
      if (!prevHoveredArcIdRef.current) return null
      const arcNode = svgEl.querySelector(`[data-arc-id="${prevHoveredArcIdRef.current}"]`)
      if (!arcNode) return null
      // Prefer the invisible hit path for generous interaction
      const hitNode = svgEl.querySelector(`[data-arc-id="${prevHoveredArcIdRef.current}"][data-hit="1"]`)
      const target = (hitNode as SVGGraphicsElement) || (arcNode as SVGGraphicsElement)
      try {
        const bbox = target.getBBox()
        const padX = 60
        const padY = 56
        return {
          x1: bbox.x - padX,
          y1: bbox.y - padY,
          x2: bbox.x + bbox.width + padX,
          y2: bbox.y + bbox.height + padY
        }
      } catch {
        return null
      }
    }
    const handleMouseMove = (evt: MouseEvent) => {
      if (!svgEl) return
      if (!prevHoveredArcIdRef.current) return
      if (!lastHoveredBounds) lastHoveredBounds = computeLenientBounds()
      if (!lastHoveredBounds) return
      // Map client to SVG coordinates
      const anySvg: any = svgEl
      const pt = anySvg.createSVGPoint ? anySvg.createSVGPoint() : null
      const ctm = anySvg.getScreenCTM && anySvg.getScreenCTM()
      if (!pt || !ctm) return
      pt.x = evt.clientX
      pt.y = evt.clientY
      const inv = ctm.inverse ? ctm.inverse() : null
      if (!inv) return
      const svgPt = pt.matrixTransform(inv)
      const { x1, y1, x2, y2 } = lastHoveredBounds
      if (svgPt.x < x1 || svgPt.x > x2 || svgPt.y < y1 || svgPt.y > y2) {
        setHoveredArc(null)
        setPreviewData(null)
        lastHoveredBounds = null
      }
    }
    const handleMouseEnter = () => {
      lastHoveredBounds = computeLenientBounds()
    }
    svgEl?.addEventListener('mousemove', handleMouseMove)
    svgEl?.addEventListener('mouseenter', handleMouseEnter)

    // Observe poem DOM mutations (speaker labels, layout changes)
    const poemContainer = document.getElementById('poem-content')
    let rafId: number | null = null
    const observer = new MutationObserver(() => {
      if (rafId != null) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        updateArcs()
        rafId = null
      })
    })
    if (poemContainer) {
      observer.observe(poemContainer, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'style'] })
    }

    return () => {
      scrollEl?.removeEventListener('scroll', updateArcs)
      window.removeEventListener('resize', updateArcs)
      observer.disconnect()
      if (rafId != null) cancelAnimationFrame(rafId)
      svgEl?.removeEventListener('mouseleave', handleSvgLeave)
      svgEl?.removeEventListener('mousemove', handleMouseMove)
      svgEl?.removeEventListener('mouseenter', handleMouseEnter)
    }
  }, [arcConnections, setHoveredArc, lines, lineToVerse])

  // Respond to cross-panel hovers without redrawing
  useEffect(() => {
    const svgEl = svgRef.current
    if (!svgEl) return
    const nodes = svgEl.querySelectorAll('[data-arc-id]')
    // Remove highlights for previously hovered arc if changed
    if (prevHoveredArcIdRef.current && (!hoveredArcId || prevHoveredArcIdRef.current !== hoveredArcId)) {
      const prevNode = svgEl.querySelector(`[data-arc-id="${prevHoveredArcIdRef.current}"]`)
      const poemContainer = document.getElementById('poem-content')
      const srcVerse = prevNode?.getAttribute('data-source-verse')
      const tgtVerse = prevNode?.getAttribute('data-target-verse')
      if (srcVerse && poemContainer) {
        poemContainer.querySelector(`[data-verse-number="${srcVerse}"]`)?.classList.remove('bg-white/5')
      }
      if (tgtVerse && poemContainer) {
        poemContainer.querySelector(`[data-verse-number="${tgtVerse}"]`)?.classList.remove('bg-white/5')
      }
    }
    prevHoveredArcIdRef.current = hoveredArcId

    nodes.forEach((node) => {
      const id = (node as SVGElement).getAttribute('data-arc-id')
      if (!id) return
      if (hoveredArcId && id === hoveredArcId) {
        node.setAttribute('stroke-width', '2.5')
        if (node.tagName === 'circle') {
          node.setAttribute('r', '3')
          node.setAttribute('fill-opacity', '0.9')
        }
        // Ensure line highlights are applied when hover comes from side diagram
        if (node.tagName === 'path' || node.tagName === 'circle') {
          const poemContainer = document.getElementById('poem-content')
          const srcVerse = (node as Element).getAttribute('data-source-verse')
          const tgtVerse = (node as Element).getAttribute('data-target-verse')
          if (srcVerse && poemContainer) poemContainer.querySelector(`[data-verse-number="${srcVerse}"]`)?.classList.add('bg-white/5')
          if (tgtVerse && poemContainer) poemContainer.querySelector(`[data-verse-number="${tgtVerse}"]`)?.classList.add('bg-white/5')
        }
      } else {
        // Reset
        if (node.tagName === 'path') node.setAttribute('stroke-width', '1.5')
        if (node.tagName === 'circle') {
          node.setAttribute('r', '2')
          node.setAttribute('fill-opacity', '0.5')
        }
      }
    })

    // Hide tooltip when global hover clears
    if (!hoveredArcId) {
      setPreviewData(null)
    }
  }, [hoveredArcId])

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
            className="fixed z-50 pointer-events-auto"
            style={{
              left: `${previewData.x - 350}px`,
              top: `${previewData.y}px`,
              transform: 'translateY(-50%)'
            }}
          >
            <button
              onClick={() => {
                const poemContainer = document.getElementById('poem-content')
                if (!poemContainer || !previewData) return
                const srcEl = poemContainer.querySelector(`[data-verse-number="${previewData.sourceVerse}"]`)
                const tgtEl = poemContainer.querySelector(`[data-verse-number="${previewData.targetVerse}"]`)
                if (!srcEl || !tgtEl) return
                const viewportCenter = window.innerHeight / 2
                const sRect = (srcEl as HTMLElement).getBoundingClientRect()
                const tRect = (tgtEl as HTMLElement).getBoundingClientRect()
                const sDist = Math.abs(sRect.top + sRect.height / 2 - viewportCenter)
                const tDist = Math.abs(tRect.top + tRect.height / 2 - viewportCenter)
                const destination = sDist < tDist ? tgtEl : srcEl
                destination.scrollIntoView({ behavior: 'smooth', block: 'center' })
                destination.classList.add('bg-white/20')
                setTimeout(() => {
                  destination.classList.remove('bg-white/20')
                }, 1000)
              }}
              className="bg-black/90 border border-white/15 rounded-md p-3 max-w-sm shadow-xl text-left"
            >
              <div className="text-[10px] uppercase tracking-[0.14em] mb-1" style={{ color: (typeColors as any)[previewData.type] }}>
                {previewData.type}
              </div>
              <div className="space-y-1 text-[12px] leading-snug">
                <div className="text-white/80 italic line-clamp-2">{previewData.sourceText}</div>
                <div className="text-white/30">→</div>
                <div className="text-white/80 italic line-clamp-2">{previewData.targetText}</div>
                {previewData.description && (
                  <div className="text-white/60 text-[11px] pt-1 border-t border-white/10">{previewData.description}</div>
                )}
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}


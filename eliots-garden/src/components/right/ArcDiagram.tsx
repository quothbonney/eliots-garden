import { useEffect, useRef, useState } from 'react'
import { select } from 'd3-selection'
import { scaleLinear } from 'd3-scale'
import { usePoemStore } from '../../state/poemStore'
import wastelandComplete from '../../data/wasteland-complete.json'
import wastelandVerses from '../../data/wasteland-verses.json'

// The spine scale runs over document lines (1-502); arc endpoints are verse
// numbers (1-434), so map them before positioning.
const verseToLine = new Map<number, number>(
  wastelandVerses.verses.map((v: any) => [v.verseNumber, v.lineNumber])
)
const lineOf = (verse: number) => verseToLine.get(verse) ?? verse

export function ArcDiagram() {
  const ref = useRef<SVGSVGElement | null>(null)
  const arcConnections = usePoemStore((s) => s.arcConnections)
  const hoveredArcId = usePoemStore((s) => s.hoveredArcId)
  const setHoveredArc = usePoemStore((s) => s.setHoveredArc)
  const scrollState = usePoemStore((s) => s.scrollState)
  const hasUserScrolled = usePoemStore((s) => s.hasUserScrolled)
  const [resizeTick, setResizeTick] = useState(0)

  // Redraw on window resize (rAF-debounced)
  useEffect(() => {
    let raf: number | null = null
    const onResize = () => {
      if (raf != null) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        setResizeTick((t) => t + 1)
        raf = null
      })
    }
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      if (raf != null) cancelAnimationFrame(raf)
    }
  }, [])

  // Initialize SVG structure
  useEffect(() => {
    if (!ref.current) return
    const svg = select(ref.current)

    // Create groups if they don't exist, order matters for layering
    if (svg.select('g.bg-layer').empty()) svg.append('g').attr('class', 'bg-layer')
    if (svg.select('g.main-layer').empty()) svg.append('g').attr('class', 'main-layer')
    if (svg.select('g.overlay-layer').empty()) svg.append('g').attr('class', 'overlay-layer')

    // Add filters
    const defs = svg.select('defs')
    if (defs.empty()) {
      const d = svg.append('defs')
      const filter = d.append('filter')
        .attr('id', 'label-blur')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%')

      filter.append('feFlood')
        .attr('flood-color', 'black')
        .attr('flood-opacity', '1')
        .attr('result', 'flood')

      filter.append('feGaussianBlur')
        .attr('in', 'flood')
        .attr('stdDeviation', '4')
        .attr('result', 'blur')

      filter.append('feComposite')
        .attr('in', 'blur')
        .attr('in2', 'SourceGraphic')
        .attr('operator', 'in')
        .attr('result', 'blurredRect')
    }
  }, [])

  // Draw Content (Arcs, Labels, etc.)
  useEffect(() => {
    if (!ref.current) return
    const svg = select(ref.current)
    const g = svg.select('g.main-layer')

    // Clear previous content in this layer
    g.selectAll('*').remove()

    const parentEl = (ref.current as SVGSVGElement | null)?.parentElement
    const width = parentEl ? parentEl.clientWidth : 420
    const height = window.innerHeight - 80
    const margin = { top: 0, right: 20, bottom: 0, left: 50 } // Swapped margins roughly

    svg.attr('viewBox', `0 0 ${width} ${height}`)

    // Transform main group
    g.attr('transform', `translate(${margin.left},${margin.top})`)

    // Create scale for line positions
    const totalLines = 502
    const yScale = scaleLinear()
      .domain([0, totalLines + 20])
      .range([0, height])

    // Draw vertical spine on the RIGHT side
    // We use a fixed offset from the right edge of the SVG
    const spineX = width - 60

    g.append('line')
      .attr('x1', spineX)
      .attr('y1', 0)
      .attr('x2', spineX)
      .attr('y2', height)
      .attr('stroke', 'white')
      .attr('stroke-opacity', 0.1)

    // Add section markers
    Object.entries(wastelandComplete.structure.sections).forEach(([key, section]: [string, any]) => {
      const y = yScale(section.headerLine)

      g.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', width) // Extend across full width
        .attr('y2', y)
        .attr('stroke', 'white')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '2,2')

      const labelGroup = g.append('g')
        .attr('class', 'section-label')
        .style('cursor', 'pointer')
        .on('click', () => {
          const sectionEl = document.querySelector(`[data-line-number="${section.headerLine}"]`)
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            sectionEl.classList.add('bg-white/20')
            setTimeout(() => sectionEl.classList.remove('bg-white/20'), 1000)
          }
        })

      const labelText = `${key}. ${section.title}`

      // Labels now to the LEFT of the spine
      const textElement = g.append('text')
        .attr('x', spineX - 20)
        .attr('y', y + 15)
        .attr('text-anchor', 'end') // Align to the right (end) so they grow leftwards
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-family-serif)')
        .attr('opacity', 0)
        .text(labelText)

      const bbox = (textElement.node() as SVGTextElement).getBBox()
      textElement.remove()

      labelGroup.append('rect')
        .attr('x', bbox.x - 6)
        .attr('y', bbox.y - 4)
        .attr('width', bbox.width + 12)
        .attr('height', bbox.height + 8)
        .attr('fill', 'black')
        .attr('fill-opacity', 0.7)
        .attr('rx', 4)
        .attr('filter', 'url(#label-blur)')

      labelGroup.append('text')
        .attr('x', spineX - 20)
        .attr('y', y + 15)
        .attr('text-anchor', 'end')
        .attr('fill', 'white')
        .attr('fill-opacity', 0.8)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-family-serif)')
        .text(labelText)
        .on('mouseover', function () { select(this).attr('fill-opacity', 1) })
        .on('mouseout', function () { select(this).attr('fill-opacity', 0.8) })
    })

    const typeColors: Record<string, string> = {
      reference: '#60a5fa',
      echo: '#a78bfa',
      allusion: '#f472b6',
      motif: '#34d399',
      voice: '#fbbf24',
      imagery: '#fb923c'
    }

    g.selectAll('.connection')
      .data(arcConnections)
      .enter()
      .append('path')
      .attr('class', d => `connection connection-${d.type}`)
      .attr('d', d => {
        const y1 = yScale(lineOf(d.source))
        const y2 = yScale(lineOf(d.target))
        const midY = (y1 + y2) / 2
        const radius = Math.abs(y2 - y1) / 2

        // Clamp the arc width so it doesn't overflow the container (Left side now)
        // Available width from spine to left margin (0)
        const minExtent = 10 // Keep a bit of padding on the left
        const calculatedExtent = spineX - (radius * 1.5) // Curve to the LEFT (subtract)
        const controlX = Math.max(calculatedExtent, minExtent) // Use Max to clamp against 0

        return `M ${spineX} ${y1} Q ${controlX} ${midY}, ${spineX} ${y2}`
      })
      .attr('fill', 'none')
      .attr('stroke', d => typeColors[d.type] || 'white')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1)
      .attr('data-arc-id', d => d.id)
      .on('mouseover', function (_, d) { setHoveredArc(d.id) })
      .on('mouseout', function () { setHoveredArc(null) })
      .append('title')
      .text(d => `Lines ${d.source}–${d.target}: ${d.description}`)

    arcConnections.forEach(conn => {
      [conn.source, conn.target].forEach(verse => {
        g.append('circle')
          .attr('cx', spineX)
          .attr('cy', yScale(lineOf(verse)))
          .attr('r', 2)
          .attr('fill', typeColors[conn.type] || 'white')
          .attr('fill-opacity', 0.8)
          .attr('data-arc-id', conn.id)
      })
    })

  }, [arcConnections, setHoveredArc, resizeTick])

  // Hover styling: cheap attribute updates instead of a full redraw
  useEffect(() => {
    if (!ref.current) return
    const g = select(ref.current).select('g.main-layer')
    g.selectAll<SVGPathElement, unknown>('path[data-arc-id]')
      .attr('stroke-opacity', function () {
        return this.getAttribute('data-arc-id') === hoveredArcId ? 0.9 : 0.4
      })
      .attr('stroke-width', function () {
        return this.getAttribute('data-arc-id') === hoveredArcId ? 2.5 : 1
      })
    g.selectAll<SVGCircleElement, unknown>('circle[data-arc-id]')
      .attr('r', function () {
        return this.getAttribute('data-arc-id') === hoveredArcId ? 3 : 2
      })
      .attr('fill-opacity', function () {
        return this.getAttribute('data-arc-id') === hoveredArcId ? 0.9 : 0.8
      })
  }, [hoveredArcId])

  // Draw Minimap Lens (Scroll Indicator)
  useEffect(() => {
    if (!ref.current || !scrollState.scrollHeight || !hasUserScrolled) return

    const svg = select(ref.current)
    const layer = svg.select('g.overlay-layer')
    const height = window.innerHeight - 80

    const { scrollTop, viewportHeight, scrollHeight } = scrollState

    // Calculate lens position and size
    // Map standard scroll percentage to the SVG height
    const safeScrollHeight = scrollHeight || 1
    const lensY = (scrollTop / safeScrollHeight) * height
    const lensHeight = (viewportHeight / safeScrollHeight) * height

    // Ensure visible minimum height
    const displayHeight = Math.max(lensHeight, 4)

    // Horizontal placement: keep the lens snug around the spine / arcs
    // Recalculate spineX here to match the main drawing
    const parentEl = (ref.current as SVGSVGElement | null)?.parentElement
    const width = parentEl ? parentEl.clientWidth : 420
    const spineX = width - 60

    // Actually, if lensWidth is 50, and we want it centered-ish or to the left?
    // Original: lensX = spineX - 4 (spine was on left, lens covered spine and right)
    // Now: spine is on right. Arcs go left. Lens should cover spine and LEFT.
    // So lensX should be spineX - lensWidth + 4?

    const lensWidth = 50
    const calculatedLensX = spineX - lensWidth + 4

    // Create the lens once, then only update position per scroll frame
    let rect = layer.select<SVGRectElement>('rect.lens-rect')
    if (rect.empty()) {
      rect = layer.append('rect')
        .attr('class', 'lens-rect')
        .attr('fill', 'white')
        .attr('fill-opacity', 0.03)
        .attr('stroke', 'none')
        .style('pointer-events', 'none')
    }
    rect
      .attr('x', calculatedLensX)
      .attr('y', lensY)
      .attr('width', lensWidth)
      .attr('height', displayHeight)

    let indicator = layer.select<SVGLineElement>('line.lens-indicator')
    if (indicator.empty()) {
      indicator = layer.append('line')
        .attr('class', 'lens-indicator')
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.5)
    }
    indicator
      .attr('x1', spineX)
      .attr('y1', lensY)
      .attr('x2', spineX)
      .attr('y2', lensY + displayHeight)

  }, [scrollState, hasUserScrolled])

  return (
    <div className="h-full" style={{ marginLeft: '-40px' }}>
      <svg ref={ref} aria-hidden="true" className="w-full h-full" />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { usePoemStore } from '../../state/poemStore'
import wastelandComplete from '../../data/wasteland-complete.json'

export function ArcDiagram() {
  const ref = useRef<SVGSVGElement | null>(null)
  const arcConnections = usePoemStore((s) => s.arcConnections)
  const hoveredArcId = usePoemStore((s) => s.hoveredArcId)
  const setHoveredArc = usePoemStore((s) => s.setHoveredArc)
  const scrollState = usePoemStore((s) => s.scrollState)
  const hasUserScrolled = usePoemStore((s) => s.hasUserScrolled)

  // Initialize SVG structure
  useEffect(() => {
    if (!ref.current) return
    const svg = d3.select(ref.current)

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
    const svg = d3.select(ref.current)
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
    const yScale = d3.scaleLinear()
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
        .on('mouseover', function () { d3.select(this).attr('fill-opacity', 1) })
        .on('mouseout', function () { d3.select(this).attr('fill-opacity', 0.8) })
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
        const y1 = yScale(d.source)
        const y2 = yScale(d.target)
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
      .attr('stroke-opacity', d => hoveredArcId === d.id ? 0.9 : 0.4)
      .attr('stroke-width', d => hoveredArcId === d.id ? 2.5 : 1)
      .on('mouseover', function (_, d) { setHoveredArc(d.id) })
      .on('mouseout', function () { setHoveredArc(null) })
      .append('title')
      .text(d => `Lines ${d.source}-${d.target}: ${d.description}`)

    arcConnections.forEach(conn => {
      [conn.source, conn.target].forEach(line => {
        g.append('circle')
          .attr('cx', spineX)
          .attr('cy', yScale(line))
          .attr('r', hoveredArcId === conn.id ? 3 : 2)
          .attr('fill', typeColors[conn.type] || 'white')
          .attr('fill-opacity', hoveredArcId === conn.id ? 0.9 : 0.8)
      })
    })

  }, [arcConnections, hoveredArcId, setHoveredArc])

  // Draw Minimap Lens (Scroll Indicator)
  useEffect(() => {
    if (!ref.current || !scrollState.scrollHeight || !hasUserScrolled) return

    const svg = d3.select(ref.current)
    const layer = svg.select('g.overlay-layer')
    const height = window.innerHeight - 80

    // Clear previous lens
    layer.selectAll('*').remove()

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

    // Draw the lens - Subtler version, hugging the diagram instead of full width
    layer.append('rect')
      .attr('x', calculatedLensX)
      .attr('y', lensY)
      .attr('width', lensWidth)
      .attr('height', displayHeight)
      .attr('fill', 'white')
      .attr('fill-opacity', 0.03) // Reduced opacity
      .attr('stroke', 'none') // Removed border
      .style('pointer-events', 'none')

    // Add subtle indicator line aligned with the spine
    layer.append('line')
      .attr('x1', spineX)
      .attr('y1', lensY)
      .attr('x2', spineX)
      .attr('y2', lensY + displayHeight)
      .attr('stroke', '#fbbf24') // Amber accent
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.5)

  }, [scrollState, hasUserScrolled])

  return (
    <div className="h-full" style={{ marginLeft: '-40px' }}>
      <svg ref={ref} className="w-full h-full" />
    </div>
  )
}

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { usePoemStore } from '../../state/poemStore'
import wastelandComplete from '../../data/wasteland-complete.json'

export function HorizontalArcDiagram() {
  const ref = useRef<SVGSVGElement | null>(null)
  const arcConnections = usePoemStore((s) => s.arcConnections)
  const hoveredArcId = usePoemStore((s) => s.hoveredArcId)
  const setHoveredArc = usePoemStore((s) => s.setHoveredArc)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    
    // Get parent container dimensions
    const parentEl = (ref.current as SVGSVGElement | null)?.parentElement
    const width = parentEl ? parentEl.clientWidth : window.innerWidth
    const height = parentEl ? parentEl.clientHeight : 150
    
    // Much larger bottom margin to start the arcs earlier/lower
    const margin = { top: 30, right: 20, bottom: 45, left: 20 }
    
    svg.attr('viewBox', `0 0 ${width} ${height}`)
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Gradient definition for natural fade
    const defs = svg.append('defs')
    
    const gradient = defs.append('linearGradient')
      .attr('id', 'arc-fade-gradient')
      .attr('x1', '0%')
      .attr('y1', '100%')
      .attr('x2', '0%')
      .attr('y2', '0%')
    
    // Softer, slower falloff
    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', 'black')
      .attr('stop-opacity', '1')

    gradient.append('stop')
      .attr('offset', '40%')
      .attr('stop-color', 'black')
      .attr('stop-opacity', '0.9')

    gradient.append('stop')
      .attr('offset', '80%')
      .attr('stop-color', 'black')
      .attr('stop-opacity', '0.6')
      
    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', 'black')
      .attr('stop-opacity', '0')

    // Create scale for line positions (horizontal this time)
    const totalLines = 502  // Total lines in the poem
    const xScale = d3.scaleLinear()
      .domain([0, totalLines + 10])
      .range([0, width - margin.left - margin.right])

    // Draw horizontal spine
    const spineY = height - margin.top - margin.bottom
    
    g.append('line')
      .attr('x1', 0)
      .attr('y1', spineY)
      .attr('x2', width - margin.left - margin.right)
      .attr('y2', spineY)
      .attr('stroke', 'white')
      .attr('stroke-opacity', 0.1)

    // Add section markers
    Object.entries(wastelandComplete.structure.sections).forEach(([key, section]: [string, any]) => {
      const x = xScale(section.headerLine)
      
      // Section divider
      g.append('line')
        .attr('x1', x)
        .attr('y1', spineY)
        .attr('x2', x)
        .attr('y2', 0)
        .attr('stroke', 'white')
        .attr('stroke-opacity', 0.15)
        .attr('stroke-dasharray', '2,2')
      
      // Simplified label for horizontal view
      const labelText = key
      
      // Text label
      g.append('text')
        .attr('x', x)
        .attr('y', spineY + 15)
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .attr('fill-opacity', 0.5)
        .attr('font-size', '9px')
        .attr('font-family', 'var(--font-family-serif)')
        .style('cursor', 'pointer')
        .text(labelText)
        .on('click', () => {
          const sectionEl = document.querySelector(`[data-line-number="${section.headerLine}"]`)
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            sectionEl.classList.add('bg-white/20')
            setTimeout(() => sectionEl.classList.remove('bg-white/20'), 1000)
          }
        })
        .on('mouseover', function() {
          d3.select(this).attr('fill-opacity', 1)
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill-opacity', 0.5)
        })
    })

    // Color scale
    const typeColors: Record<string, string> = {
      reference: '#60a5fa',
      echo: '#a78bfa',
      allusion: '#f472b6',
      motif: '#34d399',
      voice: '#fbbf24',
      imagery: '#fb923c'
    }
    
    // Draw connections as arcs
    g.selectAll('.connection')
      .data(arcConnections)
      .enter()
      .append('path')
      .attr('class', d => `connection connection-${d.type}`)
      .attr('d', d => {
        const x1 = xScale(d.source)
        const x2 = xScale(d.target)
        const midX = (x1 + x2) / 2
        // Arcs go UP from spineY
        const radius = Math.abs(x2 - x1) / 2
        const controlY = spineY - (radius * 0.8) // Flatter arcs
        return `M ${x1} ${spineY} Q ${midX} ${controlY}, ${x2} ${spineY}`
      })
      .attr('fill', 'none')
      .attr('stroke', d => typeColors[d.type] || 'white')
      .attr('stroke-opacity', d => hoveredArcId === d.id ? 0.9 : 0.4)
      .attr('stroke-width', d => hoveredArcId === d.id ? 2.5 : 1)
      .on('mouseover', function(_, d) {
        setHoveredArc(d.id)
      })
      .on('mouseout', function() {
        setHoveredArc(null)
      })
      .append('title')
      .text(d => `Lines ${d.source}-${d.target}: ${d.description}`)

  }, [arcConnections, hoveredArcId, setHoveredArc])

  return (
    <div className="h-full w-full pointer-events-auto">
      <svg ref={ref} className="w-full h-full overflow-visible" />
    </div>
  )
}

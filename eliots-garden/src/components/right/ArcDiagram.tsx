import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { usePoemStore } from '../../state/poemStore'
import wastelandComplete from '../../data/wasteland-complete.json'

export function ArcDiagram() {
  const ref = useRef<SVGSVGElement | null>(null)
  const arcConnections = usePoemStore((s) => s.arcConnections)
  const hoveredArcId = usePoemStore((s) => s.hoveredArcId)
  const setHoveredArc = usePoemStore((s) => s.setHoveredArc)

  useEffect(() => {
    const svg = d3.select(ref.current)
    svg.selectAll('*').remove()
    
    const parentEl = (ref.current as SVGSVGElement | null)?.parentElement
    const width = parentEl ? parentEl.clientWidth : 420
    const height = parentEl ? parentEl.clientHeight : window.innerHeight * 0.9
    const margin = { top: 0, right: 150, bottom: 0, left: 20 }
    const innerWidth = width - margin.left - margin.right
    
    svg.attr('viewBox', `0 0 ${width} ${height}`)
    
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)
    
    // Add SVG filter for black blur effect on section labels
    const defs = svg.append('defs')
    const filter = defs.append('filter')
      .attr('id', 'label-blur')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%')
    
    // Create black flood color
    filter.append('feFlood')
      .attr('flood-color', 'black')
      .attr('flood-opacity', '1')
      .attr('result', 'flood')
    
    // Apply blur to the flood
    filter.append('feGaussianBlur')
      .attr('in', 'flood')
      .attr('stdDeviation', '4')
      .attr('result', 'blur')
    
    // Composite the blur behind the original
    filter.append('feComposite')
      .attr('in', 'blur')
      .attr('in2', 'SourceGraphic')
      .attr('operator', 'in')
      .attr('result', 'blurredRect')

    // Create scale for line positions (using full line numbers 1-502)
    // Using the full poem length for consistent scaling
    const totalLines = 502  // Total lines in the poem
    const yScale = d3.scaleLinear()
      .domain([0, totalLines + 20])  // Add some padding to domain to use full height
      .range([0, height])

    // Draw vertical spine (positioned more to the left)
    const spineX = 40  // Fixed position from left
    g.append('line')
      .attr('x1', spineX)
      .attr('y1', 0)
      .attr('x2', spineX)
      .attr('y2', height)
      .attr('stroke', 'white')
      .attr('stroke-opacity', 0.1)

    // Add section markers using actual line numbers
    Object.entries(wastelandComplete.structure.sections).forEach(([key, section]: [string, any]) => {
      const y = yScale(section.headerLine)
      
      // Section divider
      g.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', innerWidth)
        .attr('y2', y)
        .attr('stroke', 'white')
        .attr('stroke-opacity', 0.2)
        .attr('stroke-dasharray', '2,2')
      
      // Section label group (for clickability and background)
      const labelGroup = g.append('g')
        .attr('class', 'section-label')
        .style('cursor', 'pointer')
        .on('click', () => {
          // Find the section header element and scroll to it
          const sectionEl = document.querySelector(`[data-line-number="${section.headerLine}"]`)
          if (sectionEl) {
            sectionEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
            // Flash highlight
            sectionEl.classList.add('bg-white/20')
            setTimeout(() => {
              sectionEl.classList.remove('bg-white/20')
            }, 1000)
          }
        })
      
      const labelText = `${key}. ${section.title}`
      
      // Add background blur rectangle
      // Measure text to size background
      const textElement = g.append('text')
        .attr('x', spineX + 80)
        .attr('y', y + 15)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-family-serif)')
        .attr('opacity', 0)
        .text(labelText)
      
      const bbox = (textElement.node() as SVGTextElement).getBBox()
      textElement.remove()
      
      // Background with black blur effect using SVG filter
      labelGroup.append('rect')
        .attr('x', bbox.x - 6)
        .attr('y', bbox.y - 4)
        .attr('width', bbox.width + 12)
        .attr('height', bbox.height + 8)
        .attr('fill', 'black')
        .attr('fill-opacity', 0.7)
        .attr('rx', 4)
        .attr('filter', 'url(#label-blur)')
      
      // Actual text label
      labelGroup.append('text')
        .attr('x', spineX + 80)
        .attr('y', y + 15)
        .attr('fill', 'white')
        .attr('fill-opacity', 0.8)
        .attr('font-size', '10px')
        .attr('font-family', 'var(--font-family-serif)')
        .text(labelText)
        .on('mouseover', function() {
          d3.select(this).attr('fill-opacity', 1)
        })
        .on('mouseout', function() {
          d3.select(this).attr('fill-opacity', 0.8)
        })
    })

    // Color scale for connection types
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
        
        // Create arc path on the right side
        return `M ${spineX} ${y1} Q ${spineX + radius * 0.8} ${midY}, ${spineX} ${y2}`
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

    // Add dots for connection endpoints
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

  return (
    <div className="h-full">
      <svg ref={ref} className="w-full h-full" />
    </div>
  )
}



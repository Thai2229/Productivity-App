import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { sankey, sankeyJustify, sankeyLinkHorizontal, type SankeyNode, type SankeyLink } from 'd3-sankey'
import { buildFlowLinks, flowLabel, type FlowNodeId } from '../lib/flow'
import type { Internship } from '../lib/internships'

type Props = {
  internships: Internship[]
}

type NodeData = { id: FlowNodeId }
type LinkData = { source: FlowNodeId; target: FlowNodeId; value: number }
type LaidOutNode = SankeyNode<NodeData, LinkData>
type LaidOutLink = SankeyLink<NodeData, LinkData>

// Matches the --stage-* colors in internships.css
function colorFor(id: FlowNodeId) {
  return 'var(--stage-' + id.toLowerCase().replace('_interview', '') + ')'
}

function nodeOf(end: string | number | LaidOutNode) {
  return end as LaidOutNode
}

export default function FlowChart({ internships }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  const gradientPrefix = useId().replace(/:/g, '')

  // Redraw at the right size whenever the card changes width (window resize, phone rotate)
  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }
    const observer = new ResizeObserver((entries) => {
      setWidth(Math.floor(entries[0].contentRect.width))
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  // Below this width the labels overlap, so narrow screens scroll sideways instead
  const MIN_WIDTH = 640
  let chartWidth = width
  if (width > 0 && width < MIN_WIDTH) {
    chartWidth = MIN_WIDTH
  }
  const height = 340

  const layout = useMemo(() => {
    const links = buildFlowLinks(internships)
    if (chartWidth === 0 || links.length === 0) {
      return null
    }

    const ids = new Set<FlowNodeId>()
    for (const link of links) {
      ids.add(link.source)
      ids.add(link.target)
    }

    // d3-sankey works out where every box and band goes
    const generator = sankey<NodeData, LinkData>()
      .nodeId((node) => node.id)
      .nodeAlign(sankeyJustify)
      .nodeWidth(10)
      .nodePadding(22)
      .extent([[1, 10], [chartWidth - 1, height - 10]])

    return generator({
      nodes: [...ids].map((id) => ({ id })),
      links: links.map((link) => ({ ...link })),
    })
  }, [internships, chartWidth])

  const pathMaker = sankeyLinkHorizontal()

  return (
    <section className="flow-card">
      <div className="flow-header">
        <h2 className="flow-title">Application flow</h2>
        <p className="flow-hint">Swipe sideways to see the whole chart</p>
      </div>

      <div ref={containerRef} className="flow-chart">
        {layout && (
          <svg
            width={chartWidth}
            height={height}
            role="img"
            aria-label="Diagram of how many applications moved between each stage"
          >
            <defs>
              {layout.links.map((link: LaidOutLink, index) => (
                <linearGradient
                  key={index}
                  id={gradientPrefix + '-' + index}
                  gradientUnits="userSpaceOnUse"
                  x1={nodeOf(link.source).x1}
                  x2={nodeOf(link.target).x0}
                >
                  <stop offset="0%" style={{ stopColor: colorFor(nodeOf(link.source).id) }} />
                  <stop offset="100%" style={{ stopColor: colorFor(nodeOf(link.target).id) }} />
                </linearGradient>
              ))}
            </defs>

            <g className="flow-links">
              {layout.links.map((link: LaidOutLink, index) => (
                <path
                  key={index}
                  d={pathMaker(link) ?? ''}
                  stroke={'url(#' + gradientPrefix + '-' + index + ')'}
                  strokeWidth={Math.max(1, link.width ?? 1)}
                >
                  <title>
                    {flowLabel(nodeOf(link.source).id) + ' → ' + flowLabel(nodeOf(link.target).id) + ': ' + link.value}
                  </title>
                </path>
              ))}
            </g>

            <g>
              {layout.nodes.map((node: LaidOutNode) => {
                const x0 = node.x0 ?? 0
                const x1 = node.x1 ?? 0
                const y0 = node.y0 ?? 0
                const y1 = node.y1 ?? 0

                // Labels go right of each box; the last column's go left so they stay inside
                let labelX = x1 + 8
                let anchor: 'start' | 'end' = 'start'
                if (x1 >= chartWidth - 2) {
                  labelX = x0 - 8
                  anchor = 'end'
                }

                return (
                  <g key={node.id}>
                    <rect
                      x={x0}
                      y={y0}
                      width={x1 - x0}
                      height={Math.max(2, y1 - y0)}
                      rx={3}
                      style={{ fill: colorFor(node.id) }}
                    />
                    <text
                      className="flow-label"
                      x={labelX}
                      y={(y0 + y1) / 2}
                      dy="0.35em"
                      textAnchor={anchor}
                    >
                      {flowLabel(node.id) + ' (' + node.value + ')'}
                    </text>
                  </g>
                )
              })}
            </g>
          </svg>
        )}
      </div>
    </section>
  )
}
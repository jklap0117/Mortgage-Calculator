export interface DonutSegment {
  key: string
  label: string
  value: number
  /** CSS custom property carrying the segment color, e.g. "--chart-pi". */
  colorVar: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  ariaLabel: string
}

/**
 * SVG donut built from pathLength-normalized circle strokes, so segment
 * sweeps animate smoothly via CSS transitions as inputs change.
 */
export default function DonutChart({ segments, ariaLabel }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0)
  const visible = segments.filter((s) => s.value > 0)

  const R = 80
  const STROKE = 30
  // 2px surface gap between segments, converted to pathLength units (0–100).
  const circumferencePx = 2 * Math.PI * R
  const gapUnits = visible.length > 1 ? (2 / circumferencePx) * 100 : 0

  let cursor = 0
  const arcs = visible.map((segment) => {
    const share = (segment.value / total) * 100
    const start = cursor
    cursor += share
    const dash = Math.max(0, share - gapUnits)
    return { ...segment, dash, offset: -(start + gapUnits / 2) }
  })

  return (
    <svg
      className="donut"
      viewBox="0 0 200 200"
      role="img"
      aria-label={ariaLabel}
    >
      {/* Placeholder ring, only when there is nothing to chart —
          otherwise inter-segment gaps must show the card surface */}
      {visible.length === 0 && (
        <circle
          className="donut__track"
          cx="100"
          cy="100"
          r={R}
          fill="none"
          strokeWidth={STROKE}
        />
      )}
      {arcs.map((arc) => (
        <circle
          key={arc.key}
          className="donut__segment"
          cx="100"
          cy="100"
          r={R}
          fill="none"
          stroke={`var(${arc.colorVar})`}
          strokeWidth={STROKE}
          pathLength={100}
          strokeDasharray={`${arc.dash} ${100 - arc.dash}`}
          strokeDashoffset={arc.offset}
          transform="rotate(-90 100 100)"
        >
          <title>{`${arc.label}: ${Math.round((arc.value / total) * 100)}%`}</title>
        </circle>
      ))}
    </svg>
  )
}

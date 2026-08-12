import { useState, useId } from 'react'

export default function AreaChartComponent({
  data = [],
  series = [
    { label: 'Likes', key: 'likes', color: '#ec4899', gradientFrom: '#ec4899', gradientTo: '#ec489900' },
    { label: 'Comments', key: 'comments', color: '#3b82f6', gradientFrom: '#3b82f6', gradientTo: '#3b82f600' },
    { label: 'Shares', key: 'shares', color: '#10b981', gradientFrom: '#10b981', gradientTo: '#10b98100' },
  ],
  height = 320,
  showLegend = true,
  unit = '',
}) {
  const [hoverIndex, setHoverIndex] = useState(null)
  const chartId = useId()

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        No chart data available
      </div>
    )
  }

  // Dimensions
  const paddingLeft = 45
  const paddingRight = 20
  const paddingTop = 25
  const paddingBottom = 40
  const width = 800

  const chartWidth = width - paddingLeft - paddingRight
  const chartHeight = height - paddingTop - paddingBottom

  // Find max value across all series
  let maxValue = 0
  series.forEach((s) => {
    data.forEach((d) => {
      const val = d[s.key] || 0
      if (val > maxValue) maxValue = val
    })
  })
  if (maxValue === 0) maxValue = 100
  maxValue = Math.ceil(maxValue * 1.15) // Add 15% head room

  // Compute coordinates
  const getX = (index) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2
    return paddingLeft + (index / (data.length - 1)) * chartWidth
  }

  const getY = (val) => {
    return paddingTop + chartHeight - (val / maxValue) * chartHeight
  }

  // Build SVG path strings using Catmull-Rom or cubic Bezier
  const buildSmoothPath = (seriesKey) => {
    const points = data.map((d, i) => ({ x: getX(i), y: getY(d[seriesKey] || 0) }))

    if (points.length < 2) return ''

    let d = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i === 0 ? i : i - 1]
      const p1 = points[i]
      const p2 = points[i + 1]
      const p3 = points[i + 2 < points.length ? i + 2 : i + 1]

      const cp1x = p1.x + (p2.x - p0.x) / 6
      const cp1y = p1.y + (p2.y - p0.y) / 6
      const cp2x = p2.x - (p3.x - p1.x) / 6
      const cp2y = p2.y - (p3.y - p1.y) / 6

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
    }
    return d
  }

  const buildAreaPath = (seriesKey) => {
    const linePath = buildSmoothPath(seriesKey)
    if (!linePath) return ''
    const lastX = getX(data.length - 1)
    const firstX = getX(0)
    const bottomY = paddingTop + chartHeight
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`
  }

  // Horizontal Gridlines (4 intervals)
  const gridY = [0, 0.25, 0.5, 0.75, 1].map((ratio) => ({
    val: Math.round(maxValue * ratio),
    y: paddingTop + chartHeight - ratio * chartHeight,
  }))

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const relativeX = (mouseX / rect.width) * width

    let closest = 0
    let minDiff = Infinity
    data.forEach((_, i) => {
      const diff = Math.abs(getX(i) - relativeX)
      if (diff < minDiff) {
        minDiff = diff
        closest = i
      }
    })
    setHoverIndex(closest)
  }

  const activeItem = hoverIndex !== null ? data[hoverIndex] : null

  return (
    <div className="space-y-3">
      {/* Chart Legend */}
      {showLegend && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4">
            {series.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.label}</span>
              </div>
            ))}
          </div>

          {activeItem && (
            <div className="text-gray-500 dark:text-gray-400 font-semibold bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
              {activeItem.date}
            </div>
          )}
        </div>
      )}

      {/* SVG Container */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            {series.map((s) => (
              <linearGradient key={s.key} id={`grad-${chartId}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={s.color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={s.color} stopOpacity={0.0} />
              </linearGradient>
            ))}
          </defs>

          {/* Grid lines & Y-axis labels */}
          {gridY.map(({ val, y }, idx) => (
            <g key={idx}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-800"
                strokeDasharray={idx === 0 || idx === gridY.length - 1 ? 'none' : '4 4'}
                strokeWidth={1}
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-gray-400 dark:fill-gray-500 font-medium"
              >
                {val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
              </text>
            </g>
          ))}

          {/* Areas & Lines */}
          {series.map((s) => (
            <g key={s.key}>
              <path
                d={buildAreaPath(s.key)}
                fill={`url(#grad-${chartId}-${s.key})`}
              />
              <path
                d={buildSmoothPath(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
          ))}

          {/* X-axis date labels */}
          {data.map((d, i) => {
            const step = Math.ceil(data.length / 7)
            if (i % step !== 0 && i !== data.length - 1) return null
            const x = getX(i)
            return (
              <text
                key={i}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="text-[11px] fill-gray-400 dark:fill-gray-500 font-medium"
              >
                {d.date}
              </text>
            )
          })}

          {/* Hover highlight line & dots */}
          {hoverIndex !== null && (
            <g className="transition-all duration-150">
              <line
                x1={getX(hoverIndex)}
                y1={paddingTop}
                x2={getX(hoverIndex)}
                y2={height - paddingBottom}
                stroke="#6366f1"
                strokeWidth={1.5}
                strokeDasharray="3 3"
              />
              {series.map((s) => {
                const val = data[hoverIndex][s.key] || 0
                const cx = getX(hoverIndex)
                const cy = getY(val)
                return (
                  <g key={s.key}>
                    <circle cx={cx} cy={cy} r={6} fill={s.color} className="animate-ping opacity-75" />
                    <circle cx={cx} cy={cy} r={5} fill="#ffffff" stroke={s.color} strokeWidth={3} />
                  </g>
                )
              })}
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {activeItem && hoverIndex !== null && (
          <div
            className="pointer-events-none absolute top-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-xl border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-xs z-20 transition-all duration-75"
            style={{
              left: `${Math.min(Math.max(hoverIndex * (100 / (data.length - 1)), 15), 80)}%`,
              transform: 'translateX(-50%)',
            }}
          >
            <p className="font-bold text-gray-900 dark:text-white mb-1.5 text-center">{activeItem.date}</p>
            <div className="space-y-1">
              {series.map((s) => (
                <div key={s.key} className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    {s.label}
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {(activeItem[s.key] || 0).toLocaleString()} {unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

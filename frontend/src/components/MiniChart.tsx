/**
 * eSKala — Pure SVG Mini Charts
 * No dependencies — DonutChart, HBarChart, SparkLine
 */

// ─── Donut Chart ──────────────────────────────────────────────────────────────
interface DonutProps {
  value: number          // 0–100
  size?: number
  stroke?: number
  color?: string
  track?: string
  label?: string
  sublabel?: string
}

export function DonutChart({
  value, size = 120, stroke = 14,
  color = '#760031', track = 'rgba(118,0,49,0.10)',
  label, sublabel,
}: DonutProps) {
  const r   = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      {/* Value arc */}
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
      {/* Center label */}
      {label && (
        <>
          <text x={size/2} y={size/2 - (sublabel ? 5 : 0)} textAnchor="middle" dominantBaseline="central"
            style={{ fontFamily: 'Poppins, sans-serif', fontSize: size * 0.165, fontWeight: 800, fill: '#111' }}>
            {label}
          </text>
          {sublabel && (
            <text x={size/2} y={size/2 + size * 0.13} textAnchor="middle" dominantBaseline="central"
              style={{ fontFamily: 'Poppins, sans-serif', fontSize: size * 0.1, fontWeight: 600, fill: '#888' }}>
              {sublabel}
            </text>
          )}
        </>
      )}
    </svg>
  )
}

// ─── Horizontal Bar Chart ──────────────────────────────────────────────────────
interface HBarItem { label: string; value: number; max: number; color?: string }
interface HBarProps { data: HBarItem[]; height?: number }

export function HBarChart({ data, height = 18 }: HBarProps) {
  return (
    <div style={{ display: 'grid', gap: '0.45rem' }}>
      {data.map((d, i) => {
        const pct = Math.min((d.value / d.max) * 100, 100)
        const color = d.color ?? (pct > 70 ? '#b45309' : '#760031')
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
              <span style={{ fontSize: '0.72rem', fontFamily: 'Poppins, sans-serif', fontWeight: 600, color: '#5a5560' }}>{d.label}</span>
              <span style={{ fontSize: '0.72rem', fontFamily: 'Poppins, sans-serif', fontWeight: 700, color }}>{Math.round(pct)}%</span>
            </div>
            <div style={{ background: 'rgba(118,0,49,0.08)', borderRadius: 2, overflow: 'hidden', height }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
interface SparkProps { data: number[]; width?: number; height?: number; color?: string }

export function SparkLine({ data, width = 120, height = 40, color = '#760031' }: SparkProps) {
  if (data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const step  = width / (data.length - 1)

  const points = data.map((v, i) => {
    const x = i * step
    const y = height - ((v - min) / range) * (height - 6) - 3
    return `${x},${y}`
  }).join(' ')

  const area = `M0,${height} L${points.split(' ').join(' L')} L${width},${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block', overflow: 'visible' }}>
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sparkGrad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
      {/* Last point dot */}
      <circle cx={(data.length-1)*step} cy={parseFloat(points.split(' ').pop()!.split(',')[1])} r="3" fill={color}/>
    </svg>
  )
}

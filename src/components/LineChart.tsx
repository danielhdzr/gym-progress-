interface Point {
  label: string
  value: number
}

const W = 320
const H = 170
const PAD = { top: 16, right: 12, bottom: 24, left: 36 }

export function LineChart({ points, unit }: { points: Point[]; unit: string }) {
  if (points.length < 2) {
    return <p className="muted center small">Registra al menos 2 sesiones para ver la gráfica.</p>
  }

  const values = points.map((p) => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const lo = min - span * 0.1
  const hi = max + span * 0.1
  const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const area = `${path} L${x(points.length - 1)},${H - PAD.bottom} L${x(0)},${H - PAD.bottom} Z`
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15]
  // Con rangos pequeños (ej. peso corporal) los enteros se repiten: usamos un decimal
  const fmtTick = (t: number) => (hi - lo < 6 ? t.toFixed(1) : String(Math.round(t)))

  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Progreso en ${unit}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="grid" />
          <text x={PAD.left - 6} y={y(t) + 4} textAnchor="end" className="axis">{fmtTick(t)}</text>
        </g>
      ))}
      <path d={area} className="area" />
      <path d={path} className="line" />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={points.length > 20 ? 2 : 3.5} className="dot">
          <title>{`${p.label}: ${p.value.toFixed(1)} ${unit}`}</title>
        </circle>
      ))}
      <text x={PAD.left} y={H - 6} className="axis">{points[0].label}</text>
      <text x={W - PAD.right} y={H - 6} textAnchor="end" className="axis">{points.at(-1)!.label}</text>
    </svg>
  )
}

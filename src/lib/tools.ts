/** Calculadora de discos y series de calentamiento. */

const EPS = 1e-6

export interface PlateResult {
  /** Discos por lado, de mayor a menor */
  perSide: number[]
  /** Kg que no se pueden armar con los discos disponibles (total, no por lado) */
  remainder: number
}

/** Discos por lado para llegar a `total` con una barra de `bar` kg (algoritmo voraz). */
export function platesPerSide(total: number, bar: number, plates: number[]): PlateResult {
  let side = (total - bar) / 2
  const perSide: number[] = []
  if (side <= EPS) return { perSide, remainder: 0 }
  for (const p of [...plates].sort((a, b) => b - a)) {
    while (p > 0 && side + EPS >= p) {
      perSide.push(p)
      side -= p
    }
  }
  return { perSide, remainder: Math.round(side * 2 * 100) / 100 }
}

export const fmtPlates = (r: PlateResult) => {
  if (!r.perSide.length) return 'Solo la barra'
  const counts = new Map<number, number>()
  for (const p of r.perSide) counts.set(p, (counts.get(p) ?? 0) + 1)
  const text = [...counts].map(([p, n]) => (n > 1 ? `${n}×${p}` : `${p}`)).join(' + ')
  return r.remainder > 0 ? `${text} (faltan ${r.remainder} kg)` : text
}

export interface WarmupSet {
  weight: number
  reps: number
}

const SCHEME = [
  { pct: 0.4, reps: 5 },
  { pct: 0.6, reps: 3 },
  { pct: 0.8, reps: 2 },
]

/**
 * Rampa de calentamiento hacia el peso de trabajo: barra sola × 10, luego 40/60/80 %.
 * Se omiten los escalones que no superan al anterior o que igualan el peso de trabajo.
 */
export function warmupSets(working: number, bar: number, step = 2.5): WarmupSet[] {
  if (working <= 0) return []
  const sets: WarmupSet[] = []
  if (bar > 0 && working > bar) sets.push({ weight: bar, reps: 10 })
  for (const { pct, reps } of SCHEME) {
    const weight = Math.round((working * pct) / step) * step
    const prev = sets.at(-1)?.weight ?? 0
    if (weight > prev && weight >= bar && weight < working) sets.push({ weight, reps })
  }
  return sets
}

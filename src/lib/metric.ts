import type { Metric } from '../types'

/**
 * Unidad en que se mide cada serie. Por compatibilidad con datos existentes,
 * la cantidad siempre se guarda en `SetLog.reps` (reps, segundos o metros).
 */
export const METRICS: { id: Metric; label: string; header: string; short: string; step: number; range: [number, number] }[] = [
  { id: 'reps', label: 'Repeticiones', header: 'reps', short: 'reps', step: 1, range: [8, 12] },
  { id: 'seconds', label: 'Segundos', header: 'seg', short: 's', step: 5, range: [30, 60] },
  { id: 'meters', label: 'Metros', header: 'm', short: 'm', step: 5, range: [20, 40] },
]

const info = (m: Metric = 'reps') => METRICS.find((x) => x.id === m) ?? METRICS[0]

export const metricOf = (ex?: { metric?: Metric }): Metric => ex?.metric ?? 'reps'

/** Cuánto sube la meta en cada sesión: +1 rep, +5 s o +5 m. */
export const stepFor = (m: Metric) => info(m).step

export const unitHeader = (m: Metric) => info(m).header

/** "8 reps", "45 s", "30 m" */
export const fmtAmount = (n: number, m: Metric) => `${n} ${info(m).short}`

/** "8–12 reps", "30–60 s" */
export const fmtRange = (min: number, max: number, m: Metric) => `${min}–${max} ${info(m).short}`

/** Serie compacta: "60×8", "40×30 m", "45 s", "12 reps", con "@9" si tiene RPE. */
export function fmtSet(s: { weight: number; reps: number; rpe?: number }, m: Metric) {
  const amount = m === 'reps' ? String(s.reps) : fmtAmount(s.reps, m)
  const base = s.weight ? `${s.weight}×${amount}` : m === 'reps' ? fmtAmount(s.reps, m) : amount
  return s.rpe ? `${base} @${s.rpe}` : base
}

export const defaultRange = (m: Metric) => info(m).range

import type { BodyweightEntry, CardioSession, Workout } from '../types'
import { speedKmh } from './cardio'

/**
 * Estimación de kcal con METs (Compendio de Actividades Físicas):
 *   kcal ≈ MET × peso (kg) × horas
 * Es una aproximación (±20–30 %): no conoce tu frecuencia cardiaca ni tu composición corporal.
 */

/** Pesas, varios ejercicios con descansos (Compendio 02054). Valor conservador. */
export const STRENGTH_MET = 3.5

/** [velocidad km/h, MET] — tablas del Compendio para caminar y correr. */
const WALK_MET: [number, number][] = [
  [3.2, 2.8],
  [4.0, 3.0],
  [4.8, 3.5],
  [5.6, 4.3],
  [6.4, 5.0],
  [7.2, 7.0],
]
const RUN_MET: [number, number][] = [
  [6.4, 6.0],
  [8.0, 8.3],
  [9.7, 9.8],
  [11.3, 11.0],
  [12.9, 11.8],
  [14.5, 12.8],
  [16.1, 14.5],
]

/** Interpola el MET según la velocidad, sin salir de los extremos de la tabla. */
function interpolate(table: [number, number][], speed: number) {
  if (speed <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    const [s1, m1] = table[i]
    if (speed <= s1) {
      const [s0, m0] = table[i - 1]
      return m0 + ((speed - s0) / (s1 - s0)) * (m1 - m0)
    }
  }
  return table.at(-1)![1]
}

export function cardioMet(session: Pick<CardioSession, 'type' | 'distanceKm' | 'durationMin'>) {
  const v = speedKmh(session)
  const table = session.type === 'run' ? RUN_MET : WALK_MET
  // Sin distancia usamos una velocidad típica: 5 km/h caminando, 9.7 km/h corriendo
  return interpolate(table, v ?? (session.type === 'run' ? 9.7 : 5))
}

export const kcal = (met: number, kg: number, minutes: number) => Math.round((met * kg * minutes) / 60)

/** Peso corporal más cercano a una fecha: el último registrado ese día o antes; si no hay, el primero posterior. */
export function bodyweightAt(entries: BodyweightEntry[], iso: string): number | null {
  if (!entries.length) return null
  const day = iso.slice(0, 10)
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
  const before = sorted.filter((e) => e.date <= day)
  return (before.at(-1) ?? sorted[0]).kg
}

export function workoutKcal(w: Workout, entries: BodyweightEntry[]): number | null {
  const kg = bodyweightAt(entries, w.startedAt)
  if (!kg || !w.finishedAt) return null
  const minutes = (new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime()) / 60000
  return minutes > 0 ? kcal(STRENGTH_MET, kg, minutes) : null
}

export function cardioKcal(s: CardioSession, entries: BodyweightEntry[]): number | null {
  const kg = bodyweightAt(entries, s.date)
  if (!kg || s.durationMin <= 0) return null
  return kcal(cardioMet(s), kg, s.durationMin)
}

export const fmtKcal = (n: number | null) => (n === null ? null : `≈ ${n} kcal`)

import { describe, expect, it } from 'vitest'
import type { CardioSession, Workout } from '../types'
import { bodyweightAt, cardioKcal, cardioMet, kcal, workoutKcal } from './calories'

const weights = [
  { date: '2026-09-01', kg: 82 },
  { date: '2026-10-01', kg: 80 },
]

describe('bodyweightAt', () => {
  it('usa el último peso registrado hasta esa fecha', () => {
    expect(bodyweightAt(weights, '2026-09-15T18:00:00.000Z')).toBe(82)
    expect(bodyweightAt(weights, '2026-10-05T18:00:00.000Z')).toBe(80)
  })

  it('si el entreno es anterior a todo registro, usa el primero', () => {
    expect(bodyweightAt(weights, '2026-08-01T18:00:00.000Z')).toBe(82)
  })

  it('sin registros no hay peso', () => {
    expect(bodyweightAt([], '2026-10-05T18:00:00.000Z')).toBeNull()
  })
})

describe('kcal', () => {
  it('aplica MET × kg × horas', () => {
    expect(kcal(3.5, 80, 60)).toBe(280)
  })

  it('estima un entreno de pesas por su duración', () => {
    const w: Workout = {
      id: 'w',
      name: 'Push',
      startedAt: '2026-10-05T18:00:00.000Z',
      finishedAt: '2026-10-05T19:00:00.000Z',
      entries: [],
    }
    expect(workoutKcal(w, weights)).toBe(280)
    expect(workoutKcal(w, [])).toBeNull()
  })

  it('el MET del cardio sube con la velocidad', () => {
    const walk = (km: number): Pick<CardioSession, 'type' | 'distanceKm' | 'durationMin'> => ({ type: 'walk', distanceKm: km, durationMin: 60 })
    expect(cardioMet(walk(4.8))).toBeCloseTo(3.5)
    expect(cardioMet(walk(5.6))).toBeCloseTo(4.3)
    expect(cardioMet(walk(5.2))).toBeCloseTo(3.9) // interpolado
    expect(cardioMet({ type: 'run', distanceKm: 11.3, durationMin: 60 })).toBeCloseTo(11)
  })

  it('estima una carrera de 5 km en 27 min', () => {
    const run: CardioSession = { id: 'r', type: 'run', date: '2026-10-05T07:00:00.000Z', distanceKm: 5, durationMin: 27 }
    // 11.1 km/h → MET ≈ 10.9 → 10.9 × 80 × 0.45 h ≈ 392
    expect(cardioKcal(run, weights)).toBeGreaterThan(380)
    expect(cardioKcal(run, weights)).toBeLessThan(400)
  })
})

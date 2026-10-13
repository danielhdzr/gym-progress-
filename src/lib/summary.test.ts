import { describe, expect, it } from 'vitest'
import type { AppState, Workout } from '../types'
import { defaultState } from './defaults'
import { monthRange, periodSummary, summaryOffer, yearRange } from './summary'

const w = (date: string, exerciseId: string, weight: number, reps: number, sets = 3): Workout => {
  const start = new Date(`${date}T18:00:00`)
  return {
    id: `${date}-${exerciseId}`,
    name: 'x',
    startedAt: start.toISOString(),
    finishedAt: new Date(start.getTime() + 3600000).toISOString(),
    entries: [{ exerciseId, sets: Array.from({ length: sets }, () => ({ weight, reps, done: true })) }],
  }
}

const state = (patch: Partial<AppState>): AppState => ({ ...defaultState(), ...patch })

describe('resumen del periodo', () => {
  const s = state({
    workouts: [w('2026-08-20', 'bench', 60, 8), w('2026-09-03', 'bench', 62.5, 8), w('2026-09-10', 'bench', 65, 8), w('2026-09-12', 'squat', 80, 5, 2)],
    cardio: [{ id: 'c', type: 'walk', date: new Date('2026-09-15T07:00:00').toISOString(), distanceKm: 4.5, durationMin: 50 }],
  })

  it('cuenta entrenos, series, volumen, cardio y días activos del mes', () => {
    const m = periodSummary(s, monthRange(2026, 8))
    expect(m.label).toBe('Septiembre 2026')
    expect(m).toMatchObject({ workouts: 3, sets: 8, cardioSessions: 1, km: 4.5, activeDays: 4 })
    // 3×62.5×8 + 3×65×8 + 2×80×5 = 1500 + 1560 + 800
    expect(m.volumeKg).toBe(3860)
    expect(m.favorite).toBe('Press banca')
  })

  it('cuenta récords y el ejercicio que más mejoró frente a antes del mes', () => {
    const m = periodSummary(s, monthRange(2026, 8))
    expect(m.prs).toBe(2) // 62.5 y 65 superan a lo anterior; la sentadilla es nueva
    expect(m.topImprovement).toBe('Press banca +8 %') // 65×8 vs 60×8
  })

  it('resumen anual', () => {
    expect(periodSummary(s, yearRange(2026)).workouts).toBe(4)
  })
})

describe('cuándo ofrecer el resumen', () => {
  it('del 1 al 5 de cada mes, el del mes anterior', () => {
    expect(summaryOffer(new Date(2026, 9, 2))).toMatchObject({ key: '2026-09', kind: 'month', month0: 8 })
    expect(summaryOffer(new Date(2026, 9, 6))).toBeNull()
    expect(summaryOffer(new Date(2026, 1, 3))).toMatchObject({ key: '2026-01', month0: 0 })
  })

  it('anual del 31 de diciembre al 7 de enero', () => {
    expect(summaryOffer(new Date(2026, 11, 31))).toMatchObject({ key: '2026', kind: 'year', year: 2026 })
    expect(summaryOffer(new Date(2027, 0, 4))).toMatchObject({ key: '2026', kind: 'year', year: 2026 })
  })
})

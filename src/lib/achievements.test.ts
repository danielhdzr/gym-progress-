import { describe, expect, it } from 'vitest'
import type { AppState, Workout } from '../types'
import { defaultState } from './defaults'
import { evaluateAchievements } from './achievements'

const w = (date: string, exerciseId = 'bench', weight = 60, reps = 8, hour = 18): Workout => {
  const start = new Date(`${date}T${String(hour).padStart(2, '0')}:00:00`)
  return {
    id: `${date}-${exerciseId}-${hour}`,
    name: 'x',
    startedAt: start.toISOString(),
    finishedAt: new Date(start.getTime() + 3600000).toISOString(),
    entries: [{ exerciseId, sets: [{ weight, reps, done: true }] }],
  }
}

const stateWith = (patch: Partial<AppState>): AppState => ({ ...defaultState(), ...patch })
const get = (s: AppState, id: string) => evaluateAchievements(s).find((a) => a.id === id)!

describe('logros', () => {
  it('hay 24 logros con ids únicos', () => {
    const all = evaluateAchievements(defaultState())
    expect(all).toHaveLength(24)
    expect(new Set(all.map((a) => a.id)).size).toBe(24)
    expect(all.every((a) => !a.done)).toBe(true)
  })

  it('constancia: primer entreno y progreso hacia 10', () => {
    const s = stateWith({ workouts: [w('2026-01-05'), w('2026-01-07')] })
    expect(get(s, 'first-step').done).toBe(true)
    expect(get(s, 'workouts-10')).toMatchObject({ done: false, progress: '2 de 10 entrenos' })
  })

  it('racha de 4 semanas, contando pesas o cardio', () => {
    const s = stateWith({
      workouts: [w('2026-01-05'), w('2026-01-12'), w('2026-01-26')],
      cardio: [{ id: 'c', type: 'walk', date: new Date('2026-01-20T07:00:00').toISOString(), distanceKm: 3, durationMin: 30 }],
    })
    expect(get(s, 'streak-4').done).toBe(true)
  })

  it('fuerza relativa necesita el peso corporal', () => {
    const s = stateWith({ workouts: [w('2026-01-05', 'bench', 75, 5)] })
    expect(get(s, 'bench-bw')).toMatchObject({ done: false, progress: 'Registra tu peso corporal en Progreso' })
    const withBw = { ...s, bodyweight: [{ date: '2026-01-01', kg: 80 }] }
    // 75 × (1 + 5/30) = 87.5 ≥ 80
    expect(get(withBw, 'bench-bw').done).toBe(true)
  })

  it('récords, madrugador y club de los 100', () => {
    const s = stateWith({ workouts: [w('2026-01-05', 'squat', 80, 5, 6), w('2026-01-08', 'squat', 90, 5)] })
    expect(get(s, 'first-pr').done).toBe(true)
    expect(get(s, 'early-bird').done).toBe(true)
    expect(get(s, 'club-100').done).toBe(true) // 90 × 1.1667 = 105
  })

  it('cardio y especiales', () => {
    const run = (date: string, km: number) => ({ id: date, type: 'run' as const, date: new Date(`${date}T07:00:00`).toISOString(), distanceKm: km, durationMin: km * 6 })
    const s = stateWith({
      workouts: [w('2026-01-01'), w('2026-02-01')],
      cardio: [run('2026-01-01', 5.2), run('2026-01-02', 3), run('2026-01-03', 2)],
      settings: { ...defaultState().settings, birthday: '1995-02-01' },
    })
    expect(get(s, 'run-5k').done).toBe(true)
    expect(get(s, 'run-10k').done).toBe(false)
    expect(get(s, 'cardio-week').done).toBe(true)
    expect(get(s, 'new-year').done).toBe(true)
    expect(get(s, 'all-terrain').done).toBe(true)
    expect(get(s, 'birthday').done).toBe(true)
    expect(get(s, 'comeback').done).toBe(true) // del 3 de enero al 1 de febrero
  })
})

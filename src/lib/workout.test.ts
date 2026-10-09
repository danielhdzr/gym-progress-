import { describe, expect, it } from 'vitest'
import type { Workout } from '../types'
import { historyBefore, newEntry, saveLoggedWorkout } from './workout'

const bench = (id: string, date: string, weight: number, reps: number): Workout => ({
  id,
  name: 'Push',
  startedAt: `${date}T18:00:00.000Z`,
  finishedAt: `${date}T19:00:00.000Z`,
  entries: [{ exerciseId: 'bench', sets: [{ weight, reps, done: true }] }],
})

describe('historyBefore', () => {
  it('excluye el propio entreno y los posteriores', () => {
    const all = [bench('a', '2026-01-01', 60, 8), bench('b', '2026-01-05', 60, 9), bench('c', '2026-01-10', 60, 10)]
    expect(historyBefore(all, all[1]).map((w) => w.id)).toEqual(['a'])
  })
})

describe('saveLoggedWorkout', () => {
  it('marca como hechas las series con reps y descarta las vacías', () => {
    const draft: Workout = {
      id: 'x',
      name: 'Pasado',
      startedAt: '2026-01-03T18:00:00.000Z',
      entries: [
        { exerciseId: 'bench', sets: [{ weight: 60, reps: 8, done: false }, { weight: 60, reps: 0, done: false }] },
        { exerciseId: 'row', sets: [{ weight: 50, reps: 0, done: false }] },
      ],
    }
    const { workout } = saveLoggedWorkout(draft, 45, [])
    expect(workout.entries).toHaveLength(1)
    expect(workout.entries[0].sets).toEqual([{ weight: 60, reps: 8, done: true }])
    expect(workout.finishedAt).toBe('2026-01-03T18:45:00.000Z')
  })

  it('calcula récords solo contra entrenos anteriores a esa fecha', () => {
    const history = [bench('a', '2026-01-01', 60, 8), bench('c', '2026-01-10', 70, 8)]
    const past = bench('b', '2026-01-05', 62.5, 8)
    // 62.5×8 supera a 60×8 (antes), aunque no al 70×8 posterior
    expect(saveLoggedWorkout(past, 60, history).prs).toEqual(['bench'])
  })

  it('al editar no se compara contra su propia versión anterior', () => {
    const original = bench('a', '2026-01-01', 60, 8)
    const edited = bench('a', '2026-01-01', 60, 9)
    expect(saveLoggedWorkout(edited, 60, [original]).prs).toEqual([])
  })
})

describe('newEntry', () => {
  it('con weightOnly precarga el peso pero deja las reps vacías', () => {
    const ex = { id: 'bench', name: 'Press banca', muscle: 'Pecho', repMin: 6, repMax: 10, increment: 2.5 }
    const entry = newEntry(ex, [bench('a', '2026-01-01', 60, 8)], 2, true)
    expect(entry.sets).toEqual([
      { weight: 60, reps: 0, done: false },
      { weight: 60, reps: 0, done: false },
    ])
  })
})

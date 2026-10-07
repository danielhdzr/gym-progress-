import { describe, expect, it } from 'vitest'
import type { Exercise, Workout } from '../types'
import { e1rm, isStalled, prsIn, sessionsFor, suggest } from './progression'

const bench: Exercise = { id: 'bench', name: 'Press banca', muscle: 'Pecho', repMin: 6, repMax: 10, increment: 2.5 }

let day = 1
function workout(sets: [number, number][], exerciseId = 'bench'): Workout {
  const date = `2026-01-${String(day++).padStart(2, '0')}T10:00:00.000Z`
  return {
    id: date,
    name: 'Test',
    startedAt: date,
    finishedAt: date,
    entries: [{ exerciseId, sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })) }],
  }
}

describe('e1rm', () => {
  it('usa Epley y devuelve el peso con 1 rep', () => {
    expect(e1rm(100, 1)).toBe(100)
    expect(e1rm(100, 10)).toBeCloseTo(133.33, 1)
  })
})

describe('suggest', () => {
  it('pide elegir peso la primera vez', () => {
    expect(suggest(bench, [], 3).kind).toBe('new')
  })

  it('sube peso al completar el tope del rango en todas las series', () => {
    const s = suggest(bench, sessionsFor('bench', [workout([[60, 10], [60, 10], [60, 10]])]), 3)
    expect(s).toMatchObject({ kind: 'up', weight: 62.5, reps: 6 })
  })

  it('pide +1 rep si no completó el rango', () => {
    const s = suggest(bench, sessionsFor('bench', [workout([[60, 8], [60, 8], [60, 7]])]), 3)
    expect(s).toMatchObject({ kind: 'reps', weight: 60, reps: 8 })
  })

  it('no sube si hizo menos series de las planeadas', () => {
    const s = suggest(bench, sessionsFor('bench', [workout([[60, 10], [60, 10]])]), 3)
    expect(s.kind).toBe('reps')
  })

  it('sugiere deload tras dos sesiones bajo el mínimo con el mismo peso', () => {
    const history = [workout([[80, 5], [80, 4]]), workout([[80, 5], [80, 4]])]
    const s = suggest(bench, sessionsFor('bench', history), 2)
    expect(s).toMatchObject({ kind: 'deload', weight: 72.5 })
  })

  it('en ejercicios sin peso progresa por reps', () => {
    const s = suggest(bench, sessionsFor('bench', [workout([[0, 7], [0, 6]])]), 2)
    expect(s).toMatchObject({ kind: 'reps', weight: 0, reps: 7 })
  })
})

describe('isStalled / prsIn', () => {
  it('detecta 3 sesiones sin superar el mejor previo', () => {
    const h = [workout([[60, 10]]), workout([[60, 9]]), workout([[60, 9]]), workout([[60, 10]])]
    expect(isStalled(sessionsFor('bench', h))).toBe(true)
  })

  it('no marca estancado si hay mejora reciente', () => {
    const h = [workout([[60, 8]]), workout([[60, 9]]), workout([[60, 9]]), workout([[62.5, 9]])]
    expect(isStalled(sessionsFor('bench', h))).toBe(false)
  })

  it('reconoce récords personales', () => {
    const prev = [workout([[60, 8]])]
    expect(prsIn(workout([[60, 9]]), prev)).toEqual(['bench'])
    expect(prsIn(workout([[60, 7]]), prev)).toEqual([])
  })
})

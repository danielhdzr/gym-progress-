import { describe, expect, it } from 'vitest'
import { DEFAULT_EXERCISES } from './defaults'
import { EXERCISE_GROUPS, alternativesFor, groupOf } from './library'
import { TECHNIQUE } from './technique'

describe('biblioteca de ejercicios', () => {
  it('tiene 57 ejercicios sin ids repetidos', () => {
    const ids = DEFAULT_EXERCISES.map((e) => e.id)
    expect(ids).toHaveLength(57)
    expect(new Set(ids).size).toBe(57)
  })

  it('cada ejercicio está en exactamente un grupo y tiene guía de técnica', () => {
    for (const e of DEFAULT_EXERCISES) {
      expect(EXERCISE_GROUPS.filter((g) => g.ids.includes(e.id)), e.id).toHaveLength(1)
      expect(TECHNIQUE[e.id]?.cues.length, e.id).toBeGreaterThanOrEqual(3)
      expect(TECHNIQUE[e.id]?.errors.length, e.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('los grupos solo usan ejercicios existentes', () => {
    const ids = new Set(DEFAULT_EXERCISES.map((e) => e.id))
    for (const g of EXERCISE_GROUPS) for (const id of g.ids) expect(ids.has(id), id).toBe(true)
  })

  it('sugiere alternativas del mismo movimiento', () => {
    const press = DEFAULT_EXERCISES.find((e) => e.id === 'leg-press')!
    const alts = alternativesFor(press, DEFAULT_EXERCISES).map((e) => e.id)
    expect(alts).toContain('bulgarian')
    expect(alts).toContain('hack')
    expect(alts).not.toContain('leg-press')
    expect(alts).not.toContain('bench')
  })

  it('un ejercicio propio con el mismo nombre que uno de la biblioteca hereda su grupo', () => {
    const mine = { id: 'abc', name: 'paseo del granjero ', muscle: 'Antebrazos', repMin: 20, repMax: 40, increment: 2 }
    expect(groupOf(mine, [...DEFAULT_EXERCISES, mine])).toBe('grip')
  })

  it('un ejercicio propio sin grupo usa el mismo músculo', () => {
    const mine = { id: 'xyz', name: 'Mi press raro', muscle: 'Pecho', repMin: 8, repMax: 12, increment: 2 }
    expect(alternativesFor(mine, [...DEFAULT_EXERCISES, mine]).every((e) => e.muscle === 'Pecho')).toBe(true)
  })
})

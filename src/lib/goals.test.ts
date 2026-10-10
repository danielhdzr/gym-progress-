import { describe, expect, it } from 'vitest'
import type { Target, Workout } from '../types'
import { suggestFor } from './progression'
import { defaultTarget, fmtRest, fmtScheme } from './goals'
import { TEMPLATES, buildRoutines, recommendTemplates } from './templates'
import { DEFAULT_EXERCISES } from './defaults'

const bench = DEFAULT_EXERCISES.find((e) => e.id === 'bench')!
const lateral = DEFAULT_EXERCISES.find((e) => e.id === 'lateral')!
const STRENGTH: Target = { goal: 'strength', repMin: 5, repMax: 5, restSeconds: 180 }
const HYP: Target = { goal: 'hypertrophy', repMin: 8, repMax: 12, restSeconds: 120 }

let day = 1
const w = (sets: [number, number][], target?: Target): Workout => {
  const d = `2026-03-${String(day++).padStart(2, '0')}T18:00:00.000Z`
  return {
    id: d,
    name: 'x',
    startedAt: d,
    finishedAt: d,
    entries: [{ exerciseId: 'bench', sets: sets.map(([weight, reps]) => ({ weight, reps, done: true })), ...(target ? { target } : {}) }],
  }
}

describe('objetivos por defecto', () => {
  it('fuerza 5×5 con 3 min; hipertrofia respeta el rango propio del ejercicio', () => {
    expect(defaultTarget('strength')).toEqual(STRENGTH)
    expect(defaultTarget('hypertrophy', 'hypertrophy', lateral)).toMatchObject({ repMin: 12, repMax: 20, restSeconds: 120 })
    expect(defaultTarget('hypertrophy', 'cut', bench).restSeconds).toBe(75)
  })

  it('formatea esquema y descanso', () => {
    expect(fmtScheme(5, STRENGTH)).toBe('5×5')
    expect(fmtScheme(3, HYP)).toBe('3×8–12')
    expect(fmtScheme(3, { repMin: 30, repMax: 60 }, 'seconds')).toBe('3×30–60 seg')
    expect(fmtRest(180)).toBe('3 min')
    expect(fmtRest(75)).toBe('75 s')
    expect(fmtRest(150)).toBe('2:30 min')
  })
})

describe('suggestFor', () => {
  it('fuerza: progresión lineal al completar 5×5', () => {
    const h = [w([[80, 5], [80, 5], [80, 5], [80, 5], [80, 5]], STRENGTH)]
    expect(suggestFor(bench, STRENGTH, h, 5)).toMatchObject({ kind: 'up', weight: 82.5, reps: 5 })
  })

  it('fuerza: si falló una serie repite el peso', () => {
    const h = [w([[80, 5], [80, 5], [80, 5], [80, 4], [80, 4]], STRENGTH)]
    expect(suggestFor(bench, STRENGTH, h, 5)).toMatchObject({ kind: 'reps', weight: 80, reps: 5 })
  })

  it('compara fuerza con fuerza e hipertrofia con hipertrofia', () => {
    const h = [w([[80, 5], [80, 5], [80, 5], [80, 5], [80, 5]], STRENGTH), w([[60, 9], [60, 9], [60, 8]], HYP)]
    expect(suggestFor(bench, HYP, h, 3)).toMatchObject({ weight: 60, reps: 9 })
    expect(suggestFor(bench, STRENGTH, h, 5)).toMatchObject({ weight: 82.5 })
  })

  it('primera vez en fuerza: estima desde el 1RM de tus sesiones de hipertrofia', () => {
    // 60×10 → 1RM ≈ 80; 5 reps → 80 / 1.1667 ≈ 68.6; al 90 % ≈ 61.7 → 62.5
    const s = suggestFor(bench, STRENGTH, [w([[60, 10], [60, 10], [60, 10]])], 5)
    expect(s).toMatchObject({ kind: 'new', weight: 62.5, reps: 5 })
    expect(s.text).toContain('1RM')
  })

  it('las sesiones sin objetivo (versiones anteriores) cuentan como hipertrofia', () => {
    expect(suggestFor(bench, HYP, [w([[60, 12], [60, 12], [60, 12]])], 3)).toMatchObject({ kind: 'up', weight: 62.5 })
  })
})

describe('plantillas', () => {
  it('todas usan ejercicios existentes y objetivos válidos', () => {
    for (const t of TEMPLATES) {
      const routines = buildRoutines(t, DEFAULT_EXERCISES)
      const expected = t.routines.reduce((n, r) => n + r.rows.length, 0)
      expect(routines.reduce((n, r) => n + r.items.length, 0), t.id).toBe(expected)
      for (const r of routines)
        for (const i of r.items) {
          expect(i.target!.repMin).toBeLessThanOrEqual(i.target!.repMax)
          expect(i.target!.restSeconds).toBeGreaterThan(0)
        }
    }
  })

  it('powerbuilding: básico de fuerza primero y accesorios de hipertrofia', () => {
    const [torsoA, piernaA] = buildRoutines(TEMPLATES.find((t) => t.id === 'powerbuilding')!, DEFAULT_EXERCISES)
    expect(torsoA.name).toBe('Powerbuilding · Torso A')
    expect(torsoA.items[0]).toMatchObject({ exerciseId: 'bench', sets: 5, target: { goal: 'strength', repMin: 5, repMax: 5 } })
    expect(torsoA.items[1].target?.goal).toBe('hypertrophy')
    expect(piernaA.items[0]).toMatchObject({ exerciseId: 'deadlift', sets: 3 })
  })

  it('definición acorta los descansos de hipertrofia', () => {
    const [a] = buildRoutines(TEMPLATES.find((t) => t.id === 'cut-fullbody')!, DEFAULT_EXERCISES)
    expect(a.items.every((i) => i.target!.restSeconds === 75)).toBe(true)
  })

  it('recomienda según objetivo y días', () => {
    expect(recommendTemplates('strength', 3)[0].id).toBe('strength-5x5')
    expect(recommendTemplates('muscle', 4)[0].id).toBe('hyp-ul')
    expect(recommendTemplates('mixed', 4)[0].id).toBe('powerbuilding')
    expect(recommendTemplates('cut', 3)[0].goal).toBe('cut')
  })
})

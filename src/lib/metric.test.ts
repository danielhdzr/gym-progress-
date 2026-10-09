import { describe, expect, it } from 'vitest'
import { fmtSet, metricOf } from './metric'

describe('fmtSet', () => {
  it('formatea según la unidad', () => {
    expect(fmtSet({ weight: 60, reps: 8 }, 'reps')).toBe('60×8')
    expect(fmtSet({ weight: 0, reps: 12 }, 'reps')).toBe('12 reps')
    expect(fmtSet({ weight: 40, reps: 30 }, 'meters')).toBe('40×30 m')
    expect(fmtSet({ weight: 0, reps: 45, rpe: 8 }, 'seconds')).toBe('45 s @8')
  })

  it('los ejercicios guardados antes de existir la unidad cuentan como reps', () => {
    expect(metricOf({})).toBe('reps')
  })
})

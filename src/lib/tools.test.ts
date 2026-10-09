import { describe, expect, it } from 'vitest'
import { fmtPlates, platesPerSide, warmupSets } from './tools'

const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25]

describe('platesPerSide', () => {
  it('arma el peso con los discos más grandes primero', () => {
    expect(platesPerSide(100, 20, PLATES)).toEqual({ perSide: [25, 15], remainder: 0 })
    expect(platesPerSide(62.5, 20, PLATES)).toEqual({ perSide: [20, 1.25], remainder: 0 })
  })

  it('reporta lo que no se puede armar', () => {
    expect(platesPerSide(61, 20, PLATES).remainder).toBe(1)
  })

  it('solo barra cuando el peso no la supera', () => {
    expect(fmtPlates(platesPerSide(20, 20, PLATES))).toBe('Solo la barra')
  })

  it('agrupa discos repetidos', () => {
    expect(fmtPlates(platesPerSide(140, 20, PLATES))).toBe('2×25 + 10')
  })
})

describe('warmupSets', () => {
  it('genera barra + 40/60/80 % redondeado a 2.5', () => {
    expect(warmupSets(100, 20)).toEqual([
      { weight: 20, reps: 10 },
      { weight: 40, reps: 5 },
      { weight: 60, reps: 3 },
      { weight: 80, reps: 2 },
    ])
  })

  it('omite escalones por debajo de la barra o repetidos', () => {
    expect(warmupSets(40, 20).map((s) => s.weight)).toEqual([20, 25, 32.5])
  })

  it('sin peso de trabajo no hay calentamiento', () => {
    expect(warmupSets(0, 20)).toEqual([])
  })
})

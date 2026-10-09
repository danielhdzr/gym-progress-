import { describe, expect, it } from 'vitest'
import type { Exercise, Workout } from '../types'
import {
  bestImprovement,
  easterSunday,
  fmtMonths,
  monthsCompletedToday,
  nthWeekday,
  occasionFor,
  previewNow,
  seasonOf,
  seasonStartingToday,
  timeOfDay,
  type OccasionInput,
} from './occasions'

const D = (y: number, m: number, d: number, h = 10) => new Date(y, m - 1, d, h)

const base = (now: Date, extra: Partial<OccasionInput> = {}): OccasionInput => ({
  now,
  name: 'Daniel',
  country: 'MX',
  birthday: '',
  trainingStart: '',
  workouts: [],
  exercises: [],
  cardio: [],
  ...extra,
})

const bench: Exercise = { id: 'bench', name: 'Press banca', muscle: 'Pecho', repMin: 6, repMax: 10, increment: 2.5 }
const w = (date: string, weight: number, reps: number): Workout => ({
  id: date,
  name: 'Push',
  startedAt: new Date(`${date}T18:00:00`).toISOString(),
  finishedAt: new Date(`${date}T19:00:00`).toISOString(),
  entries: [{ exerciseId: 'bench', sets: [{ weight, reps, done: true }] }],
})

describe('fechas móviles', () => {
  it('calcula el domingo de Pascua', () => {
    expect(easterSunday(2024).toDateString()).toBe(D(2024, 3, 31).toDateString())
    expect(easterSunday(2025).toDateString()).toBe(D(2025, 4, 20).toDateString())
    expect(easterSunday(2026).toDateString()).toBe(D(2026, 4, 5).toDateString())
  })

  it('calcula Acción de Gracias (4.º jueves de noviembre)', () => {
    expect(nthWeekday(2026, 11, 4, 4).getDate()).toBe(26)
    expect(nthWeekday(2025, 11, 4, 4).getDate()).toBe(27)
  })
})

describe('hora y estación', () => {
  it('distingue mañana, tarde y noche', () => {
    expect(timeOfDay(D(2026, 1, 1, 7))).toBe('morning')
    expect(timeOfDay(D(2026, 1, 1, 15))).toBe('afternoon')
    expect(timeOfDay(D(2026, 1, 1, 23))).toBe('night')
    expect(timeOfDay(D(2026, 1, 1, 3))).toBe('night')
  })

  it('invierte las estaciones en el hemisferio sur', () => {
    expect(seasonOf(D(2026, 1, 15))).toBe('winter')
    expect(seasonOf(D(2026, 1, 15), true)).toBe('summer')
    expect(seasonOf(D(2026, 10, 9))).toBe('autumn')
    expect(seasonOf(D(2026, 12, 21))).toBe('winter')
  })

  it('detecta equinoccios y solsticios', () => {
    expect(seasonStartingToday(D(2026, 3, 20))).toEqual({ season: 'spring', kind: 'equinoccio' })
    expect(seasonStartingToday(D(2026, 6, 21), true)).toEqual({ season: 'winter', kind: 'solsticio' })
    expect(seasonStartingToday(D(2026, 6, 22))).toBeNull()
  })
})

describe('meses cumplidos', () => {
  it('cuenta el día del mes en que empezaste', () => {
    expect(monthsCompletedToday(D(2026, 1, 15), D(2026, 4, 15))).toBe(3)
    expect(monthsCompletedToday(D(2026, 1, 15), D(2026, 4, 14))).toBeNull()
    expect(monthsCompletedToday(D(2026, 1, 15), D(2026, 1, 15))).toBeNull()
  })

  it('si empezaste un 31, en meses cortos cuenta el último día', () => {
    expect(monthsCompletedToday(D(2026, 1, 31), D(2026, 2, 28))).toBe(1)
    expect(monthsCompletedToday(D(2026, 1, 31), D(2026, 4, 30))).toBe(3)
  })

  it('formatea años y meses', () => {
    expect(fmtMonths(6)).toBe('6 meses')
    expect(fmtMonths(1)).toBe('1 mes')
    expect(fmtMonths(15)).toBe('1 año y 3 meses')
    expect(fmtMonths(24)).toBe('2 años')
  })
})

describe('occasionFor', () => {
  it('festivos de México', () => {
    expect(occasionFor(base(D(2026, 9, 16)))?.id).toBe('mx-independence')
    expect(occasionFor(base(D(2026, 11, 2)))?.id).toBe('mx-muertos')
  })

  it('los festivos nacionales dependen del país', () => {
    expect(occasionFor(base(D(2026, 7, 4)))).toBeNull()
    expect(occasionFor(base(D(2026, 7, 4), { country: 'US' }))?.id).toBe('us-independence')
    expect(occasionFor(base(D(2026, 11, 26), { country: 'US' }))?.id).toBe('us-thanksgiving')
  })

  it('festivos internacionales en cualquier país', () => {
    const o = occasionFor(base(D(2026, 10, 31), { country: 'AR' }))
    expect(o?.id).toBe('halloween')
    expect(o?.message).toContain('Daniel')
  })

  it('el cumpleaños tiene prioridad y alterna el mensaje cada año', () => {
    const b = { birthday: '1995-10-31' }
    const m2026 = occasionFor(base(D(2026, 10, 31), b))
    const m2027 = occasionFor(base(D(2027, 10, 31), b))
    expect(m2026?.id).toBe('birthday')
    expect(m2026?.message).not.toBe(m2027?.message)
  })

  it('cumpleaños del 29 de febrero se celebra el 28 en años no bisiestos', () => {
    expect(occasionFor(base(D(2026, 2, 28), { birthday: '2000-02-29' }))?.id).toBe('birthday')
  })

  it('mes cumplido con tu mejor avance', () => {
    const o = occasionFor(base(D(2026, 4, 15), { trainingStart: '2026-01-15', workouts: [w('2026-01-15', 50, 8), w('2026-03-20', 65, 8)], exercises: [bench] }))
    expect(o?.id).toBe('monthiversary')
    expect(o?.message).toContain('3 meses')
    expect(o?.detail).toBe('Tu press banca pasó de 50 a 65 kg desde que empezaste 🔥')
  })

  it('sin fecha de inicio usa el primer entreno', () => {
    expect(occasionFor(base(D(2026, 2, 15), { workouts: [w('2026-01-15', 50, 8)], exercises: [bench] }))?.id).toBe('monthiversary')
  })

  it('aniversario con tus datos', () => {
    const workouts = [w('2025-10-09', 50, 8), w('2026-01-10', 55, 8), w('2026-05-10', 60, 8)]
    const o = occasionFor(base(D(2026, 10, 9), { trainingStart: '2025-10-09', workouts, exercises: [bench] }))
    expect(o?.id).toBe('anniversary')
    expect(o?.message).toBe('🏆 ¡1 año entrenando, Daniel! 3 entrenos y 2 récords. Mira todo lo que has construido.')
  })

  it('inicio de estación según hemisferio', () => {
    expect(occasionFor(base(D(2026, 3, 20)))?.message).toContain('primavera (equinoccio)')
    expect(occasionFor(base(D(2026, 3, 20), { country: 'AR' }))?.message).toContain('otoño (equinoccio)')
  })

  it('un día normal no tiene ocasión', () => {
    expect(occasionFor(base(D(2026, 10, 9)))).toBeNull()
  })
})

describe('bestImprovement', () => {
  it('ignora ejercicios sin mejora', () => {
    expect(bestImprovement([w('2026-01-01', 60, 8), w('2026-02-01', 60, 8)], [bench])).toBeNull()
  })
})

describe('previewNow', () => {
  it('lee ?fecha= para previsualizar', () => {
    expect(previewNow('?fecha=2026-12-25').toDateString()).toBe(D(2026, 12, 25).toDateString())
    expect(previewNow('?fecha=2026-12-25T21:30').getHours()).toBe(21)
    expect(Math.abs(previewNow('?fecha=basura').getTime() - Date.now())).toBeLessThan(1000)
  })
})

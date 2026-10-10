import { describe, expect, it } from 'vitest'
import type { CardioSession, Exercise, Routine, Workout } from '../types'
import { activityStreak, dataLine, estimateMinutes, nextRoutine, routinePreview, weekDays, weekGoalMessage } from './home'

const r = (id: string, items = [{ exerciseId: 'bench', sets: 3 }]): Routine => ({ id, name: id, items })
const w = (date: string, routineId?: string, weight = 60, reps = 10): Workout => ({
  id: date,
  name: 'x',
  routineId,
  startedAt: new Date(`${date}T18:00:00`).toISOString(),
  finishedAt: new Date(`${date}T19:00:00`).toISOString(),
  entries: [{ exerciseId: 'bench', sets: Array.from({ length: 3 }, () => ({ weight, reps, done: true })) }],
})
const c = (date: string): CardioSession => ({ id: date, type: 'walk', date: new Date(`${date}T07:00:00`).toISOString(), distanceKm: 3, durationMin: 30 })
const bench: Exercise = { id: 'bench', name: 'Press banca', muscle: 'Pecho', repMin: 6, repMax: 10, increment: 2.5 }

// Sábado 10 oct 2026
const NOW = new Date(2026, 9, 10, 9)

describe('nextRoutine', () => {
  const routines = [r('push'), r('pull'), r('legs'), r('vacia', [])]

  it('sin historial sugiere la primera', () => {
    expect(nextRoutine(routines, [])?.id).toBe('push')
  })

  it('sugiere la siguiente a la última hecha y vuelve al inicio', () => {
    expect(nextRoutine(routines, [w('2026-10-08', 'push'), w('2026-10-09', 'pull')])?.id).toBe('legs')
    expect(nextRoutine(routines, [w('2026-10-09', 'legs')])?.id).toBe('push')
  })

  it('ignora rutinas vacías y entrenos libres', () => {
    expect(nextRoutine(routines, [w('2026-10-08', 'legs'), w('2026-10-09')])?.id).toBe('push')
  })
})

describe('resumen de rutina', () => {
  it('estima la duración', () => {
    expect(estimateMinutes({ id: 'a', name: 'a', items: [{ exerciseId: 'x', sets: 15 }] }, 120)).toBe(40)
  })

  it('adelanta la sugerencia del primer ejercicio', () => {
    expect(routinePreview(r('push'), [bench], [])).toBe('Press banca: primera vez')
    expect(routinePreview(r('push'), [bench], [w('2026-10-09', 'push', 60, 10)])).toBe('Press banca: sube a 62.5 kg')
    expect(routinePreview(r('push'), [bench], [w('2026-10-09', 'push', 60, 8)])).toBe('Press banca: 60 kg × 9 reps')
  })
})

describe('semana', () => {
  it('marca pesas, cardio y hoy', () => {
    const days = weekDays([w('2026-10-05'), w('2026-10-07')], [c('2026-10-07'), c('2026-10-08')], NOW)
    expect(days.map((d) => d.letter).join('')).toBe('LMMJVSD')
    expect(days[0].gym).toBe(true)
    expect(days[2]).toMatchObject({ gym: true, cardio: true })
    expect(days[3]).toMatchObject({ gym: false, cardio: true })
    expect(days[5].today).toBe(true)
    expect(days[6].future).toBe(true)
  })

  it('cuenta semanas seguidas con pesas o cardio', () => {
    expect(activityStreak([w('2026-09-22')], [c('2026-09-30'), c('2026-10-06')], NOW)).toBe(3)
    expect(activityStreak([w('2026-09-15')], [c('2026-10-06')], NOW)).toBe(1)
  })

  it('arma la línea de datos', () => {
    expect(dataLine([], [], NOW)).toBe('Sábado 10 de oct · ¡Empecemos!')
    expect(dataLine([w('2026-09-29'), w('2026-10-06')], [], NOW)).toBe('Sábado 10 de oct · 2 semanas seguidas 🔥')
  })

  it('mensaje de meta semanal', () => {
    expect(weekGoalMessage(1, 3)).toBe('Te faltan 2 días para tu meta de 3')
    expect(weekGoalMessage(2, 3)).toBe('Te falta 1 día para tu meta de 3')
    expect(weekGoalMessage(3, 3)).toBe('¡Meta semanal cumplida! 🎉')
    expect(weekGoalMessage(3, 0)).toBeNull()
  })
})

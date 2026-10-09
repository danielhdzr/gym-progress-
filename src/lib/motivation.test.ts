import { describe, expect, it } from 'vitest'
import type { Workout } from '../types'
import { consistency, finishMessage, greeting, homeMessage } from './motivation'

// Miércoles 8 oct 2026, 10:00 local
const NOW = new Date(2026, 9, 8, 10, 0)

const at = (y: number, m: number, d: number): Workout => {
  const start = new Date(y, m - 1, d, 18, 0)
  return {
    id: start.toISOString(),
    name: 'Push',
    startedAt: start.toISOString(),
    finishedAt: new Date(start.getTime() + 3600000).toISOString(),
    entries: [],
  }
}

describe('greeting', () => {
  it('saluda según la hora e incluye el nombre', () => {
    expect(greeting('Daniel', NOW)).toBe('Buenos días, Daniel 👋')
    expect(greeting('Daniel', new Date(2026, 9, 8, 15))).toBe('Buenas tardes, Daniel 👋')
    expect(greeting('', new Date(2026, 9, 8, 22))).toBe('Buenas noches 👋')
  })
})

describe('consistency', () => {
  it('cuenta entrenos de la semana y la racha de semanas', () => {
    // Semana actual (lun 5 oct): 2 entrenos. Semanas anteriores: 28 sep y 21 sep.
    const ws = [at(2026, 9, 22), at(2026, 9, 30), at(2026, 10, 5), at(2026, 10, 7)]
    const c = consistency(ws, NOW)
    expect(c.thisWeek).toBe(2)
    expect(c.weekStreak).toBe(3)
    expect(c.daysSinceLast).toBe(1)
    expect(c.trainedToday).toBe(false)
  })

  it('la racha sigue viva si aún no entrenas esta semana', () => {
    const c = consistency([at(2026, 9, 24), at(2026, 10, 1)], NOW)
    expect(c.thisWeek).toBe(0)
    expect(c.weekStreak).toBe(2)
  })

  it('una semana sin entrenar corta la racha', () => {
    expect(consistency([at(2026, 9, 15), at(2026, 10, 6)], NOW).weekStreak).toBe(1)
  })
})

describe('homeMessage', () => {
  it('anima a empezar si no hay entrenos', () => {
    expect(homeMessage('Daniel', [], NOW)).toContain('Hoy empieza tu progreso, Daniel')
  })

  it('da la bienvenida de vuelta tras una semana sin entrenar', () => {
    expect(homeMessage('Daniel', [at(2026, 9, 25)], NOW)).toContain('verte de vuelta, Daniel')
  })

  it('reconoce cuando ya entrenó hoy', () => {
    const today = { ...at(2026, 10, 8), startedAt: new Date(2026, 9, 8, 7).toISOString() }
    expect(homeMessage('', [today], NOW)).toContain('Ya entrenaste hoy')
  })

  it('funciona sin nombre', () => {
    expect(homeMessage('', [], NOW)).toBe('Hoy empieza tu progreso. El primer entreno es el más importante.')
  })
})

describe('finishMessage', () => {
  it('celebra récords', () => {
    expect(finishMessage('Daniel', 1, 7, NOW).title).toBe('¡Nuevo récord, Daniel! 🏆')
    expect(finishMessage('Daniel', 3, 7, NOW).title).toBe('¡3 récords nuevos, Daniel! 🏆')
  })

  it('celebra hitos de número de entrenos', () => {
    expect(finishMessage('Daniel', 0, 1, NOW).subtitle).toContain('primer entreno')
    expect(finishMessage('Daniel', 0, 1, NOW).title).toBe('¡Excelente trabajo, Daniel! 💪')
    expect(finishMessage('Daniel', 0, 10, NOW).subtitle).toContain('10 entrenos')
  })
})

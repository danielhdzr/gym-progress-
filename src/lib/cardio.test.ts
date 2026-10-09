import { describe, expect, it } from 'vitest'
import type { CardioSession } from '../types'
import {
  cardioPRs,
  fmtDurationClock,
  fmtPace,
  pace,
  pauseTimer,
  records,
  resumeTimer,
  startTimer,
  timerElapsedMs,
  weekSummary,
  weeklyKm,
} from './cardio'

const s = (id: string, type: 'walk' | 'run', date: string, distanceKm: number, durationMin: number): CardioSession => ({
  id,
  type,
  date: new Date(`${date}T07:00:00`).toISOString(),
  distanceKm,
  durationMin,
})

describe('ritmo y formato', () => {
  it('calcula el ritmo en min/km', () => {
    expect(pace({ distanceKm: 5, durationMin: 42.5 })).toBe(8.5)
    expect(fmtPace(8.5)).toBe('8:30 /km')
    expect(fmtPace(5.999)).toBe('6:00 /km')
    expect(fmtPace(null)).toBe('—')
  })

  it('formatea la duración como reloj', () => {
    expect(fmtDurationClock(52.5)).toBe('52:30')
    expect(fmtDurationClock(75)).toBe('1:15:00')
  })
})

describe('cronómetro', () => {
  it('acumula tiempo con pausas', () => {
    let t = startTimer('walk', 0)
    t = pauseTimer(t, 60_000) // 1 min corriendo
    expect(timerElapsedMs(t, 500_000)).toBe(60_000) // en pausa no avanza
    t = resumeTimer(t, 500_000)
    expect(timerElapsedMs(t, 530_000)).toBe(90_000)
  })
})

describe('resúmenes semanales', () => {
  // Jueves 8 oct 2026; la semana empieza el lunes 5
  const NOW = new Date(2026, 9, 8, 12).getTime()
  const all = [s('a', 'walk', '2026-10-05', 3, 35), s('b', 'run', '2026-10-07', 5, 30), s('c', 'walk', '2026-10-01', 4, 45)]

  it('suma la semana actual', () => {
    expect(weekSummary(all, NOW)).toEqual({ km: 8, minutes: 65, sessions: 2 })
  })

  it('agrupa km por semana', () => {
    const weeks = weeklyKm(all, 2, NOW)
    expect(weeks.map((w) => w.km)).toEqual([4, 8])
  })
})

describe('récords', () => {
  const history = [s('a', 'run', '2026-10-01', 5, 30), s('b', 'run', '2026-10-03', 3, 16.5), s('w', 'walk', '2026-10-02', 8, 90)]

  it('encuentra el más largo y el mejor ritmo por tipo', () => {
    const r = records(history, 'run')
    expect(r.longestKm?.id).toBe('a')
    expect(r.bestPace?.id).toBe('b') // 5:30 vs 6:00
  })

  it('detecta récords nuevos solo contra sesiones anteriores del mismo tipo', () => {
    expect(cardioPRs(s('n', 'run', '2026-10-05', 6, 32), history)).toEqual(['Tu carrera más larga', 'Tu carrera con más tiempo', 'Tu mejor ritmo'])
    // 6 km caminando a 11:40 /km no supera ni los 8 km ni el ritmo de 11:15
    expect(cardioPRs(s('n2', 'walk', '2026-10-05', 6, 70), history)).toEqual([])
  })

  it('no cuenta ritmos en distancias muy cortas', () => {
    expect(cardioPRs(s('n', 'run', '2026-10-05', 0.5, 2), history)).toEqual([])
  })

  it('la primera sesión no es "récord"', () => {
    expect(cardioPRs(s('n', 'walk', '2026-10-05', 1, 10), [])).toEqual([])
  })
})

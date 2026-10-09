import type { CardioSession, CardioTimer, CardioType } from '../types'

export const CARDIO_TYPES: { id: CardioType; label: string; icon: string }[] = [
  { id: 'walk', label: 'Caminata', icon: '🚶' },
  { id: 'run', label: 'Carrera', icon: '🏃' },
]

export const cardioLabel = (t: CardioType) => CARDIO_TYPES.find((x) => x.id === t) ?? CARDIO_TYPES[0]

/** Minutos por km, o null si no hay distancia. */
export const pace = (s: Pick<CardioSession, 'distanceKm' | 'durationMin'>) =>
  s.distanceKm > 0 && s.durationMin > 0 ? s.durationMin / s.distanceKm : null

/** Velocidad promedio en km/h, o null si no hay tiempo. */
export const speedKmh = (s: Pick<CardioSession, 'distanceKm' | 'durationMin'>) =>
  s.distanceKm > 0 && s.durationMin > 0 ? s.distanceKm / (s.durationMin / 60) : null

/** 11.11 → "11.1 km/h" */
export const fmtSpeed = (kmh: number | null) => (kmh === null || !Number.isFinite(kmh) ? '—' : `${kmh.toFixed(1)} km/h`)

/** 8.5 → "8:30 /km" */
export function fmtPace(minPerKm: number | null) {
  if (minPerKm === null || !Number.isFinite(minPerKm)) return '—'
  let m = Math.floor(minPerKm)
  let s = Math.round((minPerKm - m) * 60)
  if (s === 60) {
    m++
    s = 0
  }
  return `${m}:${String(s).padStart(2, '0')} /km`
}

/** 52.5 → "52:30"; 75 → "1:15:00" */
export function fmtDurationClock(totalMin: number) {
  const total = Math.max(0, Math.round(totalMin * 60))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export const fmtKm = (km: number) => `${Number.isInteger(km) ? km : km.toFixed(2).replace(/0$/, '')} km`

/* Cronómetro */

export const timerElapsedMs = (t: CardioTimer, now = Date.now()) =>
  t.elapsedMs + (t.runningSince !== null ? now - t.runningSince : 0)

export const startTimer = (type: CardioType, now = Date.now()): CardioTimer => ({
  type,
  startedAt: new Date(now).toISOString(),
  elapsedMs: 0,
  runningSince: now,
})

export const pauseTimer = (t: CardioTimer, now = Date.now()): CardioTimer =>
  t.runningSince === null ? t : { ...t, elapsedMs: timerElapsedMs(t, now), runningSince: null }

export const resumeTimer = (t: CardioTimer, now = Date.now()): CardioTimer =>
  t.runningSince !== null ? t : { ...t, runningSince: now }

/* Resúmenes */

const DAY = 24 * 60 * 60 * 1000

/** Lunes 00:00 local de la semana de `date`. */
export function weekStart(date: Date | string | number) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

export interface WeekSummary {
  km: number
  minutes: number
  sessions: number
}

export function weekSummary(sessions: CardioSession[], weekOf: Date | number = Date.now()): WeekSummary {
  const start = weekStart(weekOf)
  const inWeek = sessions.filter((s) => weekStart(s.date) === start)
  return {
    km: round2(inWeek.reduce((n, s) => n + s.distanceKm, 0)),
    minutes: inWeek.reduce((n, s) => n + s.durationMin, 0),
    sessions: inWeek.length,
  }
}

/** Km por semana de las últimas `weeks` semanas (la más antigua primero). */
export function weeklyKm(sessions: CardioSession[], weeks = 8, now = Date.now()) {
  const current = weekStart(now)
  return Array.from({ length: weeks }, (_, i) => {
    // Restar días y recalcular el lunes evita errores con el cambio de horario
    const start = weekStart(current - (weeks - 1 - i) * 7 * DAY + DAY)
    return { weekStart: start, km: weekSummary(sessions, start).km }
  })
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** Distancia mínima para que un ritmo cuente como récord (evita "récords" en 200 m). */
export const MIN_PACE_KM = 1

export interface CardioRecords {
  longestKm: CardioSession | null
  longestTime: CardioSession | null
  bestPace: CardioSession | null
}

export function records(sessions: CardioSession[], type: CardioType): CardioRecords {
  const own = sessions.filter((s) => s.type === type)
  const max = (f: (s: CardioSession) => number) =>
    own.reduce<CardioSession | null>((best, s) => (!best || f(s) > f(best) ? s : best), null)
  const paced = own.filter((s) => s.distanceKm >= MIN_PACE_KM && pace(s) !== null)
  return {
    longestKm: max((s) => s.distanceKm),
    longestTime: max((s) => s.durationMin),
    bestPace: paced.reduce<CardioSession | null>((best, s) => (!best || pace(s)! < pace(best)! ? s : best), null),
  }
}

/** Récords que rompe `session` frente a las sesiones anteriores del mismo tipo. */
export function cardioPRs(session: CardioSession, all: CardioSession[]): string[] {
  const previous = all.filter((s) => s.id !== session.id && s.type === session.type && s.date < session.date)
  if (!previous.length) return []
  const prev = records(previous, session.type)
  const label = session.type === 'run' ? 'carrera' : 'caminata'
  const prs: string[] = []
  if (prev.longestKm && session.distanceKm > prev.longestKm.distanceKm) prs.push(`Tu ${label} más larga`)
  if (prev.longestTime && session.durationMin > prev.longestTime.durationMin) prs.push(`Tu ${label} con más tiempo`)
  const p = pace(session)
  if (session.distanceKm >= MIN_PACE_KM && p !== null && prev.bestPace && p < pace(prev.bestPace)!)
    prs.push('Tu mejor ritmo')
  return prs
}

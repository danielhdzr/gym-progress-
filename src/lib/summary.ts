import type { AppState, Workout } from '../types'
import { bestSet, prsIn, sessionsFor } from './progression'
import { metricOf } from './metric'

/** Resumen de un periodo (mes o año) para la tarjeta compartible. */
export interface PeriodSummary {
  /** "Octubre 2026", "2026" */
  label: string
  workouts: number
  activeDays: number
  sets: number
  /** Kilos totales levantados (peso × reps de ejercicios con peso) */
  volumeKg: number
  prs: number
  cardioSessions: number
  km: number
  /** "Press banca +8 %" — el ejercicio que más mejoró en el periodo */
  topImprovement: string | null
  /** Ejercicio con más series en el periodo */
  favorite: string | null
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export const monthRange = (year: number, month0: number) => ({
  start: new Date(year, month0, 1),
  end: new Date(year, month0 + 1, 1),
  label: `${MONTHS[month0]} ${year}`,
})

export const yearRange = (year: number) => ({ start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1), label: String(year) })

const inRange = (iso: string, start: Date, end: Date) => {
  const t = new Date(iso).getTime()
  return t >= start.getTime() && t < end.getTime()
}

const ymd = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function periodSummary(state: AppState, range: { start: Date; end: Date; label: string }): PeriodSummary {
  const { start, end, label } = range
  const all = state.workouts.filter((w) => w.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  const workouts = all.filter((w) => inRange(w.startedAt, start, end))
  const cardio = state.cardio.filter((c) => inRange(c.date, start, end))
  const byId = new Map(state.exercises.map((e) => [e.id, e]))

  let sets = 0
  let volumeKg = 0
  const setsByExercise = new Map<string, number>()
  for (const w of workouts)
    for (const e of w.entries) {
      const done = e.sets.filter((s) => s.done && s.reps > 0)
      sets += done.length
      setsByExercise.set(e.exerciseId, (setsByExercise.get(e.exerciseId) ?? 0) + done.length)
      if (metricOf(byId.get(e.exerciseId)) === 'reps') for (const s of done) if (s.weight > 0) volumeKg += s.weight * s.reps
    }

  const prs = workouts.reduce((n, w) => n + prsIn(w, all.filter((x) => x.startedAt < w.startedAt), state.exercises).length, 0)

  // Mejora: mejor marca del periodo contra la mejor de antes (o la primera del periodo si es nuevo)
  let top: { ratio: number; text: string } | null = null
  for (const id of setsByExercise.keys()) {
    const ex = byId.get(id)
    if (!ex) continue
    const m = metricOf(ex)
    const before = sessionsFor(id, all.filter((w) => new Date(w.startedAt) < start))
    const during = sessionsFor(id, workouts)
    if (!during.length) continue
    const base = before.length ? Math.max(...before.map((s) => bestSet(s.sets, m).score)) : bestSet(during[0].sets, m).score
    const best = Math.max(...during.map((s) => bestSet(s.sets, m).score))
    if (base <= 0 || best <= base) continue
    const ratio = best / base
    if (!top || ratio > top.ratio) top = { ratio, text: `${ex.name} +${Math.round((ratio - 1) * 100)} %` }
  }

  const favoriteId = [...setsByExercise].sort((a, b) => b[1] - a[1])[0]?.[0]
  const days = new Set([...workouts.map((w) => ymd(w.startedAt)), ...cardio.map((c) => ymd(c.date))])

  return {
    label,
    workouts: workouts.length,
    activeDays: days.size,
    sets,
    volumeKg: Math.round(volumeKg),
    prs,
    cardioSessions: cardio.length,
    km: Math.round(cardio.reduce((n, c) => n + c.distanceKm, 0) * 10) / 10,
    topImprovement: top?.text ?? null,
    favorite: favoriteId ? byId.get(favoriteId)?.name ?? null : null,
  }
}

export const hasActivity = (s: PeriodSummary) => s.workouts > 0 || s.cardioSessions > 0

/**
 * ¿Qué resumen ofrecer en Inicio hoy?
 *  - Del 1 al 5 de cada mes: el del mes anterior.
 *  - Del 31 de diciembre al 7 de enero: el del año (diciembre → este año; enero → el anterior).
 * Devuelve una clave estable para poder descartarlo ("2026-09", "2026").
 */
export function summaryOffer(now: Date): { key: string; kind: 'month' | 'year'; year: number; month0: number } | null {
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  if (m === 11 && d === 31) return { key: String(y), kind: 'year', year: y, month0: 11 }
  if (m === 0 && d <= 7) return { key: String(y - 1), kind: 'year', year: y - 1, month0: 11 }
  if (d <= 5) {
    const prev = new Date(y, m - 1, 1)
    return { key: `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`, kind: 'month', year: prev.getFullYear(), month0: prev.getMonth() }
  }
  return null
}

export const workoutsIn = (ws: Workout[], start: Date, end: Date) => ws.filter((w) => inRange(w.startedAt, start, end))

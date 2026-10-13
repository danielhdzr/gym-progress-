import type { AppState } from '../types'
import { bestSet, sessionsFor } from './progression'
import { trainingStats } from './occasions'
import { metricOf } from './metric'

/**
 * Logros calculados a partir del historial (por eso los ya ganados aparecen desbloqueados).
 * Todo es puro: recibe el estado y devuelve qué está ganado y cuánto falta.
 */

export type AchievementGroup = 'Constancia' | 'Fuerza' | 'Cardio' | 'Especiales'

export interface AchievementResult {
  id: string
  emoji: string
  name: string
  description: string
  group: AchievementGroup
  done: boolean
  /** "7 de 10 entrenos", "Registra tu peso corporal"… */
  progress?: string
}

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const md = (s: string) => s.slice(5, 10)

/** Lunes (YYYY-MM-DD) de la semana de una fecha. */
function mondayKey(iso: string) {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

const WEEK = 7 * 24 * 60 * 60 * 1000

/** Racha más larga de semanas consecutivas con actividad. */
function longestWeekStreak(weeks: number[]) {
  const sorted = [...new Set(weeks)].sort((a, b) => a - b)
  let best = 0
  let run = 0
  sorted.forEach((w, i) => {
    // ±1 día de margen por el cambio de horario
    run = i > 0 && Math.abs(w - sorted[i - 1] - WEEK) < 2 * 3600 * 1000 ? run + 1 : 1
    best = Math.max(best, run)
  })
  return best
}

const counter = (have: number, need: number, unit: string) => ({ done: have >= need, progress: `${Math.min(have, need)} de ${need} ${unit}` })

export function evaluateAchievements(state: AppState): AchievementResult[] {
  const workouts = state.workouts.filter((w) => w.finishedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt))
  const cardio = [...state.cardio].sort((a, b) => a.date.localeCompare(b.date))
  const { settings, exercises } = state

  const gymDays = new Set(workouts.map((w) => ymd(w.startedAt)))
  const cardioDays = new Set(cardio.map((c) => ymd(c.date)))
  const activeDays = [...new Set([...gymDays, ...cardioDays])].sort()
  const activityIsos = [...workouts.map((w) => w.startedAt), ...cardio.map((c) => c.date)]

  // Días activos por semana (para "semana cumplida")
  const daysPerWeek = new Map<number, Set<string>>()
  for (const iso of activityIsos) {
    const k = mondayKey(iso)
    daysPerWeek.set(k, (daysPerWeek.get(k) ?? new Set()).add(ymd(iso)))
  }
  const cardioPerWeek = new Map<number, number>()
  for (const c of cardio) cardioPerWeek.set(mondayKey(c.date), (cardioPerWeek.get(mondayKey(c.date)) ?? 0) + 1)

  const streak = longestWeekStreak(activityIsos.map(mondayKey))
  const { prs } = trainingStats(workouts, exercises, cardio)

  const best1rm = (id: string) => {
    const ex = exercises.find((e) => e.id === id)
    if (!ex || metricOf(ex) !== 'reps') return 0
    const s = sessionsFor(id, workouts)
    return s.length ? Math.max(...s.map((x) => bestSet(x.sets).score)) : 0
  }
  const bw = [...state.bodyweight].sort((a, b) => a.date.localeCompare(b.date)).at(-1)?.kg ?? null
  const ratio = (id: string, factor: number, label: string) => {
    if (!bw) return { done: false, progress: 'Registra tu peso corporal en Progreso' }
    const have = Math.round(best1rm(id))
    const need = Math.round(bw * factor)
    return { done: have >= need, progress: `${label}: ${have} de ${need} kg (1RM estimado)` }
  }
  const club100 = Math.max(
    0,
    ...exercises.filter((e) => metricOf(e) === 'reps').map((e) => {
      const s = sessionsFor(e.id, workouts)
      return s.some((x) => x.sets.some((set) => set.weight > 0)) ? Math.max(...s.map((x) => bestSet(x.sets).score)) : 0
    }),
  )

  const longestRun = Math.max(0, ...cardio.map((c) => c.distanceKm))
  const totalKm = Math.round(cardio.reduce((n, c) => n + c.distanceKm, 0) * 10) / 10

  const hour = (iso: string) => new Date(iso).getHours()
  const anniversaryHit =
    !!settings.trainingStart && activeDays.some((d) => md(d) === md(settings.trainingStart) && d.slice(0, 4) > settings.trainingStart.slice(0, 4))
  let comeback = false
  for (let i = 1; i < activeDays.length; i++) {
    if ((new Date(activeDays[i]).getTime() - new Date(activeDays[i - 1]).getTime()) / 864e5 >= 14) comeback = true
  }

  const defs: (Omit<AchievementResult, 'done' | 'progress'> & { r: { done: boolean; progress?: string } })[] = [
    // Constancia
    { id: 'first-step', emoji: '👣', name: 'Primer paso', description: 'Tu primer entreno', group: 'Constancia', r: counter(workouts.length, 1, 'entreno') },
    {
      id: 'week-goal',
      emoji: '📅',
      name: 'Semana cumplida',
      description: 'Cumplir tu meta de días en una semana',
      group: 'Constancia',
      r: settings.weeklyGoalDays
        ? { done: [...daysPerWeek.values()].some((d) => d.size >= settings.weeklyGoalDays), progress: `Meta: ${settings.weeklyGoalDays} días en una semana` }
        : { done: false, progress: 'Define tu meta semanal en Inicio' },
    },
    { id: 'workouts-10', emoji: '🔁', name: 'Hábito en marcha', description: '10 entrenos', group: 'Constancia', r: counter(workouts.length, 10, 'entrenos') },
    { id: 'workouts-50', emoji: '🚀', name: 'Imparable', description: '50 entrenos', group: 'Constancia', r: counter(workouts.length, 50, 'entrenos') },
    { id: 'workouts-100', emoji: '👑', name: 'Leyenda', description: '100 entrenos', group: 'Constancia', r: counter(workouts.length, 100, 'entrenos') },
    { id: 'streak-4', emoji: '🔥', name: 'Racha de un mes', description: '4 semanas seguidas entrenando', group: 'Constancia', r: counter(streak, 4, 'semanas seguidas') },
    { id: 'streak-12', emoji: '💎', name: 'Racha de acero', description: '12 semanas seguidas', group: 'Constancia', r: counter(streak, 12, 'semanas seguidas') },
    { id: 'early-bird', emoji: '🌅', name: 'Madrugador', description: 'Entrenar antes de las 7:00', group: 'Constancia', r: { done: workouts.some((w) => hour(w.startedAt) < 7) } },
    { id: 'night-owl', emoji: '🌙', name: 'Búho nocturno', description: 'Entrenar después de las 21:00', group: 'Constancia', r: { done: workouts.some((w) => hour(w.startedAt) >= 21) } },
    // Fuerza
    { id: 'first-pr', emoji: '🏆', name: 'Primer récord', description: 'Tu primer récord personal', group: 'Fuerza', r: counter(prs, 1, 'récord') },
    { id: 'prs-10', emoji: '🎖️', name: 'Coleccionista', description: '10 récords personales', group: 'Fuerza', r: counter(prs, 10, 'récords') },
    { id: 'bench-bw', emoji: '⚖️', name: 'Tu propio peso', description: 'Press banca igual a tu peso corporal', group: 'Fuerza', r: ratio('bench', 1, 'Banca') },
    { id: 'squat-15', emoji: '🦵', name: 'Piernas de acero', description: 'Sentadilla de 1.5 veces tu peso corporal', group: 'Fuerza', r: ratio('squat', 1.5, 'Sentadilla') },
    { id: 'deadlift-2', emoji: '🏋️', name: 'Doble peso', description: 'Peso muerto de 2 veces tu peso corporal', group: 'Fuerza', r: ratio('deadlift', 2, 'Peso muerto') },
    { id: 'club-100', emoji: '💯', name: 'Club de los 100', description: 'Cualquier ejercicio con 1RM estimado de 100 kg', group: 'Fuerza', r: { done: club100 >= 100, progress: `Tu mejor: ${Math.round(club100)} kg` } },
    // Cardio
    { id: 'run-5k', emoji: '🏃', name: 'Primeros 5 km', description: '5 km en una sola salida', group: 'Cardio', r: { done: longestRun >= 5, progress: `Tu salida más larga: ${longestRun} km` } },
    { id: 'run-10k', emoji: '🗺️', name: 'Doble dígito', description: '10 km en una sola salida', group: 'Cardio', r: { done: longestRun >= 10, progress: `Tu salida más larga: ${longestRun} km` } },
    { id: 'km-100', emoji: '🌎', name: 'Centenario', description: '100 km acumulados', group: 'Cardio', r: { done: totalKm >= 100, progress: `${Math.min(totalKm, 100)} de 100 km` } },
    { id: 'cardio-week', emoji: '⏱️', name: 'Semana activa', description: '3 salidas de cardio en una semana', group: 'Cardio', r: { done: [...cardioPerWeek.values()].some((n) => n >= 3) } },
    // Especiales
    {
      id: 'birthday',
      emoji: '🎂',
      name: 'Cumpleañero fit',
      description: 'Entrenar el día de tu cumpleaños',
      group: 'Especiales',
      r: settings.birthday ? { done: activeDays.some((d) => md(d) === md(settings.birthday)) } : { done: false, progress: 'Agrega tu cumpleaños en Ajustes → Perfil' },
    },
    { id: 'new-year', emoji: '🎆', name: 'Año nuevo, vida nueva', description: 'Entrenar un 1 de enero', group: 'Especiales', r: { done: activeDays.some((d) => md(d) === '01-01') } },
    {
      id: 'anniversary',
      emoji: '🏆',
      name: 'Aniversario',
      description: 'Entrenar en tu aniversario de entrenamiento',
      group: 'Especiales',
      r: settings.trainingStart ? { done: anniversaryHit } : { done: false, progress: 'Agrega cuándo empezaste en Ajustes → Perfil' },
    },
    { id: 'all-terrain', emoji: '⚡', name: 'Todo terreno', description: 'Pesas y cardio el mismo día', group: 'Especiales', r: { done: [...gymDays].some((d) => cardioDays.has(d)) } },
    { id: 'comeback', emoji: '🔄', name: 'Nunca te rindes', description: 'Volver a entrenar tras 2 semanas o más sin hacerlo', group: 'Especiales', r: { done: comeback } },
  ]

  return defs.map(({ r, ...d }) => ({ ...d, done: r.done, progress: r.done ? undefined : r.progress }))
}

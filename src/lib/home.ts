import type { CardioSession, Exercise, Routine, Workout } from '../types'
import { sessionsFor, suggest } from './progression'
import { fmtAmount, metricOf } from './metric'

/** La rutina que sigue: la siguiente a la última que hiciste, en el orden de tu lista (vuelve al inicio). */
export function nextRoutine(routines: Routine[], workouts: Workout[]): Routine | null {
  const usable = routines.filter((r) => r.items.length)
  if (!usable.length) return null
  const last = workouts
    .filter((w) => w.finishedAt && w.routineId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .find((w) => usable.some((r) => r.id === w.routineId))
  if (!last) return usable[0]
  const i = usable.findIndex((r) => r.id === last.routineId)
  return usable[(i + 1) % usable.length]
}

/** Minutos estimados: cada serie ~40 s de trabajo + el descanso; redondeado a 5 min. */
export function estimateMinutes(routine: Routine, restSeconds: number) {
  const sets = routine.items.reduce((n, i) => n + i.sets, 0)
  return Math.max(5, Math.round((sets * (40 + restSeconds)) / 60 / 5) * 5)
}

/** Adelanto de la sugerencia del primer ejercicio: "Press banca: sube a 62.5 kg". */
export function routinePreview(routine: Routine, exercises: Exercise[], workouts: Workout[]): string | null {
  const item = routine.items[0]
  const ex = exercises.find((e) => e.id === item?.exerciseId)
  if (!ex) return null
  const tip = suggest(ex, sessionsFor(ex.id, workouts), item.sets)
  const amount = fmtAmount(tip.reps, metricOf(ex))
  switch (tip.kind) {
    case 'new':
      return `${ex.name}: primera vez`
    case 'up':
      return `${ex.name}: sube a ${tip.weight} kg`
    case 'deload':
      return `${ex.name}: baja a ${tip.weight} kg para recuperar`
    default:
      return tip.weight ? `${ex.name}: ${tip.weight} kg × ${amount}` : `${ex.name}: busca ${amount}`
  }
}

const DAY = 24 * 60 * 60 * 1000

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Lunes 00:00 local de la semana de `d`. */
export function mondayOf(d: Date) {
  const x = startOfDay(d)
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7))
  return x
}

const ymd = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

export interface WeekDay {
  date: Date
  /** "L", "M", "M", "J", "V", "S", "D" */
  letter: string
  gym: boolean
  cardio: boolean
  today: boolean
  future: boolean
}

/** Los 7 días de la semana actual (lunes a domingo) con lo que entrenaste cada día. */
export function weekDays(workouts: Workout[], cardio: CardioSession[], now = new Date()): WeekDay[] {
  const gym = new Set(workouts.filter((w) => w.finishedAt).map((w) => ymd(new Date(w.startedAt))))
  const run = new Set(cardio.map((s) => ymd(new Date(s.date))))
  const monday = mondayOf(now)
  const today = ymd(now)
  return 'LMMJVSD'.split('').map((letter, i) => {
    const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)
    const key = ymd(date)
    return { date, letter, gym: gym.has(key), cardio: run.has(key), today: key === today, future: date > now && key !== today }
  })
}

/** Semanas consecutivas con al menos un entreno (pesas o cardio), contando desde esta o la anterior. */
export function activityStreak(workouts: Workout[], cardio: CardioSession[], now = new Date()): number {
  const weeks = new Set(
    [...workouts.filter((w) => w.finishedAt).map((w) => w.startedAt), ...cardio.map((s) => s.date)].map((iso) =>
      mondayOf(new Date(iso)).getTime(),
    ),
  )
  let cursor = mondayOf(now)
  if (!weeks.has(cursor.getTime())) cursor = mondayOf(new Date(cursor.getTime() - DAY))
  let streak = 0
  while (weeks.has(cursor.getTime())) {
    streak++
    cursor = mondayOf(new Date(cursor.getTime() - DAY))
  }
  return streak
}

/** Línea de datos del encabezado: "Sábado 10 de oct · 3 semanas seguidas 🔥" */
export function dataLine(workouts: Workout[], cardio: CardioSession[], now = new Date()) {
  const date = now.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'short' }).replace('.', '')
  const day = date.charAt(0).toUpperCase() + date.slice(1).replace(',', '')
  const streak = activityStreak(workouts, cardio, now)
  if (streak >= 2) return `${day} · ${streak} semanas seguidas 🔥`
  if (!workouts.length && !cardio.length) return `${day} · ¡Empecemos!`
  return day
}

/** Mensaje de la meta semanal de días activos. */
export function weekGoalMessage(activeDays: number, goal: number) {
  if (goal <= 0) return null
  if (activeDays >= goal) return activeDays > goal ? '¡Superaste tu meta de la semana! 🎉' : '¡Meta semanal cumplida! 🎉'
  const left = goal - activeDays
  return `Te ${left === 1 ? 'falta 1 día' : `faltan ${left} días`} para tu meta de ${goal}`
}

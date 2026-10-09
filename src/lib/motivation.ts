import type { Workout } from '../types'

/**
 * Mensajes de ánimo basados en los datos reales del usuario (racha, constancia, récords).
 * Todo es determinista (sin Math.random) para que el mensaje no cambie en cada render
 * y se pueda probar: la variedad sale del día del año.
 */

const DAY = 24 * 60 * 60 * 1000

/** Inicio de la semana (lunes 00:00 local). */
function weekStart(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return d.getTime()
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** Elige un elemento estable para el día. */
const pick = <T,>(list: T[], now: Date) => list[Math.floor(now.getTime() / DAY) % list.length]

/** ", Daniel" o "" si no hay nombre. */
const withName = (name: string) => (name.trim() ? `, ${name.trim()}` : '')

export function greeting(name: string, now = new Date()) {
  const h = now.getHours()
  const base = h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches'
  return `${base}${withName(name)} 👋`
}

export interface Consistency {
  /** Entrenos terminados esta semana (desde el lunes) */
  thisWeek: number
  /** Semanas consecutivas (hasta la actual o la anterior) con al menos un entreno */
  weekStreak: number
  /** Días desde el último entreno, o null si no hay ninguno */
  daysSinceLast: number | null
  trainedToday: boolean
  total: number
}

export function consistency(workouts: Workout[], now = new Date()): Consistency {
  const done = workouts.filter((w) => w.finishedAt).map((w) => new Date(w.startedAt))
  const currentWeek = weekStart(now)
  const weeks = new Set(done.map((d) => weekStart(d)))

  // La racha cuenta desde esta semana; si aún no entrenas esta semana, desde la anterior
  let cursor = weeks.has(currentWeek) ? currentWeek : weekStart(new Date(currentWeek - DAY))
  let weekStreak = 0
  while (weeks.has(cursor)) {
    weekStreak++
    cursor = weekStart(new Date(cursor - DAY))
  }

  const last = done.length ? new Date(Math.max(...done.map((d) => d.getTime()))) : null
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)

  return {
    thisWeek: done.filter((d) => weekStart(d) === currentWeek).length,
    weekStreak,
    daysSinceLast: last ? Math.max(0, Math.round((startOfToday.getTime() - new Date(last).setHours(0, 0, 0, 0)) / DAY)) : null,
    trainedToday: done.some((d) => sameDay(d, now)),
    total: done.length,
  }
}

/** Frase de la pantalla de inicio según cómo vas. */
export function homeMessage(name: string, workouts: Workout[], now = new Date()): string {
  const n = withName(name)
  const c = consistency(workouts, now)

  if (c.total === 0) return `Hoy empieza tu progreso${n}. El primer entreno es el más importante.`
  if (c.trainedToday) return `Ya entrenaste hoy. ¡Bien hecho${n}! Descansa y come bien: ahí también se crece.`
  if (c.daysSinceLast !== null && c.daysSinceLast >= 7)
    return `¡Qué bueno verte de vuelta${n}! Retomar es lo más difícil y ya lo estás haciendo.`
  if (c.weekStreak >= 4) return `🔥 ${c.weekStreak} semanas seguidas entrenando. ¡Esa constancia se nota${n}!`
  if (c.thisWeek >= 3) return `Llevas ${c.thisWeek} entrenos esta semana. ¡Vas con todo${n}!`
  if (c.weekStreak >= 2) return `${c.weekStreak} semanas seguidas sin fallar. ¡Sigue así${n}!`

  return pick(
    [
      `La constancia le gana a la intensidad. ¡Vamos${n}!`,
      `Cada serie cuenta${n}. Hoy un poco mejor que la vez pasada.`,
      `No tiene que ser perfecto, solo tiene que pasar. ¡A darle${n}!`,
      `Tu yo del futuro te lo va a agradecer${n}.`,
      `Una rep más que la última vez: así se progresa${n}.`,
    ],
    now,
  )
}

const MILESTONES: Record<number, string> = {
  1: '🎉 ¡Tu primer entreno registrado!',
  5: '5 entrenos registrados. Ya es un hábito en construcción.',
  10: '🏅 ¡10 entrenos! Ya superaste a la mayoría que lo deja en la primera semana.',
  25: '🏅 25 entrenos. Esto ya es parte de tu vida.',
  50: '🏆 ¡50 entrenos! Medio centenar de días eligiendo mejorar.',
  100: '🏆 ¡100 entrenos! Nivel leyenda.',
}

/** Título y subtítulo del resumen al terminar un entreno. */
export function finishMessage(name: string, prCount: number, totalWorkouts: number, now = new Date()) {
  const n = withName(name)
  const title =
    prCount > 1
      ? `¡${prCount} récords nuevos${n}! 🏆`
      : prCount === 1
        ? `¡Nuevo récord${n}! 🏆`
        : totalWorkouts <= 1
          ? `¡Excelente trabajo${n}! 💪`
          : pick([`¡Excelente trabajo${n}! 💪`, `¡Entreno completado${n}! 💪`, `¡Otro día más${n}! 💪`], now)

  const subtitle =
    MILESTONES[totalWorkouts] ??
    (prCount > 0
      ? 'Esto es progreso real. Lo que mides, mejora.'
      : pick(
          [
            'Sin récords hoy, pero cada entreno suma. La constancia es lo que cuenta.',
            'Los días normales son los que construyen los días de récord.',
            'Presentarte ya es ganar. ¡Nos vemos en el próximo!',
          ],
          now,
        ))

  return { title, subtitle }
}

import type { Exercise, SetLog, Workout } from '../types'

/** 1RM estimado con la fórmula de Epley. Para ejercicios sin peso usamos las reps. */
export function e1rm(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (weight <= 0) return reps
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

export interface Session {
  workoutId: string
  date: string
  sets: SetLog[]
  note?: string
}

/** Sesiones terminadas de un ejercicio, de la más antigua a la más reciente (solo series completadas). */
export function sessionsFor(exerciseId: string, workouts: Workout[]): Session[] {
  const sessions: Session[] = []
  for (const w of workouts) {
    if (!w.finishedAt) continue
    for (const entry of w.entries) {
      if (entry.exerciseId !== exerciseId) continue
      const sets = entry.sets.filter((s) => s.done && s.reps > 0)
      if (sets.length) sessions.push({ workoutId: w.id, date: w.startedAt, sets, note: entry.note })
    }
  }
  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

export function bestSet(sets: SetLog[]): { weight: number; reps: number; e1rm: number } {
  let best = { weight: 0, reps: 0, e1rm: 0 }
  for (const s of sets) {
    const v = e1rm(s.weight, s.reps)
    if (v > best.e1rm) best = { weight: s.weight, reps: s.reps, e1rm: v }
  }
  return best
}

export const isBodyweight = (sessions: Session[]) =>
  sessions.every((s) => s.sets.every((set) => set.weight <= 0))

export type SuggestionKind = 'new' | 'up' | 'reps' | 'deload'

export interface Suggestion {
  kind: SuggestionKind
  weight: number
  reps: number
  text: string
}

const roundTo = (value: number, step: number) =>
  step > 0 ? Math.round(value / step) * step : value

/** Peso de trabajo de una sesión: el más alto usado, y las series hechas con él. */
function topSets(session: Session) {
  const weight = Math.max(...session.sets.map((s) => s.weight))
  return { weight, sets: session.sets.filter((s) => s.weight === weight) }
}

/**
 * Doble progresión:
 *  1. Con el mismo peso, sube reps hasta llegar al tope del rango en todas las series.
 *  2. Cuando lo logras, sube el peso y regresa al mínimo del rango.
 *  3. Si dos sesiones seguidas no llegas al mínimo, baja ~10% (deload).
 * Con RPE registrado se ajusta: al fallo (RPE 10) no sube aunque completes el rango,
 * y si todo se sintió fácil (RPE ≤ 7) busca +2 reps en vez de +1.
 */
export function suggest(ex: Exercise, sessions: Session[], plannedSets: number): Suggestion {
  const last = sessions.at(-1)
  if (!last) {
    return {
      kind: 'new',
      weight: 0,
      reps: ex.repMin,
      text: `Primera vez: elige un peso con el que hagas ${ex.repMin}–${ex.repMax} reps con buena técnica.`,
    }
  }

  const top = topSets(last)
  const minReps = Math.min(...top.sets.map((s) => s.reps))
  const rpes = top.sets.map((s) => s.rpe).filter((r): r is number => !!r)
  const allRated = rpes.length === top.sets.length
  const maxRpe = rpes.length ? Math.max(...rpes) : 0

  if (top.weight <= 0) {
    const target = minReps + 1
    return {
      kind: 'reps',
      weight: 0,
      reps: target,
      text:
        minReps >= ex.repMax
          ? `Dominas el rango: agrega lastre (+${ex.increment} kg) o busca ${target} reps.`
          : `Busca ${target} reps por serie (la última vez: ${minReps}).`,
    }
  }

  const prev = sessions.at(-2)
  if (prev && minReps < ex.repMin) {
    const prevTop = topSets(prev)
    const prevMin = Math.min(...prevTop.sets.map((s) => s.reps))
    if (prevTop.weight === top.weight && prevMin < ex.repMin) {
      const weight = roundTo(top.weight * 0.9, ex.increment)
      return {
        kind: 'deload',
        weight,
        reps: ex.repMax,
        text: `Dos sesiones sin llegar a ${ex.repMin} reps con ${top.weight} kg. Baja a ${weight} kg y reconstruye.`,
      }
    }
  }

  const completedAll = top.sets.length >= plannedSets && minReps >= ex.repMax
  if (completedAll && maxRpe >= 10) {
    return {
      kind: 'reps',
      weight: top.weight,
      reps: ex.repMax,
      text: `Llegaste a ${ex.repMax} reps pero al fallo (RPE 10). Repite ${top.weight} kg hasta sentirlo en RPE 8–9 y luego sube.`,
    }
  }
  if (completedAll) {
    const weight = top.weight + ex.increment
    return {
      kind: 'up',
      weight,
      reps: ex.repMin,
      text: `¡Completaste ${ex.repMax} reps en todas las series! Sube a ${weight} kg × ${ex.repMin}.`,
    }
  }

  const easy = allRated && maxRpe <= 7
  const target = Math.min(Math.max(minReps + (easy ? 2 : 1), ex.repMin), ex.repMax)
  if (easy) {
    return {
      kind: 'reps',
      weight: top.weight,
      reps: target,
      text: `Se sintió fácil (RPE ≤ 7): mantén ${top.weight} kg y busca ${target} reps por serie.`,
    }
  }
  return {
    kind: 'reps',
    weight: top.weight,
    reps: target,
    text: `Mantén ${top.weight} kg y busca ${target} reps por serie (meta: ${ex.repMax}).`,
  }
}

/** Estancado: las últimas 3 sesiones no superaron el mejor 1RM estimado anterior. */
export function isStalled(sessions: Session[]): boolean {
  if (sessions.length < 4) return false
  const before = sessions.slice(0, -3)
  const recent = sessions.slice(-3)
  const bestBefore = Math.max(...before.map((s) => bestSet(s.sets).e1rm))
  const bestRecent = Math.max(...recent.map((s) => bestSet(s.sets).e1rm))
  return bestRecent <= bestBefore
}

/** Récords personales logrados en un entreno respecto a todo lo anterior. */
export function prsIn(workout: Workout, previous: Workout[]): string[] {
  const prs: string[] = []
  for (const entry of workout.entries) {
    const done = entry.sets.filter((s) => s.done && s.reps > 0)
    if (!done.length) continue
    const now = bestSet(done).e1rm
    const before = sessionsFor(entry.exerciseId, previous)
    if (!before.length) continue
    const prevBest = Math.max(...before.map((s) => bestSet(s.sets).e1rm))
    if (now > prevBest) prs.push(entry.exerciseId)
  }
  return prs
}

/** Series efectivas por grupo muscular en los últimos `days` días. */
export function weeklySets(
  workouts: Workout[],
  exercises: Exercise[],
  days = 7,
  now = Date.now(),
): Record<string, number> {
  const since = now - days * 24 * 60 * 60 * 1000
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const counts: Record<string, number> = {}
  for (const w of workouts) {
    if (!w.finishedAt || new Date(w.startedAt).getTime() < since) continue
    for (const entry of w.entries) {
      const muscle = byId.get(entry.exerciseId)?.muscle
      if (!muscle) continue
      counts[muscle] = (counts[muscle] ?? 0) + entry.sets.filter((s) => s.done).length
    }
  }
  return counts
}

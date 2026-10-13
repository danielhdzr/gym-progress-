import type { Exercise, ItemGoal, Metric, Readiness, SetLog, Target, Workout } from '../types'
import { fmtAmount, fmtRange, metricOf, stepFor } from './metric'

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

/**
 * Sesiones terminadas de un ejercicio, de la más antigua a la más reciente (solo series completadas).
 * Con `goal`, solo las hechas con ese objetivo (las anteriores a los objetivos cuentan como hipertrofia).
 */
export function sessionsFor(exerciseId: string, workouts: Workout[], goal?: ItemGoal): Session[] {
  const sessions: Session[] = []
  for (const w of workouts) {
    if (!w.finishedAt) continue
    for (const entry of w.entries) {
      if (entry.exerciseId !== exerciseId) continue
      if (goal && (entry.target?.goal ?? 'hypertrophy') !== goal) continue
      const sets = entry.sets.filter((s) => s.done && s.reps > 0)
      if (sets.length) sessions.push({ workoutId: w.id, date: w.startedAt, sets, note: entry.note })
    }
  }
  return sessions.sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Número comparable entre series para gráficas, récords y estancamiento.
 * Reps: 1RM estimado. Tiempo/distancia: carga × cantidad (kg·s, kg·m), o solo la cantidad sin peso.
 */
export function setScore(weight: number, amount: number, metric: Metric = 'reps'): number {
  if (metric === 'reps') return e1rm(weight, amount)
  if (amount <= 0) return 0
  return weight > 0 ? weight * amount : amount
}

export function bestSet(sets: SetLog[], metric: Metric = 'reps'): { weight: number; reps: number; score: number } {
  let best = { weight: 0, reps: 0, score: 0 }
  for (const s of sets) {
    const v = setScore(s.weight, s.reps, metric)
    if (v > best.score) best = { weight: s.weight, reps: s.reps, score: v }
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
 * y si todo se sintió fácil (RPE ≤ 7) busca el doble de avance.
 * En ejercicios por tiempo o distancia el avance es de 5 s / 5 m en lugar de 1 rep.
 */
export function suggest(ex: Exercise, sessions: Session[], plannedSets: number): Suggestion {
  const metric = metricOf(ex)
  const step = stepFor(metric)
  const A = (n: number) => fmtAmount(n, metric)
  const last = sessions.at(-1)
  if (!last) {
    return {
      kind: 'new',
      weight: 0,
      reps: ex.repMin,
      text:
        metric === 'reps'
          ? `Primera vez: elige un peso con el que hagas ${fmtRange(ex.repMin, ex.repMax, metric)} con buena técnica.`
          : `Primera vez: anota el peso (si usas) y busca ${fmtRange(ex.repMin, ex.repMax, metric)} por serie.`,
    }
  }

  const top = topSets(last)
  const minReps = Math.min(...top.sets.map((s) => s.reps))
  const rpes = top.sets.map((s) => s.rpe).filter((r): r is number => !!r)
  const allRated = rpes.length === top.sets.length
  const maxRpe = rpes.length ? Math.max(...rpes) : 0

  if (top.weight <= 0) {
    const target = minReps + step
    return {
      kind: 'reps',
      weight: 0,
      reps: target,
      text:
        minReps >= ex.repMax
          ? ex.increment > 0
            ? `Dominas el rango: agrega peso (+${ex.increment} kg) o busca ${A(target)}.`
            : `Dominas el rango: pasa a una variante más difícil (o baja la asistencia) o busca ${A(target)}.`
          : `Busca ${A(target)} por serie (la última vez: ${A(minReps)}).`,
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
        text: `Dos sesiones sin llegar a ${A(ex.repMin)} con ${top.weight} kg. Baja a ${weight} kg y reconstruye.`,
      }
    }
  }

  const completedAll = top.sets.length >= plannedSets && minReps >= ex.repMax
  if (completedAll && maxRpe >= 10) {
    return {
      kind: 'reps',
      weight: top.weight,
      reps: ex.repMax,
      text: `Llegaste a ${A(ex.repMax)} pero al fallo (RPE 10). Repite ${top.weight} kg hasta sentirlo en RPE 8–9 y luego sube.`,
    }
  }
  if (completedAll) {
    const weight = top.weight + ex.increment
    return {
      kind: 'up',
      weight,
      reps: ex.repMin,
      text: `¡Completaste ${A(ex.repMax)} en todas las series! Sube a ${weight} kg × ${A(ex.repMin)}.`,
    }
  }

  const easy = allRated && maxRpe <= 7
  const target = Math.min(Math.max(minReps + (easy ? 2 : 1) * step, ex.repMin), ex.repMax)
  if (easy) {
    return {
      kind: 'reps',
      weight: top.weight,
      reps: target,
      text: `Se sintió fácil (RPE ≤ 7): mantén ${top.weight} kg y busca ${A(target)} por serie.`,
    }
  }
  return {
    kind: 'reps',
    weight: top.weight,
    reps: target,
    text: `Mantén ${top.weight} kg y busca ${A(target)} por serie (meta: ${A(ex.repMax)}).`,
  }
}

/**
 * Sugerencia para un ejercicio con su objetivo (fuerza/hipertrofia) dentro de una rutina.
 * Si nunca lo hiciste con ese objetivo pero sí con otro, estima el peso desde tu mejor 1RM
 * (al 90 % del peso teórico para esas reps, para empezar con margen).
 */
export function suggestFor(
  ex: Exercise,
  target: Target | undefined,
  workouts: Workout[],
  plannedSets: number,
  readiness?: Readiness,
): Suggestion {
  return adjustForReadiness(baseSuggestFor(ex, target, workouts, plannedSets), readiness, ex, target)
}

/**
 * Ajuste por "¿Cómo llegas hoy?":
 *  - Cansado: no sube el peso (si tocaba subir, repite el anterior al tope del rango).
 *  - Día ligero: −10 % de peso.
 *  (Quitar una serie se hace al crear el entreno.)
 */
export function adjustForReadiness(tip: Suggestion, readiness: Readiness | undefined, ex: Exercise, target?: Target): Suggestion {
  const A = (n: number) => fmtAmount(n, metricOf(ex))
  if (readiness === 'tired') {
    if (tip.kind === 'up') {
      const weight = Math.max(0, tip.weight - ex.increment)
      const reps = target?.repMax ?? ex.repMax
      return { kind: 'reps', weight, reps, text: `Hoy llegas cansado: repite ${weight} kg × ${A(reps)}, sin subir. Subes la próxima vez.` }
    }
    return { ...tip, text: `Hoy llegas cansado: no fuerces. ${tip.text}` }
  }
  if (readiness === 'light' && tip.weight > 0) {
    const weight = Math.max(ex.increment || 0, roundTo(tip.weight * 0.9, ex.increment || 2.5))
    return { ...tip, weight, text: `Día ligero: ${weight} kg × ${A(tip.reps)} (−10 %) para moverte sin desgaste.` }
  }
  return tip
}

function baseSuggestFor(ex: Exercise, target: Target | undefined, workouts: Workout[], plannedSets: number): Suggestion {
  const eff = target ? { ...ex, repMin: target.repMin, repMax: target.repMax } : ex
  const tip = suggest(eff, sessionsFor(ex.id, workouts, target?.goal), plannedSets)
  if (tip.kind !== 'new' || !target || metricOf(ex) !== 'reps') return tip
  const all = sessionsFor(ex.id, workouts)
  const best = all.length ? Math.max(...all.map((s) => bestSet(s.sets).score)) : 0
  const weighted = all.some((s) => s.sets.some((x) => x.weight > 0))
  if (!best || !weighted) return tip
  const weight = Math.max(ex.increment, roundTo((best / (1 + target.repMin / 30)) * 0.9, ex.increment || 2.5))
  return {
    kind: 'new',
    weight,
    reps: target.repMin,
    text: `Estimado con tu 1RM (~${Math.round(best)} kg): empieza con ${weight} kg × ${fmtAmount(target.repMin, 'reps')}.`,
  }
}

/** Estancado: las últimas 3 sesiones no superaron la mejor marca anterior. */
export function isStalled(sessions: Session[], metric: Metric = 'reps'): boolean {
  if (sessions.length < 4) return false
  const before = sessions.slice(0, -3)
  const recent = sessions.slice(-3)
  const bestBefore = Math.max(...before.map((s) => bestSet(s.sets, metric).score))
  const bestRecent = Math.max(...recent.map((s) => bestSet(s.sets, metric).score))
  return bestRecent <= bestBefore
}

/** Récords personales logrados en un entreno respecto a todo lo anterior. */
export function prsIn(workout: Workout, previous: Workout[], exercises: Exercise[] = []): string[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const prs: string[] = []
  for (const entry of workout.entries) {
    const done = entry.sets.filter((s) => s.done && s.reps > 0)
    if (!done.length) continue
    const metric = metricOf(byId.get(entry.exerciseId))
    const now = bestSet(done, metric).score
    const before = sessionsFor(entry.exerciseId, previous)
    if (!before.length) continue
    const prevBest = Math.max(...before.map((s) => bestSet(s.sets, metric).score))
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

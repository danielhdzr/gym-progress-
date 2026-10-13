import type { Exercise, ExerciseLog, Readiness, Routine, SetLog, Target, Workout } from '../types'
import { prsIn, suggestFor } from './progression'
import { defaultTarget } from './goals'
import { metricOf } from './metric'
import { uid } from './store'

/** Entrenos terminados anteriores a `w` (sin incluirlo): base para sugerencias y récords de entrenos pasados. */
export function historyBefore(workouts: Workout[], w: Pick<Workout, 'id' | 'startedAt'>): Workout[] {
  return workouts.filter((x) => x.id !== w.id && x.startedAt < w.startedAt)
}

/**
 * Crea las series de un ejercicio precargadas con la sugerencia de progresión.
 * `weightOnly` deja las reps vacías: al registrar un entreno pasado solo se guardan
 * las series que el usuario llenó, así que no se deben inventar reps.
 */
export function newEntry(ex: Exercise, history: Workout[], sets: number, weightOnly = false, target?: Target, readiness?: Readiness): ExerciseLog {
  const tip = suggestFor(ex, target, history, sets, readiness)
  return {
    exerciseId: ex.id,
    sets: Array.from({ length: sets }, () => ({ weight: tip.weight, reps: weightOnly ? 0 : tip.reps, done: false })),
    ...(target ? { target } : {}),
  }
}

export function startWorkout(
  routine: Routine | null,
  exercises: Exercise[],
  history: Workout[],
  startedAt = new Date().toISOString(),
  weightOnly = false,
  readiness?: Readiness,
): Workout {
  // Cansado o día ligero: una serie menos por ejercicio
  const fewer = readiness === 'tired' || readiness === 'light'
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const before = historyBefore(history, { id: '', startedAt })
  return {
    id: uid(),
    name: routine?.name ?? 'Entreno libre',
    routineId: routine?.id,
    startedAt,
    ...(readiness ? { readiness } : {}),
    entries: (routine?.items ?? []).flatMap((item) => {
      const ex = byId.get(item.exerciseId)
      const sets = fewer ? Math.max(1, item.sets - 1) : item.sets
      return ex ? [newEntry(ex, before, sets, weightOnly, item.target, readiness)] : []
    }),
  }
}

const cleanEntries = (entries: ExerciseLog[], isDone: (s: SetLog) => boolean) =>
  entries
    .map((e) => ({ ...e, note: e.note?.trim() || undefined, sets: e.sets.filter((s) => isDone(s) && s.reps > 0) }))
    .filter((e) => e.sets.length)

/** Cierra el entreno en vivo: se queda solo con series marcadas y calcula los récords. */
export function finishWorkout(active: Workout, history: Workout[], exercises: Exercise[] = []) {
  const workout: Workout = {
    ...active,
    finishedAt: new Date().toISOString(),
    entries: cleanEntries(active.entries, (s) => s.done),
  }
  return { workout, prs: prsIn(workout, historyBefore(history, workout), exercises) }
}

/**
 * Guarda un entreno registrado a posteriori (pasado o editado): toda serie con reps cuenta como hecha,
 * y los récords se comparan solo contra lo que había antes de esa fecha.
 */
export function saveLoggedWorkout(draft: Workout, durationMin: number, history: Workout[], exercises: Exercise[] = []) {
  const workout: Workout = {
    ...draft,
    finishedAt: new Date(new Date(draft.startedAt).getTime() + Math.max(0, durationMin) * 60000).toISOString(),
    entries: cleanEntries(draft.entries, () => true).map((e) => ({
      ...e,
      sets: e.sets.map((s) => ({ ...s, done: true })),
    })),
  }
  return { workout, prs: prsIn(workout, historyBefore(history, workout), exercises) }
}

/* Operaciones sobre las series, compartidas por el entreno en vivo y el editor. */

export const patchSet = (entries: ExerciseLog[], ei: number, si: number, patch: Partial<SetLog>) =>
  entries.map((e, i) => (i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) }))

export const addSet = (entries: ExerciseLog[], ei: number) =>
  entries.map((e, i) => {
    if (i !== ei) return e
    const last = e.sets.at(-1) ?? { weight: 0, reps: 0, done: false }
    return { ...e, sets: [...e.sets, { weight: last.weight, reps: last.reps, done: false }] }
  })

export const removeLastSet = (entries: ExerciseLog[], ei: number) =>
  entries.map((e, i) => (i === ei ? { ...e, sets: e.sets.slice(0, -1) } : e))

export const removeEntry = (entries: ExerciseLog[], ei: number) => entries.filter((_, i) => i !== ei)

export const setNote = (entries: ExerciseLog[], ei: number, note: string) =>
  entries.map((e, i) => (i === ei ? { ...e, note } : e))

/**
 * Objetivo al sustituir un ejercicio: en fuerza (con reps) se conserva el esquema (ej. 5×5);
 * en hipertrofia se usa el rango propio del nuevo ejercicio (laterales 12–20, plancha en segundos…).
 * El descanso se conserva.
 */
export function targetForSwap(old: Target | undefined, alt: Exercise): Target | undefined {
  if (!old) return undefined
  if (old.goal === 'strength' && metricOf(alt) === 'reps') return old
  return { ...defaultTarget('hypertrophy', undefined, alt), restSeconds: old.restSeconds }
}

/** Sustituye el ejercicio `ei` por `alt`, con sus series precargadas según su propio historial. */
export function swapEntry(entries: ExerciseLog[], ei: number, alt: Exercise, history: Workout[], readiness?: Readiness): ExerciseLog[] {
  const old = entries[ei]
  const target = targetForSwap(old.target, alt)
  const fresh = newEntry(alt, history, Math.max(1, old.sets.length), false, target, readiness)
  return entries.map((e, i) => (i === ei ? { ...fresh, note: old.note } : e))
}

/** Sustituye también en la rutina (todas las apariciones del ejercicio). */
export function swapInRoutine(routine: Routine, oldId: string, alt: Exercise): Routine {
  return {
    ...routine,
    items: routine.items.map((i) => (i.exerciseId === oldId ? { ...i, exerciseId: alt.id, target: targetForSwap(i.target, alt) } : i)),
  }
}

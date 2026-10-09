import type { Exercise, ExerciseLog, Routine, SetLog, Workout } from '../types'
import { prsIn, sessionsFor, suggest } from './progression'
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
export function newEntry(ex: Exercise, history: Workout[], sets: number, weightOnly = false): ExerciseLog {
  const tip = suggest(ex, sessionsFor(ex.id, history), sets)
  return {
    exerciseId: ex.id,
    sets: Array.from({ length: sets }, () => ({ weight: tip.weight, reps: weightOnly ? 0 : tip.reps, done: false })),
  }
}

export function startWorkout(
  routine: Routine | null,
  exercises: Exercise[],
  history: Workout[],
  startedAt = new Date().toISOString(),
  weightOnly = false,
): Workout {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  const before = historyBefore(history, { id: '', startedAt })
  return {
    id: uid(),
    name: routine?.name ?? 'Entreno libre',
    routineId: routine?.id,
    startedAt,
    entries: (routine?.items ?? []).flatMap((item) => {
      const ex = byId.get(item.exerciseId)
      return ex ? [newEntry(ex, before, item.sets, weightOnly)] : []
    }),
  }
}

const cleanEntries = (entries: ExerciseLog[], isDone: (s: SetLog) => boolean) =>
  entries
    .map((e) => ({ ...e, note: e.note?.trim() || undefined, sets: e.sets.filter((s) => isDone(s) && s.reps > 0) }))
    .filter((e) => e.sets.length)

/** Cierra el entreno en vivo: se queda solo con series marcadas y calcula los récords. */
export function finishWorkout(active: Workout, history: Workout[]) {
  const workout: Workout = {
    ...active,
    finishedAt: new Date().toISOString(),
    entries: cleanEntries(active.entries, (s) => s.done),
  }
  return { workout, prs: prsIn(workout, historyBefore(history, workout)) }
}

/**
 * Guarda un entreno registrado a posteriori (pasado o editado): toda serie con reps cuenta como hecha,
 * y los récords se comparan solo contra lo que había antes de esa fecha.
 */
export function saveLoggedWorkout(draft: Workout, durationMin: number, history: Workout[]) {
  const workout: Workout = {
    ...draft,
    finishedAt: new Date(new Date(draft.startedAt).getTime() + Math.max(0, durationMin) * 60000).toISOString(),
    entries: cleanEntries(draft.entries, () => true).map((e) => ({
      ...e,
      sets: e.sets.map((s) => ({ ...s, done: true })),
    })),
  }
  return { workout, prs: prsIn(workout, historyBefore(history, workout)) }
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

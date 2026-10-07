import type { Exercise, ExerciseLog, Routine, Workout } from '../types'
import { prsIn, sessionsFor, suggest } from './progression'
import { uid } from './store'

/** Crea las series de un ejercicio ya precargadas con la sugerencia de progresión. */
export function newEntry(ex: Exercise, history: Workout[], sets: number): ExerciseLog {
  const tip = suggest(ex, sessionsFor(ex.id, history), sets)
  return {
    exerciseId: ex.id,
    sets: Array.from({ length: sets }, () => ({ weight: tip.weight, reps: tip.reps, done: false })),
  }
}

export function startWorkout(routine: Routine | null, exercises: Exercise[], history: Workout[]): Workout {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  return {
    id: uid(),
    name: routine?.name ?? 'Entreno libre',
    routineId: routine?.id,
    startedAt: new Date().toISOString(),
    entries: (routine?.items ?? []).flatMap((item) => {
      const ex = byId.get(item.exerciseId)
      return ex ? [newEntry(ex, history, item.sets)] : []
    }),
  }
}

/** Cierra el entreno: se queda solo con series marcadas y calcula los récords. */
export function finishWorkout(active: Workout, history: Workout[]) {
  const workout: Workout = {
    ...active,
    finishedAt: new Date().toISOString(),
    entries: active.entries
      .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done && s.reps > 0) }))
      .filter((e) => e.sets.length),
  }
  return { workout, prs: prsIn(workout, history) }
}

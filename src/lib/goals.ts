import type { Exercise, ItemGoal, Metric, RoutineGoal, RoutineItem, Target } from '../types'
import { unitHeader } from './metric'

/**
 * Fuerza: pocas reps pesadas, descansos largos, progresión lineal (rango fijo, ej. 5–5).
 * Hipertrofia: 8–12 reps, descansos medios, doble progresión.
 * Definición: como hipertrofia pero con descansos cortos (el déficit calórico hace el resto).
 */
export const GOAL_DEFAULTS: Record<ItemGoal, { sets: number; repMin: number; repMax: number; restSeconds: number }> = {
  strength: { sets: 5, repMin: 5, repMax: 5, restSeconds: 180 },
  hypertrophy: { sets: 3, repMin: 8, repMax: 12, restSeconds: 120 },
}

export const CUT_REST = 75

export const ITEM_GOAL_LABEL: Record<ItemGoal, string> = { strength: 'Fuerza', hypertrophy: 'Hipertrofia' }

export const ROUTINE_GOALS: { id: RoutineGoal; label: string; emoji: string; description: string }[] = [
  { id: 'strength', label: 'Fuerza', emoji: '🏋️', description: 'Pocas reps muy pesadas (3–5) y descansos largos para mover más peso.' },
  { id: 'hypertrophy', label: 'Hipertrofia', emoji: '💪', description: '8–12 reps cerca del fallo para ganar músculo.' },
  { id: 'powerbuilding', label: 'Powerbuilding', emoji: '⚡', description: 'Básicos pesados primero (5×5) y accesorios a 8–12 reps.' },
  { id: 'cut', label: 'Definición', emoji: '🔥', description: 'Pesas para conservar músculo, descansos cortos y meta de cardio.' },
]

export const routineGoalInfo = (g?: RoutineGoal) => ROUTINE_GOALS.find((x) => x.id === g)

/** Objetivo por defecto de un ejercicio nuevo dentro de una rutina con ese objetivo general. */
export function defaultTarget(goal: ItemGoal, routineGoal?: RoutineGoal, ex?: Exercise): Target {
  const d = GOAL_DEFAULTS[goal]
  // En hipertrofia respetamos el rango propio del ejercicio (laterales 12–20, pantorrillas 10–15…)
  const own = goal === 'hypertrophy' && ex && (ex.metric ?? 'reps') === 'reps'
  return {
    goal,
    repMin: own ? ex.repMin : d.repMin,
    repMax: own ? ex.repMax : d.repMax,
    restSeconds: goal === 'hypertrophy' && routineGoal === 'cut' ? CUT_REST : d.restSeconds,
  }
}

/** Objetivo efectivo de un ejercicio de rutina; las rutinas anteriores no tienen y usan el rango del ejercicio. */
export function itemTarget(item: RoutineItem, ex: Exercise, fallbackRest: number): Target {
  return item.target ?? { goal: 'hypertrophy', repMin: ex.repMin, repMax: ex.repMax, restSeconds: fallbackRest }
}

/** "5×5", "3×8–12", "3×30–60 seg" */
export function fmtScheme(sets: number, t: Pick<Target, 'repMin' | 'repMax'>, metric: Metric = 'reps') {
  const range = t.repMin === t.repMax ? `${t.repMin}` : `${t.repMin}–${t.repMax}`
  return `${sets}×${range}${metric === 'reps' ? '' : ` ${unitHeader(metric)}`}`
}

/** "3 min", "90 s", "2:30 min" */
export function fmtRest(s: number) {
  if (s >= 60 && s % 60 === 0) return `${s / 60} min`
  if (s > 90) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')} min`
  return `${s} s`
}

export const REST_OPTIONS = [60, 75, 90, 120, 150, 180, 240, 300]

/** El ejercicio con el rango del objetivo aplicado, para la lógica de sugerencias. */
export const withTarget = (ex: Exercise, t?: Target): Exercise => (t ? { ...ex, repMin: t.repMin, repMax: t.repMax } : ex)

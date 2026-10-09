export interface Exercise {
  id: string
  name: string
  muscle: string
  /** Rango de repeticiones objetivo para la doble progresión */
  repMin: number
  repMax: number
  /** Cuánto subir de peso cuando se completa el rango (kg) */
  increment: number
}

export interface RoutineItem {
  exerciseId: string
  sets: number
}

export interface Routine {
  id: string
  name: string
  items: RoutineItem[]
}

export interface SetLog {
  weight: number
  reps: number
  done: boolean
  /** Esfuerzo percibido 1–10 (10 = al fallo). Opcional. */
  rpe?: number
}

export interface ExerciseLog {
  exerciseId: string
  sets: SetLog[]
  note?: string
}

export interface Workout {
  id: string
  name: string
  routineId?: string
  startedAt: string
  finishedAt?: string
  entries: ExerciseLog[]
}

export interface Settings {
  restSeconds: number
  /** Peso de la barra (kg) para la calculadora de discos y el calentamiento */
  barWeight: number
  /** Discos disponibles (kg, uno de cada lado) */
  plates: number[]
}

export interface BodyweightEntry {
  /** Fecha local YYYY-MM-DD */
  date: string
  kg: number
}

export interface AppState {
  version: 1
  exercises: Exercise[]
  routines: Routine[]
  workouts: Workout[]
  active: Workout | null
  settings: Settings
  bodyweight: BodyweightEntry[]
}

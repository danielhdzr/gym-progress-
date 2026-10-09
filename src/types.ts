/** Cómo se mide una serie: repeticiones, segundos (plancha) o metros (paseo del granjero). */
export type Metric = 'reps' | 'seconds' | 'meters'

export interface Exercise {
  id: string
  name: string
  muscle: string
  /** Rango de repeticiones objetivo para la doble progresión */
  repMin: number
  repMax: number
  /** Cuánto subir de peso cuando se completa el rango (kg) */
  increment: number
  /** Unidad de cada serie; sin definir = repeticiones (datos anteriores) */
  metric?: Metric
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
  /** Cantidad en la unidad del ejercicio: reps, segundos o metros */
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

export type CountryCode = 'MX' | 'US' | 'CO' | 'AR' | 'CL' | 'PE' | 'ES'

export interface Settings {
  /** País para festivos nacionales y hemisferio de las estaciones */
  country: CountryCode
  /** Colores y mensajes según hora, estación y fechas especiales */
  seasonalThemes: boolean
  /** YYYY-MM-DD o "" */
  birthday: string
  /** Desde cuándo entrenas, YYYY-MM-DD o "" (vacío = fecha del primer entreno) */
  trainingStart: string
  /** Nombre para los saludos (vacío = sin nombre) */
  userName: string
  /** Ya se le preguntó el nombre (para no volver a insistir si lo omite) */
  namePrompted: boolean
  restSeconds: number
  /** Pitido al terminar el descanso */
  restSound: boolean
  /** Peso de la barra (kg) para la calculadora de discos y el calentamiento */
  barWeight: number
  /** Discos disponibles (kg, uno de cada lado) */
  plates: number[]
}

export type CardioType = 'walk' | 'run'

export interface CardioSession {
  id: string
  type: CardioType
  /** Inicio (ISO) */
  date: string
  distanceKm: number
  durationMin: number
  note?: string
}

/** Cronómetro de cardio en curso; se guarda para sobrevivir a cerrar la app. */
export interface CardioTimer {
  type: CardioType
  startedAt: string
  /** Milisegundos acumulados antes de la última pausa */
  elapsedMs: number
  /** Si está corriendo, desde cuándo (epoch ms); null = en pausa */
  runningSince: number | null
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
  cardio: CardioSession[]
  cardioTimer: CardioTimer | null
  /** Meta semanal de km (0 = sin meta) */
  cardioGoalKm: number
}

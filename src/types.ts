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
  /** Notas de técnica propias del usuario */
  cues?: string
}

/** Objetivo de un ejercicio dentro de una rutina. */
export type ItemGoal = 'strength' | 'hypertrophy'

/** Objetivo general de una rutina; "cut" = definición (hipertrofia con descansos cortos + cardio). */
export type RoutineGoal = 'strength' | 'hypertrophy' | 'cut' | 'powerbuilding'

/** Lo que se busca en un ejercicio concreto de una rutina. */
export interface Target {
  goal: ItemGoal
  repMin: number
  repMax: number
  restSeconds: number
}

export interface RoutineItem {
  exerciseId: string
  sets: number
  /** Si no está, se usa el rango del ejercicio y el descanso general (rutinas anteriores) */
  target?: Target
}

export interface Routine {
  id: string
  name: string
  items: RoutineItem[]
  goal?: RoutineGoal
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
  /** Objetivo con el que se hizo; las sugerencias comparan fuerza con fuerza e hipertrofia con hipertrofia */
  target?: Target
}

/** "¿Cómo llegas hoy?": ajusta la sesión. */
export type Readiness = 'great' | 'normal' | 'tired' | 'light'

export interface Workout {
  id: string
  readiness?: Readiness
  name: string
  routineId?: string
  startedAt: string
  finishedAt?: string
  entries: ExerciseLog[]
}

export type CountryCode = 'MX' | 'US' | 'CO' | 'AR' | 'CL' | 'PE' | 'ES' | 'VE'

/** Objetivo elegido en la bienvenida */
export type UserGoal = 'strength' | 'muscle' | 'cut' | 'cardio' | 'mixed'

export type AccentColor = 'lime' | 'blue' | 'purple' | 'pink' | 'orange' | 'red' | 'teal'

export interface Settings {
  /** Ya vio la bienvenida */
  onboarded: boolean
  goal: UserGoal | null
  accent: AccentColor
  /** Preguntar "¿Cómo llegas hoy?" al empezar un entreno */
  readinessCheck: boolean
  /** Resúmenes ya vistos o descartados en Inicio ("2026-09", "2026") */
  summariesSeen: string[]
  /** Fecha (ISO) del último respaldo exportado, o "" */
  lastBackupAt: string
  /** País para festivos nacionales y hemisferio de las estaciones */
  country: CountryCode
  /** Colores y mensajes según hora, estación y fechas especiales */
  seasonalThemes: boolean
  /** Meta de días activos por semana (pesas o cardio); 0 = sin meta */
  weeklyGoalDays: number
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
  /** Logros ya notificados (null = aún no se inicializa: los existentes se marcan sin aviso) */
  achievementsSeen: string[] | null
}

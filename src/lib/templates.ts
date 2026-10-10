import type { Exercise, ItemGoal, Routine, RoutineGoal, RoutineItem, UserGoal } from '../types'
import { CUT_REST, GOAL_DEFAULTS } from './goals'
import { uid } from './store'

/** [ejercicio, series, objetivo, reps mín, reps máx] — si faltan reps se usan las del objetivo/ejercicio. */
type Row = [string, number, ItemGoal, number?, number?]

export interface Template {
  id: string
  name: string
  goal: RoutineGoal
  days: string
  /** Días por semana sugeridos (para recomendar en la bienvenida) */
  daysPerWeek: number[]
  description: string
  /** Meta de cardio semanal (km) que propone, para definición */
  cardioKm?: number
  routines: { name: string; rows: Row[] }[]
}

const F = 'strength' as const
const H = 'hypertrophy' as const

export const TEMPLATES: Template[] = [
  {
    id: 'strength-5x5',
    name: 'Fuerza 5×5',
    goal: 'strength',
    days: '3 días · A/B alternadas',
    daysPerWeek: [2, 3],
    description: 'Tres básicos por día, 5 series de 5. Subes 2.5 kg cada vez que completas todas las series.',
    routines: [
      { name: 'A', rows: [['squat', 5, F], ['bench', 5, F], ['row', 5, F]] },
      { name: 'B', rows: [['squat', 5, F], ['ohp', 5, F], ['deadlift', 1, F]] },
    ],
  },
  {
    id: 'strength-ul',
    name: 'Fuerza Torso/Pierna',
    goal: 'strength',
    days: '4 días',
    daysPerWeek: [4],
    description: 'Básicos pesados a 3–5 reps con algunos accesorios para equilibrar.',
    routines: [
      { name: 'Torso A', rows: [['bench', 4, F, 3, 5], ['row', 4, F, 3, 5], ['pullup', 3, H, 6, 10], ['pushdown', 2, H]] },
      { name: 'Pierna A', rows: [['squat', 4, F, 3, 5], ['rdl', 3, H, 6, 10], ['leg-curl', 2, H], ['calf', 3, H]] },
      { name: 'Torso B', rows: [['ohp', 4, F, 3, 5], ['bench', 3, F, 5, 5], ['lat-pulldown', 3, H, 6, 10], ['curl', 2, H]] },
      { name: 'Pierna B', rows: [['deadlift', 3, F, 3, 5], ['leg-press', 3, H, 6, 10], ['hip-thrust', 3, H], ['cable-crunch', 2, H]] },
    ],
  },
  {
    id: 'powerbuilding',
    name: 'Powerbuilding',
    goal: 'powerbuilding',
    days: '4 días · Torso/Pierna',
    daysPerWeek: [4, 5],
    description: 'Un básico pesado 5×5 al inicio de cada día (peso muerto 3×5) y después accesorios a 8–12 para ganar músculo.',
    routines: [
      { name: 'Torso A', rows: [['bench', 5, F], ['row', 3, H], ['incline-db', 3, H], ['lat-pulldown', 3, H], ['lateral', 3, H], ['curl', 3, H]] },
      { name: 'Pierna A', rows: [['deadlift', 3, F], ['leg-press', 3, H], ['leg-curl', 3, H], ['hip-thrust', 3, H], ['calf', 4, H]] },
      { name: 'Torso B', rows: [['ohp', 5, F], ['bench', 3, H], ['pullup', 3, H, 6, 10], ['face-pull', 3, H], ['pushdown', 3, H]] },
      { name: 'Pierna B', rows: [['squat', 5, F], ['rdl', 3, H], ['leg-ext', 3, H], ['calf', 4, H], ['cable-crunch', 3, H]] },
    ],
  },
  {
    id: 'ppl',
    name: 'Push/Pull/Legs',
    goal: 'hypertrophy',
    days: '3 o 6 días',
    daysPerWeek: [3, 5, 6],
    description: 'Empuje, jalón y pierna. Hazla 1 vez por semana (3 días) o 2 veces (6 días).',
    routines: [
      { name: 'Push', rows: [['bench', 3, H, 6, 10], ['ohp', 3, H, 6, 10], ['incline-db', 3, H], ['lateral', 3, H], ['pushdown', 3, H]] },
      { name: 'Pull', rows: [['pullup', 3, H, 6, 10], ['row', 3, H], ['lat-pulldown', 3, H], ['face-pull', 3, H], ['curl', 3, H]] },
      { name: 'Legs', rows: [['squat', 3, H, 6, 10], ['rdl', 3, H], ['leg-press', 3, H], ['leg-curl', 3, H], ['calf', 4, H]] },
    ],
  },
  {
    id: 'hyp-ul',
    name: 'Torso/Pierna hipertrofia',
    goal: 'hypertrophy',
    days: '4 días',
    daysPerWeek: [4],
    description: 'Cada músculo dos veces por semana con volumen moderado.',
    routines: [
      { name: 'Torso A', rows: [['bench', 3, H, 6, 10], ['row', 3, H], ['incline-db', 3, H], ['lat-pulldown', 3, H], ['lateral', 3, H], ['pushdown', 3, H]] },
      { name: 'Pierna A', rows: [['squat', 3, H, 6, 10], ['rdl', 3, H], ['leg-press', 3, H], ['leg-curl', 3, H], ['calf', 4, H]] },
      { name: 'Torso B', rows: [['ohp', 3, H, 6, 10], ['pullup', 3, H, 6, 10], ['dips', 3, H], ['face-pull', 3, H], ['curl', 3, H]] },
      { name: 'Pierna B', rows: [['hip-thrust', 3, H], ['leg-press', 3, H], ['leg-ext', 3, H], ['leg-curl', 3, H], ['calf', 4, H]] },
    ],
  },
  {
    id: 'fullbody',
    name: 'Cuerpo completo',
    goal: 'hypertrophy',
    days: '3 días · A/B/C',
    daysPerWeek: [2, 3],
    description: 'Todo el cuerpo en cada sesión. Ideal si empiezas o tienes poco tiempo.',
    routines: [
      { name: 'A', rows: [['squat', 3, H, 6, 10], ['bench', 3, H, 6, 10], ['row', 3, H], ['lateral', 2, H], ['curl', 2, H]] },
      { name: 'B', rows: [['rdl', 3, H], ['ohp', 3, H, 6, 10], ['lat-pulldown', 3, H], ['leg-curl', 2, H], ['pushdown', 2, H]] },
      { name: 'C', rows: [['leg-press', 3, H], ['incline-db', 3, H], ['pullup', 3, H, 6, 10], ['face-pull', 2, H], ['calf', 3, H]] },
    ],
  },
  {
    id: 'cut-fullbody',
    name: 'Definición cuerpo completo',
    goal: 'cut',
    days: '3–4 días + cardio',
    daysPerWeek: [3, 4],
    cardioKm: 10,
    description: 'Pesas para conservar músculo con descansos cortos, más una meta de 10 km de cardio a la semana.',
    routines: [
      { name: 'A', rows: [['squat', 3, H, 6, 10], ['bench', 3, H, 6, 10], ['row', 3, H], ['lateral', 2, H], ['cable-crunch', 2, H]] },
      { name: 'B', rows: [['rdl', 3, H], ['ohp', 3, H, 6, 10], ['lat-pulldown', 3, H], ['leg-curl', 2, H], ['pushdown', 2, H]] },
      { name: 'C', rows: [['leg-press', 3, H], ['incline-db', 3, H], ['pullup', 3, H, 6, 10], ['hip-thrust', 2, H], ['curl', 2, H]] },
    ],
  },
  {
    id: 'cut-ul',
    name: 'Definición Torso/Pierna',
    goal: 'cut',
    days: '4 días + caminatas',
    daysPerWeek: [4, 5],
    cardioKm: 15,
    description: 'Torso/Pierna con descansos cortos y una meta de 15 km semanales caminando o corriendo.',
    routines: [
      { name: 'Torso A', rows: [['bench', 3, H, 6, 10], ['row', 3, H], ['incline-db', 3, H], ['lateral', 3, H], ['pushdown', 2, H]] },
      { name: 'Pierna A', rows: [['squat', 3, H, 6, 10], ['rdl', 3, H], ['leg-curl', 3, H], ['calf', 3, H]] },
      { name: 'Torso B', rows: [['ohp', 3, H, 6, 10], ['pullup', 3, H, 6, 10], ['face-pull', 3, H], ['curl', 2, H]] },
      { name: 'Pierna B', rows: [['leg-press', 3, H], ['hip-thrust', 3, H], ['leg-ext', 3, H], ['cable-crunch', 2, H]] },
    ],
  },
]

/** Convierte una plantilla en rutinas reales ("Powerbuilding · Torso A"), con su objetivo por ejercicio. */
export function buildRoutines(t: Template, exercises: Exercise[]): Routine[] {
  const byId = new Map(exercises.map((e) => [e.id, e]))
  return t.routines.map((r) => ({
    id: uid(),
    name: `${t.name} · ${r.name}`,
    goal: t.goal,
    items: r.rows
      .filter(([id]) => byId.has(id))
      .map(([exerciseId, sets, goal, min, max]): RoutineItem => {
        const ex = byId.get(exerciseId)!
        const d = GOAL_DEFAULTS[goal]
        const own = goal === 'hypertrophy'
        return {
          exerciseId,
          sets,
          target: {
            goal,
            repMin: min ?? (own ? ex.repMin : d.repMin),
            repMax: max ?? min ?? (own ? ex.repMax : d.repMax),
            restSeconds: t.goal === 'cut' && goal === 'hypertrophy' ? CUT_REST : d.restSeconds,
          },
        }
      }),
  }))
}

/** Plantillas recomendadas según el objetivo y días por semana de la bienvenida (la primera es la mejor opción). */
export function recommendTemplates(goal: UserGoal | null, days: number): Template[] {
  const byGoal: Record<UserGoal, RoutineGoal[]> = {
    strength: ['strength', 'powerbuilding'],
    muscle: ['hypertrophy', 'powerbuilding'],
    cut: ['cut', 'hypertrophy'],
    mixed: ['powerbuilding', 'hypertrophy', 'cut'],
    cardio: ['cut', 'hypertrophy'],
  }
  const wanted = goal ? byGoal[goal] : ['hypertrophy' as RoutineGoal]
  const score = (t: Template) => {
    const g = wanted.indexOf(t.goal)
    const goalScore = g === -1 ? 10 : g
    const dayScore = t.daysPerWeek.includes(days) ? 0 : Math.min(...t.daysPerWeek.map((d) => Math.abs(d - days)))
    return goalScore * 2 + dayScore
  }
  return [...TEMPLATES].filter((t) => wanted.includes(t.goal)).sort((a, b) => score(a) - score(b))
}

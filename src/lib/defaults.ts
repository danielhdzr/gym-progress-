import type { AppState, Exercise, Routine, Settings } from '../types'

export const MUSCLES = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Cuádriceps',
  'Isquios',
  'Glúteos',
  'Pantorrillas',
  'Core',
]

const ex = (
  id: string,
  name: string,
  muscle: string,
  repMin: number,
  repMax: number,
  increment: number,
): Exercise => ({ id, name, muscle, repMin, repMax, increment })

export const DEFAULT_EXERCISES: Exercise[] = [
  ex('bench', 'Press banca', 'Pecho', 6, 10, 2.5),
  ex('incline-db', 'Press inclinado con mancuernas', 'Pecho', 8, 12, 2),
  ex('dips', 'Fondos', 'Tríceps', 6, 12, 2.5),
  ex('ohp', 'Press militar', 'Hombros', 6, 10, 2.5),
  ex('lateral', 'Elevaciones laterales', 'Hombros', 12, 20, 1),
  ex('pushdown', 'Extensión de tríceps en polea', 'Tríceps', 10, 15, 2.5),
  ex('pullup', 'Dominadas', 'Espalda', 5, 10, 2.5),
  ex('row', 'Remo con barra', 'Espalda', 6, 10, 2.5),
  ex('lat-pulldown', 'Jalón al pecho', 'Espalda', 8, 12, 2.5),
  ex('face-pull', 'Face pull', 'Hombros', 12, 20, 2.5),
  ex('curl', 'Curl de bíceps', 'Bíceps', 8, 12, 1),
  ex('squat', 'Sentadilla', 'Cuádriceps', 5, 8, 2.5),
  ex('leg-press', 'Prensa', 'Cuádriceps', 8, 12, 5),
  ex('rdl', 'Peso muerto rumano', 'Isquios', 6, 10, 2.5),
  ex('deadlift', 'Peso muerto', 'Espalda', 3, 6, 5),
  ex('leg-curl', 'Curl femoral', 'Isquios', 10, 15, 2.5),
  ex('hip-thrust', 'Hip thrust', 'Glúteos', 8, 12, 5),
  ex('calf', 'Elevación de talones', 'Pantorrillas', 10, 15, 5),
  ex('cable-crunch', 'Crunch en polea', 'Core', 10, 15, 2.5),
]

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'push',
    name: 'Push (empuje)',
    items: [
      { exerciseId: 'bench', sets: 3 },
      { exerciseId: 'ohp', sets: 3 },
      { exerciseId: 'incline-db', sets: 3 },
      { exerciseId: 'lateral', sets: 3 },
      { exerciseId: 'pushdown', sets: 3 },
    ],
  },
  {
    id: 'pull',
    name: 'Pull (jalón)',
    items: [
      { exerciseId: 'pullup', sets: 3 },
      { exerciseId: 'row', sets: 3 },
      { exerciseId: 'lat-pulldown', sets: 3 },
      { exerciseId: 'face-pull', sets: 3 },
      { exerciseId: 'curl', sets: 3 },
    ],
  },
  {
    id: 'legs',
    name: 'Legs (pierna)',
    items: [
      { exerciseId: 'squat', sets: 3 },
      { exerciseId: 'rdl', sets: 3 },
      { exerciseId: 'leg-press', sets: 3 },
      { exerciseId: 'leg-curl', sets: 3 },
      { exerciseId: 'calf', sets: 4 },
    ],
  },
]

export const ALL_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25, 0.5]

export const DEFAULT_SETTINGS: Settings = {
  restSeconds: 120,
  barWeight: 20,
  plates: [25, 20, 15, 10, 5, 2.5, 1.25],
}

export function defaultState(): AppState {
  return {
    version: 1,
    exercises: DEFAULT_EXERCISES,
    routines: DEFAULT_ROUTINES,
    workouts: [],
    active: null,
    settings: DEFAULT_SETTINGS,
    bodyweight: [],
  }
}

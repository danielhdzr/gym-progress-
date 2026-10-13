import type { Exercise } from '../types'

/** Grupos de movimiento: los ejercicios de un mismo grupo se pueden sustituir entre sí. */
export const EXERCISE_GROUPS: { id: string; name: string; ids: string[] }[] = [
  { id: 'push-h', name: 'Empuje horizontal (pecho)', ids: ['bench', 'incline-db', 'dips', 'db-bench', 'incline-bench', 'machine-chest', 'pushup', 'db-fly', 'cable-fly'] },
  { id: 'push-v', name: 'Empuje vertical (hombro)', ids: ['ohp', 'db-ohp', 'arnold', 'machine-ohp'] },
  { id: 'delts', name: 'Hombro lateral y posterior', ids: ['lateral', 'face-pull', 'cable-lateral', 'rear-delt'] },
  { id: 'pull-v', name: 'Jalón vertical', ids: ['pullup', 'lat-pulldown', 'assisted-pullup', 'close-pulldown'] },
  { id: 'row', name: 'Remo', ids: ['row', 'db-row', 'cable-row', 'machine-row', 'inverted-row'] },
  { id: 'knee', name: 'Dominante de rodilla', ids: ['squat', 'leg-press', 'leg-ext', 'goblet', 'bulgarian', 'hack', 'lunge'] },
  { id: 'hip', name: 'Dominante de cadera', ids: ['deadlift', 'rdl', 'hip-thrust', 'db-rdl', 'glute-bridge', 'good-morning'] },
  { id: 'hamstring', name: 'Femoral', ids: ['leg-curl', 'seated-leg-curl'] },
  { id: 'biceps', name: 'Bíceps', ids: ['curl', 'hammer', 'cable-curl', 'preacher'] },
  { id: 'triceps', name: 'Tríceps', ids: ['pushdown', 'skullcrusher', 'overhead-ext'] },
  { id: 'calves', name: 'Pantorrilla', ids: ['calf', 'seated-calf'] },
  { id: 'core', name: 'Core', ids: ['cable-crunch', 'plank', 'hanging-leg-raise', 'ab-wheel'] },
  { id: 'grip', name: 'Agarre y trapecio', ids: ['farmer', 'wrist-curl', 'shrug'] },
]

/** Nombre normalizado: sin acentos, mayúsculas ni espacios extra (para no duplicar ejercicios). */
export const normalizeName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const GROUP_BY_ID = new Map(EXERCISE_GROUPS.flatMap((g) => g.ids.map((id) => [id, g.id] as const)))

/** Grupo de un ejercicio: por id, o por nombre si es uno creado por el usuario con el mismo nombre que uno de la biblioteca. */
export function groupOf(ex: Exercise, all: Exercise[]): string | null {
  const byId = GROUP_BY_ID.get(ex.id)
  if (byId) return byId
  const twin = all.find((e) => e.id !== ex.id && GROUP_BY_ID.has(e.id) && normalizeName(e.name) === normalizeName(ex.name))
  return twin ? GROUP_BY_ID.get(twin.id)! : null
}

/** Alternativas para sustituir: mismo grupo de movimiento; si no tiene grupo (ejercicio propio), mismo músculo. */
export function alternativesFor(ex: Exercise, all: Exercise[]): Exercise[] {
  const g = groupOf(ex, all)
  return all.filter((e) => e.id !== ex.id && (g ? groupOf(e, all) === g : e.muscle === ex.muscle))
}

import type { AppState, Exercise, ItemGoal, Metric, Routine, RoutineGoal } from '../types'
import { DEFAULT_EXERCISES, MUSCLES } from './defaults'
import { normalizeName } from './library'
import { uid } from './store'

/**
 * Compartir rutinas sin servidor: la rutina viaja dentro del enlace (después de "#",
 * que el navegador nunca envía a ningún servidor). Los ejercicios propios van incluidos.
 */

interface Payload {
  v: 1
  /** nombre */
  n: string
  /** objetivo de la rutina */
  g?: RoutineGoal
  /** [ejercicio, series, objetivo s|h, reps mín, reps máx, descanso] */
  i: [string, number, ('s' | 'h')?, number?, number?, number?][]
  /** ejercicios propios usados */
  x?: Pick<Exercise, 'id' | 'name' | 'muscle' | 'repMin' | 'repMax' | 'increment' | 'metric'>[]
}

const BUILT_IN = new Set(DEFAULT_EXERCISES.map((e) => e.id))
const ROUTINE_GOALS: RoutineGoal[] = ['strength', 'hypertrophy', 'cut', 'powerbuilding']
const METRICS: Metric[] = ['reps', 'seconds', 'meters']

function toBase64Url(text: string) {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(code: string) {
  const b64 = code.replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
}

export function encodeRoutine(routine: Routine, exercises: Exercise[]): string {
  const custom = routine.items
    .map((i) => exercises.find((e) => e.id === i.exerciseId))
    .filter((e): e is Exercise => !!e && !BUILT_IN.has(e.id))
  const payload: Payload = {
    v: 1,
    n: routine.name,
    ...(routine.goal ? { g: routine.goal } : {}),
    i: routine.items.map((i) =>
      i.target
        ? [i.exerciseId, i.sets, i.target.goal === 'strength' ? 's' : 'h', i.target.repMin, i.target.repMax, i.target.restSeconds]
        : [i.exerciseId, i.sets],
    ),
    ...(custom.length
      ? { x: [...new Map(custom.map((e) => [e.id, e])).values()].map(({ id, name, muscle, repMin, repMax, increment, metric }) => ({ id, name, muscle, repMin, repMax, increment, ...(metric ? { metric } : {}) })) }
      : {}),
  }
  return toBase64Url(JSON.stringify(payload))
}

/**
 * Enlace para compartir. La app se publica con rutas relativas (base "./"), así que la dirección
 * se resuelve contra la página actual: https://…/gym-progress-/ (sin ?parámetros ni #).
 */
export const appBaseUrl = (href: string, base = import.meta.env.BASE_URL) => new URL(base, href).href

export const shareUrl = (code: string, base = appBaseUrl(location.href)) => `${base}#rutina=${code}`

/** Lee el código del enlace (#rutina=…), o null si el enlace no trae una rutina. */
export const routineCodeFromHash = (hash: string) => (hash.startsWith('#rutina=') ? hash.slice('#rutina='.length) : null)

const int = (v: unknown, min: number, max: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max
const text = (v: unknown, max: number) => typeof v === 'string' && v.trim().length > 0 && v.length <= max

/** Decodifica y VALIDA un enlace (viene de fuera: no se confía en nada). */
export function decodeRoutine(code: string): Payload {
  let data: unknown
  try {
    data = JSON.parse(fromBase64Url(code))
  } catch {
    throw new Error('El enlace no contiene una rutina válida.')
  }
  const p = data as Payload
  const ok =
    p &&
    p.v === 1 &&
    text(p.n, 60) &&
    (p.g === undefined || ROUTINE_GOALS.includes(p.g)) &&
    Array.isArray(p.i) &&
    p.i.length > 0 &&
    p.i.length <= 30 &&
    p.i.every(
      (it) =>
        Array.isArray(it) &&
        text(it[0], 60) &&
        int(it[1], 1, 10) &&
        (it.length === 2 ||
          ((it[2] === 's' || it[2] === 'h') && int(it[3], 1, 600) && int(it[4], 1, 600) && (it[3] as number) <= (it[4] as number) && int(it[5], 15, 900))),
    ) &&
    (p.x === undefined ||
      (Array.isArray(p.x) &&
        p.x.length <= 30 &&
        p.x.every(
          (e) =>
            text(e.id, 60) &&
            text(e.name, 60) &&
            text(e.muscle, 30) &&
            int(e.repMin, 1, 600) &&
            int(e.repMax, 1, 600) &&
            int(e.increment, 0, 50) &&
            (e.metric === undefined || METRICS.includes(e.metric)),
        )))
  if (!ok) throw new Error('El enlace no contiene una rutina válida.')
  // Cada ejercicio de la rutina debe existir en la biblioteca o venir incluido
  const known = new Set([...BUILT_IN, ...(p.x ?? []).map((e) => e.id)])
  if (!p.i.every(([id]) => known.has(id))) throw new Error('La rutina usa ejercicios que no vienen en el enlace.')
  return p
}

/** Agrega la rutina compartida: reutiliza ejercicios que ya tienes (mismo id o mismo nombre) y crea los que falten. */
export function importRoutine(state: AppState, p: Payload): { state: AppState; routine: Routine } {
  const exercises = [...state.exercises]
  const idMap = new Map<string, string>()
  for (const e of p.x ?? []) {
    const same = exercises.find((x) => x.id === e.id) ?? exercises.find((x) => normalizeName(x.name) === normalizeName(e.name))
    if (same) idMap.set(e.id, same.id)
    else {
      const id = uid()
      idMap.set(e.id, id)
      exercises.push({ ...e, id, name: e.name.trim(), muscle: MUSCLES.includes(e.muscle) ? e.muscle : e.muscle.trim() })
    }
  }
  const routine: Routine = {
    id: uid(),
    name: p.n.trim(),
    ...(p.g ? { goal: p.g } : {}),
    items: p.i.map(([id, sets, g, min, max, rest]) => ({
      exerciseId: idMap.get(id) ?? id,
      sets,
      ...(g ? { target: { goal: (g === 's' ? 'strength' : 'hypertrophy') as ItemGoal, repMin: min!, repMax: max!, restSeconds: rest! } } : {}),
    })),
  }
  return { state: { ...state, exercises, routines: [...state.routines, routine] }, routine }
}

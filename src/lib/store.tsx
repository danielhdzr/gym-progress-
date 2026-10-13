import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { AppState } from '../types'
import { defaultState } from './defaults'
import { normalizeName } from './library'

const STORAGE_KEY = 'gym-progress-v1'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return parseState(raw)
  } catch {
    // datos corruptos o storage bloqueado: empezamos de cero
  }
  return defaultState()
}

export function parseState(raw: string): AppState {
  const data = JSON.parse(raw) as Partial<AppState>
  if (data.version !== 1 || !Array.isArray(data.workouts) || !Array.isArray(data.exercises)) {
    throw new Error('Formato de respaldo no válido')
  }
  const base = defaultState()
  // Respaldos de versiones anteriores pueden no traer los campos nuevos
  const settings = { ...base.settings, ...data.settings }
  // Quien ya usaba la app antes de existir la bienvenida no debe verla
  if (data.settings && data.settings.onboarded === undefined) {
    settings.onboarded = data.workouts.length > 0 || (data.cardio?.length ?? 0) > 0 || !!data.settings.namePrompted
  }
  // Ejercicios nuevos de la lista base que no existían en datos anteriores
  const known = new Set(data.exercises.map((e) => e.id))
  const knownNames = new Set(data.exercises.map((e) => normalizeName(e.name)))
  const exercises = [...data.exercises, ...base.exercises.filter((e) => !known.has(e.id) && !knownNames.has(normalizeName(e.name)))]
  return { ...base, ...data, exercises, settings } as AppState
}

let counter = 0
/** IDs que no dependen de crypto.randomUUID (no existe fuera de HTTPS en el celular). */
export const uid = () => `${Date.now().toString(36)}-${(counter++).toString(36)}-${Math.random().toString(36).slice(2, 7)}`

type Updater = (fn: (s: AppState) => AppState) => void

const StoreContext = createContext<{ state: AppState; update: Updater } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(loadState)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // sin espacio o modo privado: la app sigue funcionando en memoria
    }
  }, [state])

  const update = useCallback<Updater>((fn) => setState(fn), [])

  return <StoreContext.Provider value={{ state, update }}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore fuera de StoreProvider')
  return ctx
}

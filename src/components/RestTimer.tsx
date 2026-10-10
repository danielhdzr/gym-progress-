import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import { fmtClock } from '../lib/format'
import { playRestDone, unlockAudio } from '../lib/sound'

interface RestTimer {
  /** Inicia el descanso (por defecto el de Ajustes). Se llama desde un toque del usuario (desbloquea el audio en iOS). */
  start: (seconds?: number) => void
  stop: () => void
}

const RestTimerContext = createContext<RestTimer | null>(null)

/**
 * Temporizador de descanso a nivel de toda la app: sigue contando y avisa
 * aunque el usuario cambie de pestaña (Progreso, Historial…).
 */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { state } = useStore()
  const { restSeconds, restSound } = state.settings
  const [restEnd, setRestEnd] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!restEnd) return
    const t = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(t)
  }, [restEnd])

  const left = restEnd ? (restEnd - now) / 1000 : 0
  useEffect(() => {
    if (restEnd && left <= 0) {
      if (restSound) playRestDone()
      navigator.vibrate?.([200, 100, 200])
      setRestEnd(null)
    }
  }, [restEnd, left, restSound])

  const start = useCallback(
    (seconds?: number) => {
      unlockAudio()
      const t = Date.now()
      setNow(t)
      setRestEnd(t + (seconds ?? restSeconds) * 1000)
    },
    [restSeconds],
  )

  const stop = useCallback(() => setRestEnd(null), [])

  return (
    <RestTimerContext.Provider value={{ start, stop }}>
      {children}
      {restEnd && left > 0 && (
        <div className="rest-bar" role="timer" aria-label="Descanso">
          <span>Descanso</span>
          <strong>{fmtClock(left)}</strong>
          <button className="ghost" onClick={() => setRestEnd((r) => (r ?? Date.now()) + 30000)}>+30 s</button>
          <button className="ghost" onClick={stop}>Saltar</button>
        </div>
      )}
    </RestTimerContext.Provider>
  )
}

export function useRestTimer() {
  const ctx = useContext(RestTimerContext)
  if (!ctx) throw new Error('useRestTimer fuera de RestTimerProvider')
  return ctx
}

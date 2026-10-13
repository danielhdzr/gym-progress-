import { useState } from 'react'
import { X } from 'lucide-react'
import type { Readiness, Routine } from '../types'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { startWorkout } from '../lib/workout'

export const READINESS: { id: Readiness; emoji: string; label: string; hint: string }[] = [
  { id: 'great', emoji: '💪', label: 'Con energía', hint: 'Sugerencias normales' },
  { id: 'normal', emoji: '🙂', label: 'Normal', hint: 'Sugerencias normales' },
  { id: 'tired', emoji: '😴', label: 'Cansado o dormí mal', hint: 'Sin subir peso y 1 serie menos' },
  { id: 'light', emoji: '🤕', label: 'Día ligero', hint: '−10 % de peso y 1 serie menos' },
]

export const readinessInfo = (r?: Readiness) => READINESS.find((x) => x.id === r)

/**
 * Empezar un entreno: si está activado, primero pregunta "¿Cómo llegas hoy?".
 * Devuelve la función para empezar y el elemento de la ventana (renderízalo donde se use).
 */
export function useBeginWorkout() {
  const { state, update } = useStore()
  const nav = useNav()
  const [pending, setPending] = useState<Routine | null>(null)

  const start = (routine: Routine | null, readiness?: Readiness) => {
    update((s) => ({ ...s, active: startWorkout(routine, s.exercises, s.workouts, undefined, false, readiness) }))
    setPending(null)
    nav.go('gym')
  }

  const begin = (routine: Routine | null) => {
    if (routine && state.settings.readinessCheck) setPending(routine)
    else start(routine)
  }

  const sheet = pending && (
    <div className="sheet-backdrop" onClick={() => setPending(null)}>
      <div className="sheet" role="dialog" aria-label="¿Cómo llegas hoy?" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>¿Cómo llegas hoy?</h2>
          <button className="icon-btn" onClick={() => setPending(null)} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <p className="muted small">La app ajusta las sugerencias de {pending.name} según tu energía.</p>
        <div className="readiness-options">
          {READINESS.map((r) => (
            <button key={r.id} className="readiness-option" onClick={() => start(pending, r.id)}>
              <span className="readiness-emoji" aria-hidden>{r.emoji}</span>
              <span>
                <strong>{r.label}</strong>
                <span className="muted small block">{r.hint}</span>
              </span>
            </button>
          ))}
        </div>
        <button
          className="link small center"
          onClick={() => {
            update((s) => ({ ...s, settings: { ...s.settings, readinessCheck: false } }))
            start(pending)
          }}
        >
          No volver a preguntar (puedes activarlo en Ajustes)
        </button>
      </div>
    </div>
  )

  return { begin, sheet }
}

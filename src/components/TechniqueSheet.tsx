import { createPortal } from 'react-dom'
import { CircleAlert, CircleCheck, X } from 'lucide-react'
import type { Exercise } from '../types'
import { useStore } from '../lib/store'
import { TECHNIQUE } from '../lib/technique'

/** Guía de técnica de un ejercicio: puntos clave, errores comunes y notas propias. */
export function TechniqueSheet({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const { update } = useStore()
  const t = TECHNIQUE[ex.id]

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Técnica: ${ex.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{ex.name}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <div className="sheet-body help-body">
          {t ? (
            <>
              <div className="group-label">Puntos clave</div>
              <ul className="cue-list">
                {t.cues.map((c) => <li key={c}><CircleCheck size={16} className="ok-icon" aria-hidden /> {c}</li>)}
              </ul>
              <div className="group-label">Errores comunes</div>
              <ul className="cue-list">
                {t.errors.map((c) => <li key={c}><CircleAlert size={16} className="warn-icon" aria-hidden /> {c}</li>)}
              </ul>
            </>
          ) : (
            <p className="muted">Este ejercicio lo creaste tú. Escribe abajo tus propias claves de técnica.</p>
          )}
          <label className="field">
            Mis notas de técnica
            <textarea
              className="note"
              rows={3}
              placeholder="Ej. agarre a la altura de las marcas, bajar en 3 segundos…"
              value={ex.cues ?? ''}
              onChange={(e) => update((s) => ({ ...s, exercises: s.exercises.map((x) => (x.id === ex.id ? { ...x, cues: e.target.value } : x)) }))}
            />
          </label>
          <p className="muted small">Guía general: no sustituye a un entrenador. Si algo duele, detente.</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

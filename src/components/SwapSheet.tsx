import { createPortal } from 'react-dom'
import { ChevronRight, X } from 'lucide-react'
import type { Exercise } from '../types'
import { useStore } from '../lib/store'
import { alternativesFor } from '../lib/library'
import { fmtRange, metricOf } from '../lib/metric'
import { sessionsFor } from '../lib/progression'

/** Alternativas que trabajan el mismo movimiento (p. ej. la máquina está ocupada). */
export function SwapSheet({ ex, onClose, onPick }: { ex: Exercise; onClose: () => void; onPick: (alt: Exercise) => void }) {
  const { state } = useStore()
  const alts = alternativesFor(ex, state.exercises)
  // Primero las que ya has hecho (tienen historial para sugerir peso)
  const done = new Set(alts.filter((a) => sessionsFor(a.id, state.workouts).length).map((a) => a.id))
  const sorted = [...alts].sort((a, b) => Number(done.has(b.id)) - Number(done.has(a.id)))

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Cambiar ${ex.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Cambiar {ex.name}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <p className="muted small">Ejercicios que trabajan el mismo movimiento. La app sugiere el peso con tu historial de cada uno.</p>
        <div className="sheet-body">
          {sorted.map((a) => (
            <button key={a.id} className="settings-row" onClick={() => onPick(a)}>
              <span className="grow">
                <span className="settings-title">{a.name}</span>
                <span className="muted small block">
                  {fmtRange(a.repMin, a.repMax, metricOf(a))}
                  {done.has(a.id) ? ' · ya lo has hecho' : ' · primera vez'}
                </span>
              </span>
              <ChevronRight size={18} className="muted" aria-hidden />
            </button>
          ))}
          {!sorted.length && <p className="muted">No hay alternativas registradas para este ejercicio.</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

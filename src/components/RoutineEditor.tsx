import { useState } from 'react'
import type { Routine } from '../types'
import { useStore } from '../lib/store'
import { ExercisePicker } from './ExercisePicker'
import { useDialog } from './Dialog'

interface Props {
  routine: Routine
  onSave: (r: Routine) => void
  onDelete: () => void
  onClose: () => void
}

export function RoutineEditor({ routine, onSave, onDelete, onClose }: Props) {
  const { state } = useStore()
  const dialog = useDialog()
  const [draft, setDraft] = useState(routine)
  const [picking, setPicking] = useState(false)
  const exists = state.routines.some((r) => r.id === routine.id)

  const setItems = (fn: (items: Routine['items']) => Routine['items']) =>
    setDraft((d) => ({ ...d, items: fn(d.items) }))

  const move = (i: number, dir: -1 | 1) =>
    setItems((items) => {
      const j = i + dir
      if (j < 0 || j >= items.length) return items
      const copy = [...items]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })

  return (
    <div className="screen">
      <header className="workout-head">
        <button className="ghost" onClick={onClose}>‹ Volver</button>
        <button className="primary" onClick={() => onSave({ ...draft, name: draft.name.trim() || 'Rutina' })}>
          Guardar
        </button>
      </header>

      <input
        className="title-input"
        value={draft.name}
        aria-label="Nombre de la rutina"
        onChange={(e) => setDraft({ ...draft, name: e.target.value })}
      />

      {draft.items.map((item, i) => (
        <div key={`${item.exerciseId}-${i}`} className="card editor-row">
          <div className="reorder">
            <button className="icon" aria-label="Subir" onClick={() => move(i, -1)} disabled={i === 0}>▲</button>
            <button className="icon" aria-label="Bajar" onClick={() => move(i, 1)} disabled={i === draft.items.length - 1}>▼</button>
          </div>
          <span className="grow">{state.exercises.find((e) => e.id === item.exerciseId)?.name ?? '—'}</span>
          <div className="stepper">
            <button className="icon" aria-label="Menos series" onClick={() => setItems((its) => its.map((x, j) => (j === i ? { ...x, sets: Math.max(1, x.sets - 1) } : x)))}>−</button>
            <span>{item.sets}×</span>
            <button className="icon" aria-label="Más series" onClick={() => setItems((its) => its.map((x, j) => (j === i ? { ...x, sets: Math.min(10, x.sets + 1) } : x)))}>+</button>
          </div>
          <button className="icon" aria-label="Quitar" onClick={() => setItems((its) => its.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}

      {!draft.items.length && <p className="muted center">Agrega ejercicios a esta rutina.</p>}

      <button className="secondary full" onClick={() => setPicking(true)}>+ Agregar ejercicio</button>
      {exists && (
        <button className="danger-link" onClick={async () => {
            if (await dialog.confirm({ message: `¿Eliminar la rutina “${routine.name}”?`, confirmLabel: 'Eliminar', danger: true })) onDelete()
          }}>
          Eliminar rutina
        </button>
      )}

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(exerciseId) => {
            setItems((items) => [...items, { exerciseId, sets: 3 }])
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

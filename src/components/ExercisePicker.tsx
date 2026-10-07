import { useMemo, useState } from 'react'
import type { Exercise } from '../types'
import { MUSCLES } from '../lib/defaults'
import { uid, useStore } from '../lib/store'

interface Props {
  onPick: (exerciseId: string) => void
  onClose: () => void
}

export function ExercisePicker({ onPick, onClose }: Props) {
  const { state, update } = useStore()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = state.exercises.filter((e) => !q || e.name.toLowerCase().includes(q))
    const map = new Map<string, Exercise[]>()
    for (const e of list) map.set(e.muscle, [...(map.get(e.muscle) ?? []), e])
    return [...map.entries()]
  }, [state.exercises, query])

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{creating ? 'Nuevo ejercicio' : 'Agregar ejercicio'}</h2>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        {creating ? (
          <NewExerciseForm
            initialName={query}
            onCancel={() => setCreating(false)}
            onSave={(e) => {
              update((s) => ({ ...s, exercises: [...s.exercises, e] }))
              onPick(e.id)
            }}
          />
        ) : (
          <>
            <input
              className="search"
              placeholder="Buscar…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <div className="sheet-body">
              {groups.map(([muscle, list]) => (
                <div key={muscle}>
                  <div className="group-label">{muscle}</div>
                  {list.map((e) => (
                    <button key={e.id} className="list-item" onClick={() => onPick(e.id)}>
                      {e.name}
                      <span className="muted">{e.repMin}–{e.repMax} reps</span>
                    </button>
                  ))}
                </div>
              ))}
              {!groups.length && <p className="muted center">Sin resultados.</p>}
            </div>
            <button className="secondary full" onClick={() => setCreating(true)}>
              + Crear ejercicio{query ? ` “${query}”` : ''}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function NewExerciseForm({
  initialName,
  onSave,
  onCancel,
}: {
  initialName: string
  onSave: (e: Exercise) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initialName)
  const [muscle, setMuscle] = useState(MUSCLES[0])
  const [repMin, setRepMin] = useState(8)
  const [repMax, setRepMax] = useState(12)
  const [increment, setIncrement] = useState(2.5)

  const valid = name.trim() && repMin > 0 && repMax >= repMin

  return (
    <form
      className="form"
      onSubmit={(ev) => {
        ev.preventDefault()
        if (valid) onSave({ id: uid(), name: name.trim(), muscle, repMin, repMax, increment })
      }}
    >
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <label>
        Músculo principal
        <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
          {MUSCLES.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
      <div className="row3">
        <label>
          Reps mín
          <input type="number" inputMode="numeric" value={repMin} onChange={(e) => setRepMin(+e.target.value)} />
        </label>
        <label>
          Reps máx
          <input type="number" inputMode="numeric" value={repMax} onChange={(e) => setRepMax(+e.target.value)} />
        </label>
        <label>
          Subir (kg)
          <input type="number" inputMode="decimal" step="0.5" value={increment} onChange={(e) => setIncrement(+e.target.value)} />
        </label>
      </div>
      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary" disabled={!valid}>Guardar</button>
      </div>
    </form>
  )
}

import { useMemo, useState } from 'react'
import type { Exercise, Metric } from '../types'
import { METRICS, defaultRange, fmtRange, metricOf, unitHeader } from '../lib/metric'
import { MUSCLES } from '../lib/defaults'
import { uid, useStore } from '../lib/store'

interface Props {
  /** Recibe el ejercicio completo: si se acaba de crear, aún no está en el estado de quien llama */
  onPick: (exercise: Exercise) => void
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
          <ExerciseForm
            initialName={query}
            onCancel={() => setCreating(false)}
            onSave={(e) => {
              update((s) => ({ ...s, exercises: [...s.exercises, e] }))
              onPick(e)
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
                    <button key={e.id} className="list-item" onClick={() => onPick(e)}>
                      {e.name}
                      <span className="muted">{fmtRange(e.repMin, e.repMax, metricOf(e))}</span>
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

interface FormProps {
  /** Ejercicio a editar; sin él se crea uno nuevo */
  initial?: Exercise
  initialName?: string
  submitLabel?: string
  onSave: (e: Exercise) => void
  onCancel: () => void
}

/** Crear o editar un ejercicio: nombre, músculo, unidad, rango e incremento. */
export function ExerciseForm({ initial, initialName = '', submitLabel = 'Guardar', onSave, onCancel }: FormProps) {
  const [name, setName] = useState(initial?.name ?? initialName)
  const [muscle, setMuscle] = useState(initial?.muscle ?? MUSCLES[0])
  const [metric, setMetric] = useState<Metric>(metricOf(initial))
  const [repMin, setRepMin] = useState(initial?.repMin ?? 8)
  const [repMax, setRepMax] = useState(initial?.repMax ?? 12)
  const [increment, setIncrement] = useState(initial?.increment ?? 2.5)

  const valid = name.trim() && repMin > 0 && repMax >= repMin
  // Por si el ejercicio tenía un músculo que ya no está en la lista
  const muscles = MUSCLES.includes(muscle) ? MUSCLES : [muscle, ...MUSCLES]
  const unit = unitHeader(metric)

  return (
    <form
      className="form"
      onSubmit={(ev) => {
        ev.preventDefault()
        if (valid) onSave({ id: initial?.id ?? uid(), name: name.trim(), muscle, metric, repMin, repMax, increment })
      }}
    >
      <label>
        Nombre
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus={!initial} />
      </label>
      <div className="row2">
        <label>
          Músculo principal
          <select value={muscle} onChange={(e) => setMuscle(e.target.value)}>
            {muscles.map((m) => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>
          Se mide en
          <select
            value={metric}
            onChange={(e) => {
              const m = e.target.value as Metric
              setMetric(m)
              // Rango sugerido al cambiar de unidad (8–12 reps no tiene sentido en metros)
              const [min, max] = defaultRange(m)
              setRepMin(min)
              setRepMax(max)
            }}
          >
            {METRICS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
          </select>
        </label>
      </div>
      <div className="row3">
        <label>
          Meta mín ({unit})
          <input type="number" inputMode="numeric" value={repMin} onChange={(e) => setRepMin(+e.target.value)} />
        </label>
        <label>
          Meta máx ({unit})
          <input type="number" inputMode="numeric" value={repMax} onChange={(e) => setRepMax(+e.target.value)} />
        </label>
        <label>
          Subir (kg)
          <input type="number" inputMode="decimal" step="0.5" value={increment} onChange={(e) => setIncrement(+e.target.value)} />
        </label>
      </div>
      <p className="muted small">
        Cuando llegues a la meta máxima en todas las series, la app te sugerirá subir {increment || 0} kg.
        {metric !== 'reps' && ` Mientras tanto, te pedirá +5 ${unit} por sesión.`}
      </p>
      <div className="actions">
        <button type="button" className="ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="primary" disabled={!valid}>{submitLabel}</button>
      </div>
    </form>
  )
}

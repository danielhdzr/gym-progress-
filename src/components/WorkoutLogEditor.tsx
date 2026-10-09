import { useMemo, useState } from 'react'
import type { ExerciseLog, Workout } from '../types'
import { useStore } from '../lib/store'
import { historyBefore, newEntry, saveLoggedWorkout } from '../lib/workout'
import { toYmd, withLocalDate } from '../lib/format'
import { ExerciseCard } from './ExerciseCard'
import { ExercisePicker } from './ExercisePicker'
import { NumInput } from './NumInput'
import { useDialog } from './Dialog'

interface Props {
  workout: Workout
  isNew: boolean
  onClose: () => void
  onSaved: (result: { workout: Workout; prs: string[] }) => void
}

/** Registrar un entreno pasado o editar uno del historial. */
export function WorkoutLogEditor({ workout, isNew, onClose, onSaved }: Props) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const [draft, setDraft] = useState(workout)
  const [duration, setDuration] = useState(() =>
    workout.finishedAt
      ? Math.round((new Date(workout.finishedAt).getTime() - new Date(workout.startedAt).getTime()) / 60000)
      : 60,
  )
  const [picking, setPicking] = useState(false)

  const history = useMemo(() => historyBefore(state.workouts, draft), [state.workouts, draft])
  const setEntries = (fn: (entries: ExerciseLog[]) => ExerciseLog[]) =>
    setDraft((d) => ({ ...d, entries: fn(d.entries) }))

  const save = async () => {
    if (toYmd(draft.startedAt) > toYmd(new Date())) {
      await dialog.alert('La fecha no puede ser en el futuro.')
      return
    }
    const result = saveLoggedWorkout({ ...draft, name: draft.name.trim() || 'Entreno' }, duration, state.workouts)
    if (!result.workout.entries.length) {
      await dialog.alert('Agrega al menos una serie con repeticiones para guardar el entreno.')
      return
    }
    update((s) => ({
      ...s,
      workouts: s.workouts.some((w) => w.id === result.workout.id)
        ? s.workouts.map((w) => (w.id === result.workout.id ? result.workout : w))
        : [...s.workouts, result.workout],
    }))
    onSaved(result)
  }

  return (
    <div className="screen">
      <header className="workout-head">
        <button className="ghost" onClick={onClose}>‹ Cancelar</button>
        <button className="primary" onClick={save}>Guardar</button>
      </header>

      <section className="card">
        <h2>{isNew ? 'Registrar entreno pasado' : 'Editar entreno'}</h2>
        <label className="field">
          Nombre
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        </label>
        <div className="row2">
          <label className="field">
            Fecha
            <input
              type="date"
              value={toYmd(draft.startedAt)}
              max={toYmd(new Date())}
              onChange={(e) => e.target.value && setDraft({ ...draft, startedAt: withLocalDate(draft.startedAt, e.target.value) })}
            />
          </label>
          <label className="field">
            Duración (min)
            <NumInput ariaLabel="Duración en minutos" value={duration} onChange={setDuration} />
          </label>
        </div>
        <p className="muted small">Se guardan las series en las que escribas repeticiones; las vacías y los ejercicios sin series se ignoran. Aquí no hace falta marcar ✓.</p>
      </section>

      {draft.entries.map((entry, ei) => (
        <ExerciseCard
          key={`${entry.exerciseId}-${ei}`}
          entry={entry}
          index={ei}
          history={history}
          mode="log"
          setEntries={setEntries}
        />
      ))}

      <button className="secondary full" onClick={() => setPicking(true)}>+ Agregar ejercicio</button>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            const ex = state.exercises.find((e) => e.id === id)
            if (ex) setEntries((entries) => [...entries, newEntry(ex, history, 3, true)])
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

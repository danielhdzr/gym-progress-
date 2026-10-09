import { useEffect, useState } from 'react'
import type { ExerciseLog, Workout } from '../types'
import { useStore } from '../lib/store'
import { fmtDuration } from '../lib/format'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseCard } from './ExerciseCard'
import { newEntry, patchSet } from '../lib/workout'
import { useDialog } from './Dialog'
import { useRestTimer } from './RestTimer'

interface Props {
  workout: Workout
  onFinish: () => void
  onDiscard: () => void
}

export function ActiveWorkout({ workout, onFinish, onDiscard }: Props) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const [picking, setPicking] = useState(false)
  const rest = useRestTimer()
  // Reloj del encabezado (duración del entreno)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15000)
    return () => clearInterval(t)
  }, [])

  const setEntries = (fn: (entries: ExerciseLog[]) => ExerciseLog[]) =>
    update((s) => (s.active ? { ...s, active: { ...s.active, entries: fn(s.active.entries) } } : s))

  const toggleDone = (ei: number, si: number) => {
    const set = workout.entries[ei].sets[si]
    setEntries((es) => patchSet(es, ei, si, { done: !set.done }))
    if (!set.done) rest.start()
  }

  const doneSets = workout.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)

  return (
    <div className="screen">
      <header className="workout-head">
        <div>
          <h1>{workout.name}</h1>
          <span className="muted">{fmtDuration(now - new Date(workout.startedAt).getTime())} · {doneSets} series</span>
        </div>
        <button className="primary" onClick={onFinish}>Terminar</button>
      </header>

      {workout.entries.map((entry, ei) => (
        <ExerciseCard
          key={`${entry.exerciseId}-${ei}`}
          entry={entry}
          index={ei}
          history={state.workouts}
          mode="live"
          setEntries={setEntries}
          onToggle={(si) => toggleDone(ei, si)}
        />
      ))}

      <button className="secondary full" onClick={() => setPicking(true)}>+ Agregar ejercicio</button>
      <button
        className="danger-link"
        onClick={async () => {
          if (await dialog.confirm({ message: '¿Descartar este entreno? Se perderá lo registrado.', confirmLabel: 'Descartar', danger: true })) {
            rest.stop()
            onDiscard()
          }
        }}
      >
        Descartar entreno
      </button>

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            setEntries((entries) => [...entries, newEntry(ex, state.workouts, 3)])
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

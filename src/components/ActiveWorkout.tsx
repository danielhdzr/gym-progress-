import { useEffect, useState } from 'react'
import type { ExerciseLog, Workout } from '../types'
import { useStore } from '../lib/store'
import { fmtClock, fmtDuration } from '../lib/format'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseCard } from './ExerciseCard'
import { newEntry, patchSet } from '../lib/workout'
import { useDialog } from './Dialog'

/** Sobrevive a cambiar de pestaña (el componente se desmonta). */
let savedRestEnd: number | null = null

interface Props {
  workout: Workout
  onFinish: () => void
  onDiscard: () => void
}

export function ActiveWorkout({ workout, onFinish, onDiscard }: Props) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const [picking, setPicking] = useState(false)
  const [restEnd, setRestEnd] = useState<number | null>(() => savedRestEnd)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    savedRestEnd = restEnd
  }, [restEnd])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(t)
  }, [])

  const restLeft = restEnd ? (restEnd - now) / 1000 : 0
  useEffect(() => {
    if (restEnd && restLeft <= 0) {
      navigator.vibrate?.([200, 100, 200])
      setRestEnd(null)
    }
  }, [restEnd, restLeft])

  const setEntries = (fn: (entries: ExerciseLog[]) => ExerciseLog[]) =>
    update((s) => (s.active ? { ...s, active: { ...s.active, entries: fn(s.active.entries) } } : s))

  const toggleDone = (ei: number, si: number) => {
    const set = workout.entries[ei].sets[si]
    setEntries((es) => patchSet(es, ei, si, { done: !set.done }))
    if (!set.done) {
      const t = Date.now()
      setNow(t)
      setRestEnd(t + state.settings.restSeconds * 1000)
    }
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
            setRestEnd(null)
            onDiscard()
          }
        }}
      >
        Descartar entreno
      </button>

      {restEnd && restLeft > 0 && (
        <div className="rest-bar">
          <span>Descanso</span>
          <strong>{fmtClock(restLeft)}</strong>
          <button className="ghost" onClick={() => setRestEnd((r) => (r ?? Date.now()) + 30000)}>+30 s</button>
          <button className="ghost" onClick={() => setRestEnd(null)}>Saltar</button>
        </div>
      )}

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(id) => {
            const ex = state.exercises.find((e) => e.id === id)
            if (ex) setEntries((entries) => [...entries, newEntry(ex, state.workouts, 3)])
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

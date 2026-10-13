import { useEffect, useState } from 'react'
import type { ExerciseLog, Workout } from '../types'
import { useStore } from '../lib/store'
import { fmtDuration } from '../lib/format'
import { ExercisePicker } from './ExercisePicker'
import { ExerciseCard } from './ExerciseCard'
import { newEntry, patchSet, swapEntry, swapInRoutine } from '../lib/workout'
import { readinessInfo } from './BeginWorkout'
import type { Exercise } from '../types'
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
    if (!set.done) rest.start(workout.entries[ei].target?.restSeconds)
  }

  /** Cambia un ejercicio por otro; pregunta si también en la rutina y avisa si se pierden series hechas. */
  const swap = async (ei: number, alt: Exercise) => {
    const entry = workout.entries[ei]
    if (entry.sets.some((s) => s.done)) {
      const ok = await dialog.confirm({
        message: 'Ya marcaste series de este ejercicio. Si lo cambias, esas series no se guardan. ¿Cambiar de todos modos?',
        confirmLabel: 'Cambiar',
        danger: true,
      })
      if (!ok) return
    }
    const routine = state.routines.find((r) => r.id === workout.routineId)
    const inRoutine = routine?.items.some((i) => i.exerciseId === entry.exerciseId)
    const alsoRoutine =
      inRoutine &&
      (await dialog.confirm({
        message: `¿Usar ${alt.name} en lugar de ${state.exercises.find((e) => e.id === entry.exerciseId)?.name ?? 'este ejercicio'} solo hoy, o también en tu rutina “${routine!.name}”?`,
        confirmLabel: 'También en la rutina',
        cancelLabel: 'Solo hoy',
      }))
    update((s) => ({
      ...s,
      active: s.active ? { ...s.active, entries: swapEntry(s.active.entries, ei, alt, s.workouts, s.active.readiness) } : s.active,
      routines: alsoRoutine ? s.routines.map((r) => (r.id === workout.routineId ? swapInRoutine(r, entry.exerciseId, alt) : r)) : s.routines,
    }))
  }

  const doneSets = workout.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)

  return (
    <div className="screen narrow">
      <header className="workout-head">
        <div>
          <h1>{workout.name}</h1>
          <span className="muted">
            {fmtDuration(now - new Date(workout.startedAt).getTime())} · {doneSets} series
            {readinessInfo(workout.readiness) && ` · ${readinessInfo(workout.readiness)!.emoji} ${readinessInfo(workout.readiness)!.label}`}
          </span>
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
          readiness={workout.readiness}
          onSwap={(alt) => swap(ei, alt)}
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

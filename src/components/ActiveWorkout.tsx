import { useEffect, useMemo, useState } from 'react'
import type { ExerciseLog, SetLog, Workout } from '../types'
import { useStore } from '../lib/store'
import { sessionsFor, suggest, isStalled } from '../lib/progression'
import { fmtClock, fmtDuration } from '../lib/format'
import { NumInput } from './NumInput'
import { ExercisePicker } from './ExercisePicker'
import { newEntry } from '../lib/workout'

/** Sobrevive a cambiar de pestaña (el componente se desmonta). */
let savedRestEnd: number | null = null

interface Props {
  workout: Workout
  onFinish: () => void
  onDiscard: () => void
}

export function ActiveWorkout({ workout, onFinish, onDiscard }: Props) {
  const { state, update } = useStore()
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

  const editSet = (ei: number, si: number, patch: Partial<SetLog>) =>
    setEntries((entries) =>
      entries.map((e, i) =>
        i !== ei ? e : { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) },
      ),
    )

  const toggleDone = (ei: number, si: number) => {
    const set = workout.entries[ei].sets[si]
    editSet(ei, si, { done: !set.done })
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
          onEditSet={(si, patch) => editSet(ei, si, patch)}
          onToggle={(si) => toggleDone(ei, si)}
          onAddSet={() =>
            setEntries((entries) =>
              entries.map((e, i) => {
                if (i !== ei) return e
                const last = e.sets.at(-1) ?? { weight: 0, reps: 0, done: false }
                return { ...e, sets: [...e.sets, { ...last, done: false }] }
              }),
            )
          }
          onRemoveSet={() =>
            setEntries((entries) => entries.map((e, i) => (i === ei ? { ...e, sets: e.sets.slice(0, -1) } : e)))
          }
          onRemove={() => {
            if (confirm('¿Quitar este ejercicio del entreno?')) setEntries((entries) => entries.filter((_, i) => i !== ei))
          }}
        />
      ))}

      <button className="secondary full" onClick={() => setPicking(true)}>+ Agregar ejercicio</button>
      <button className="danger-link" onClick={() => confirm('¿Descartar este entreno? Se perderá lo registrado.') && onDiscard()}>
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

interface CardProps {
  entry: ExerciseLog
  onEditSet: (si: number, patch: Partial<SetLog>) => void
  onToggle: (si: number) => void
  onAddSet: () => void
  onRemoveSet: () => void
  onRemove: () => void
}

function ExerciseCard({ entry, onEditSet, onToggle, onAddSet, onRemoveSet, onRemove }: CardProps) {
  const { state } = useStore()
  const ex = state.exercises.find((e) => e.id === entry.exerciseId)
  const sessions = useMemo(() => sessionsFor(entry.exerciseId, state.workouts), [entry.exerciseId, state.workouts])
  if (!ex) return null

  const tip = suggest(ex, sessions, entry.sets.length)
  const last = sessions.at(-1)
  const stalled = isStalled(sessions)

  return (
    <section className="card">
      <div className="card-head">
        <h3>{ex.name}</h3>
        <button className="icon" aria-label="Quitar ejercicio" onClick={onRemove}>✕</button>
      </div>
      <p className={`tip tip-${tip.kind}`}>{tip.text}</p>
      {stalled && (
        <p className="tip tip-deload">
          Llevas 3 sesiones sin mejorar en este ejercicio. Prueba un deload, cambiar el rango de reps o una variante.
        </p>
      )}
      {last && (
        <p className="muted small">
          Última vez: {last.sets.map((s) => (s.weight ? `${s.weight}×${s.reps}` : `${s.reps} reps`)).join(', ')}
        </p>
      )}
      <div className="sets">
        <div className="set-row set-header">
          <span>#</span><span>kg</span><span>reps</span><span />
        </div>
        {entry.sets.map((set, si) => (
          <div key={si} className={`set-row ${set.done ? 'is-done' : ''}`}>
            <span className="set-n">{si + 1}</span>
            <NumInput decimal ariaLabel={`Peso serie ${si + 1}`} placeholder="0" value={set.weight} onChange={(weight) => onEditSet(si, { weight })} />
            <NumInput ariaLabel={`Reps serie ${si + 1}`} placeholder="0" value={set.reps} onChange={(reps) => onEditSet(si, { reps })} />
            <button
              className={`check ${set.done ? 'on' : ''}`}
              aria-label={set.done ? 'Desmarcar serie' : 'Marcar serie hecha'}
              onClick={() => onToggle(si)}
            >
              ✓
            </button>
          </div>
        ))}
      </div>
      <div className="card-actions">
        <button className="ghost" onClick={onRemoveSet} disabled={!entry.sets.length}>− Serie</button>
        <button className="ghost" onClick={onAddSet}>+ Serie</button>
      </div>
    </section>
  )
}

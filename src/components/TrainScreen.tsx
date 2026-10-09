import { useState } from 'react'
import type { Routine, Workout } from '../types'
import { uid, useStore } from '../lib/store'
import { finishWorkout, startWorkout } from '../lib/workout'
import { fmtDate, fmtDuration } from '../lib/format'
import { ActiveWorkout } from './ActiveWorkout'
import { RoutineEditor } from './RoutineEditor'
import { useDialog } from './Dialog'
import { useRestTimer } from './RestTimer'
import { finishMessage, greeting, homeMessage } from '../lib/motivation'

export function TrainScreen() {
  const { state, update } = useStore()
  const dialog = useDialog()
  const rest = useRestTimer()
  const [editing, setEditing] = useState<Routine | null>(null)
  const [summary, setSummary] = useState<{ workout: Workout; prs: string[] } | null>(null)

  const nameOf = (id: string) => state.exercises.find((e) => e.id === id)?.name ?? '—'

  if (state.active) {
    return (
      <ActiveWorkout
        workout={state.active}
        onDiscard={() => update((s) => ({ ...s, active: null }))}
        onFinish={async () => {
          const active = state.active
          if (!active) return
          const result = finishWorkout(active, state.workouts, state.exercises)
          if (
            !result.workout.entries.length &&
            !(await dialog.confirm({
              message: 'No marcaste ninguna serie como hecha (✓), así que no hay nada que guardar. ¿Terminar de todos modos?',
              confirmLabel: 'Terminar sin guardar',
              cancelLabel: 'Seguir entrenando',
              danger: true,
            }))
          )
            return
          rest.stop()
          update((s) => ({
            ...s,
            active: null,
            workouts: result.workout.entries.length ? [...s.workouts, result.workout] : s.workouts,
          }))
          if (result.workout.entries.length) setSummary(result)
        }}
      />
    )
  }

  if (editing) {
    return (
      <RoutineEditor
        routine={editing}
        onClose={() => setEditing(null)}
        onSave={(r) => {
          update((s) => ({
            ...s,
            routines: s.routines.some((x) => x.id === r.id)
              ? s.routines.map((x) => (x.id === r.id ? r : x))
              : [...s.routines, r],
          }))
          setEditing(null)
        }}
        onDelete={() => {
          update((s) => ({ ...s, routines: s.routines.filter((x) => x.id !== editing.id) }))
          setEditing(null)
        }}
      />
    )
  }

  const lastByRoutine = new Map<string, string>()
  for (const w of state.workouts) if (w.routineId) lastByRoutine.set(w.routineId, w.startedAt)

  const { userName, namePrompted } = state.settings
  const finish = summary && finishMessage(userName, summary.prs.length, state.workouts.length)

  const begin = (routine: Routine | null) =>
    update((s) => ({ ...s, active: startWorkout(routine, s.exercises, s.workouts) }))

  return (
    <div className="screen">
      <header className="hello">
        <h1>{greeting(userName)}</h1>
        {/* El nombre ya va en el saludo: no lo repetimos en la frase */}
        <p className="muted">{homeMessage('', state.workouts)}</p>
      </header>

      {!namePrompted && <NamePrompt />}

      {summary && finish && (
        <section className="card summary">
          <h2>{finish.title}</h2>
          <p>{finish.subtitle}</p>
          <p className="muted">
            {summary.workout.name} · {fmtDuration(new Date(summary.workout.finishedAt!).getTime() - new Date(summary.workout.startedAt).getTime())} ·{' '}
            {summary.workout.entries.reduce((n, e) => n + e.sets.length, 0)} series
          </p>
          {summary.prs.length > 0 ? (
            <>
              <p><strong>🏆 Nuevos récords:</strong></p>
              <ul>{summary.prs.map((id) => <li key={id}>{nameOf(id)}</li>)}</ul>
            </>
          ) : null}
          <button className="ghost" onClick={() => setSummary(null)}>Cerrar</button>
        </section>
      )}

      {state.routines.map((r) => (
        <section key={r.id} className="card routine">
          <div className="card-head">
            <div>
              <h3>{r.name}</h3>
              <span className="muted small">
                {lastByRoutine.has(r.id) ? `Último: ${fmtDate(lastByRoutine.get(r.id)!)}` : 'Aún no la haces'}
              </span>
            </div>
            <button className="ghost" onClick={() => setEditing(r)}>Editar</button>
          </div>
          <p className="muted small">{r.items.map((i) => `${nameOf(i.exerciseId)} ${i.sets}×`).join(' · ')}</p>
          <button className="primary full" onClick={() => begin(r)} disabled={!r.items.length}>Empezar</button>
        </section>
      ))}

      <div className="row2">
        <button className="secondary" onClick={() => setEditing({ id: uid(), name: 'Nueva rutina', items: [] })}>
          + Nueva rutina
        </button>
        <button className="secondary" onClick={() => begin(null)}>Entreno libre</button>
      </div>
    </div>
  )
}

/** Pregunta el nombre una sola vez para personalizar los mensajes. */
function NamePrompt() {
  const { update } = useStore()
  const [name, setName] = useState('')
  const save = (userName: string) =>
    update((s) => ({ ...s, settings: { ...s.settings, userName: userName.trim().slice(0, 30), namePrompted: true } }))

  return (
    <form
      className="card name-prompt"
      onSubmit={(e) => {
        e.preventDefault()
        if (name.trim()) save(name)
      }}
    >
      <h3>¿Cómo te llamas?</h3>
      <p className="muted small">Para saludarte y celebrar tus logros contigo. Puedes cambiarlo en Ajustes.</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" maxLength={30} autoComplete="given-name" />
      <div className="actions">
        <button type="button" className="ghost" onClick={() => save('')}>Omitir</button>
        <button type="submit" className="primary" disabled={!name.trim()}>Guardar</button>
      </div>
    </form>
  )
}

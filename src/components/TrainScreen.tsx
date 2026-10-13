import { useState } from 'react'
import type { Routine, Workout } from '../types'
import { uid, useStore } from '../lib/store'
import { finishWorkout } from '../lib/workout'
import { useBeginWorkout } from './BeginWorkout'
import { fmtDate, fmtDuration } from '../lib/format'
import { ActiveWorkout } from './ActiveWorkout'
import { RoutineEditor } from './RoutineEditor'
import { useDialog } from './Dialog'
import { useRestTimer } from './RestTimer'
import { finishMessage } from '../lib/motivation'
import { fmtKcal, workoutKcal } from '../lib/calories'
import { fmtScheme, itemTarget, routineGoalInfo } from '../lib/goals'
import { metricOf } from '../lib/metric'
import { TemplatesSheet } from './Templates'
import { Dumbbell, LayoutTemplate, Plus, Zap } from 'lucide-react'

export function TrainScreen() {
  const { state, update } = useStore()
  const dialog = useDialog()
  const rest = useRestTimer()
  const [editing, setEditing] = useState<Routine | null>(null)
  const [templates, setTemplates] = useState(false)
  const starter = useBeginWorkout()
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

  const { userName } = state.settings
  const finish = summary && finishMessage(userName, summary.prs.length, state.workouts.length)

  const { begin } = starter

  return (
    <div className="screen">
      <header className="page-head">
        <h1>Pesas</h1>
        <p className="muted">Elige una rutina, arma la tuya o parte de una plantilla.</p>
      </header>


      {summary && finish && (
        <section className="card summary">
          <h2>{finish.title}</h2>
          <p>{finish.subtitle}</p>
          <p className="muted">
            {summary.workout.name} · {fmtDuration(new Date(summary.workout.finishedAt!).getTime() - new Date(summary.workout.startedAt).getTime())} ·{' '}
            {summary.workout.entries.reduce((n, e) => n + e.sets.length, 0)} series
            {workoutKcal(summary.workout, state.bodyweight) !== null && ` · 🔥 ${fmtKcal(workoutKcal(summary.workout, state.bodyweight))}`}
          </p>
          {!state.bodyweight.length && <p className="muted small">🔥 Registra tu peso corporal en <strong>Progreso</strong> para estimar las calorías.</p>}
          {summary.prs.length > 0 ? (
            <>
              <p><strong>🏆 Nuevos récords:</strong></p>
              <ul>{summary.prs.map((id) => <li key={id}>{nameOf(id)}</li>)}</ul>
            </>
          ) : null}
          <button className="ghost" onClick={() => setSummary(null)}>Cerrar</button>
        </section>
      )}

      {!state.routines.length && (
        <section className="card empty-card">
          <Dumbbell size={32} aria-hidden />
          <h3>Arma tu primera rutina</h3>
          <p className="muted small">Parte de una plantilla (fuerza, hipertrofia, powerbuilding o definición) o créala desde cero con tus ejercicios.</p>
          <div className="row2">
            <button className="primary" onClick={() => setTemplates(true)}>Ver plantillas</button>
            <button className="secondary" onClick={() => setEditing({ id: uid(), name: 'Nueva rutina', items: [] })}>Crear desde cero</button>
          </div>
          <button className="link" onClick={() => begin(null)}>O haz un entreno libre</button>
        </section>
      )}

      <div className="cards-grid">
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
          {r.goal && <span className={`goal-badge ${r.goal}`}>{routineGoalInfo(r.goal)?.emoji} {routineGoalInfo(r.goal)?.label}</span>}
          <ul className="routine-items">
            {r.items.map((i, k) => {
              const ex = state.exercises.find((e) => e.id === i.exerciseId)
              if (!ex) return null
              const t = itemTarget(i, ex, state.settings.restSeconds)
              return (
                <li key={k}>
                  <span>{ex.name}</span>
                  <span className={t.goal === 'strength' ? 'scheme strong' : 'scheme'}>{fmtScheme(i.sets, t, metricOf(ex))}</span>
                </li>
              )
            })}
          </ul>
          <button className="primary full" onClick={() => begin(r)} disabled={!r.items.length}>Empezar</button>
        </section>
      ))}
      </div>

      {state.routines.length > 0 && (
      <div className="actions-row">
        <button className="secondary" onClick={() => setEditing({ id: uid(), name: 'Nueva rutina', items: [] })}>
          <Plus size={18} aria-hidden /> Nueva rutina
        </button>
        <button className="secondary" onClick={() => setTemplates(true)}>
          <LayoutTemplate size={18} aria-hidden /> Plantillas
        </button>
        <button className="secondary" onClick={() => begin(null)}>
          <Zap size={18} aria-hidden /> Entreno libre
        </button>
      </div>
      )}

      {templates && <TemplatesSheet onClose={() => setTemplates(false)} />}
      {starter.sheet}
    </div>
  )
}

/** Pregunta el nombre una sola vez para personalizar los mensajes. */
export function NamePrompt() {
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

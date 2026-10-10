import { useState } from 'react'
import type { Workout } from '../types'
import { useStore } from '../lib/store'
import { fmtDate, fmtDuration, toYmd, withLocalDate } from '../lib/format'
import { startWorkout } from '../lib/workout'
import { useDialog } from './Dialog'
import { useNav } from '../lib/nav'
import { CalendarDays } from 'lucide-react'
import { fmtSet, metricOf } from '../lib/metric'
import { fmtKcal, workoutKcal } from '../lib/calories'
import { WorkoutLogEditor } from './WorkoutLogEditor'

export function HistoryScreen({ header, autoOpenPast = false }: { header?: React.ReactNode; autoOpenPast?: boolean }) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const nav = useNav()
  const [editing, setEditing] = useState<{ workout: Workout; isNew: boolean } | null>(null)
  const [creating, setCreating] = useState(autoOpenPast)
  const [saved, setSaved] = useState<{ name: string; prs: string[] } | null>(null)

  const nameOf = (id: string) => state.exercises.find((e) => e.id === id)?.name ?? '—'
  const workouts = [...state.workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))

  if (editing) {
    return (
      <WorkoutLogEditor
        workout={editing.workout}
        isNew={editing.isNew}
        onClose={() => setEditing(null)}
        onSaved={({ workout, prs }) => {
          setEditing(null)
          setSaved({ name: workout.name, prs })
          window.scrollTo(0, 0)
        }}
      />
    )
  }

  return (
    <div className="screen">
      {header}

      <button className="secondary full" onClick={() => setCreating(true)}>+ Registrar entreno pasado</button>

      {saved && (
        <section className="card summary">
          <p><strong>Entreno guardado: {saved.name}</strong></p>
          {saved.prs.length > 0 && <p>🏆 Récord en ese momento: {saved.prs.map(nameOf).join(', ')}</p>}
          <button className="ghost" onClick={() => setSaved(null)}>Cerrar</button>
        </section>
      )}

      {!workouts.length && (
        <section className="card empty-card">
          <CalendarDays size={32} aria-hidden />
          <h3>Tu historial empieza con tu primer entreno</h3>
          <p className="muted small">Cada entreno que termines aparecerá aquí. ¿Ya entrenaste antes de usar la app? Regístralo arriba.</p>
          <button className="primary" onClick={() => nav.go('gym')}>Ir a Pesas</button>
        </section>
      )}
      {workouts.map((w) => (
        <details key={w.id} className="card">
          <summary>
            <div>
              <h3>{w.name}</h3>
              <span className="muted small">
                {fmtDate(w.startedAt)}
                {w.finishedAt && ` · ${fmtDuration(new Date(w.finishedAt).getTime() - new Date(w.startedAt).getTime())}`}
                {` · ${w.entries.reduce((n, e) => n + e.sets.length, 0)} series`}
                {workoutKcal(w, state.bodyweight) !== null && ` · ${fmtKcal(workoutKcal(w, state.bodyweight))}`}
              </span>
            </div>
          </summary>
          {w.entries.map((e, i) => (
            <div key={i} className="history-line">
              <span>
                {nameOf(e.exerciseId)}
                {e.note && <span className="last-note"> · “{e.note}”</span>}
              </span>
              <span className="muted">
                {e.sets.map((s) => fmtSet(s, metricOf(state.exercises.find((x) => x.id === e.exerciseId)))).join('  ')}
              </span>
            </div>
          ))}
          <div className="card-actions">
            <button
              className="danger-link"
              onClick={async () => {
                if (await dialog.confirm({ message: '¿Eliminar este entreno del historial?', confirmLabel: 'Eliminar', danger: true }))
                  update((s) => ({ ...s, workouts: s.workouts.filter((x) => x.id !== w.id) }))
              }}
            >
              Eliminar
            </button>
            <button className="ghost" onClick={() => setEditing({ workout: w, isNew: false })}>Editar</button>
          </div>
        </details>
      ))}

      {creating && (
        <NewPastWorkoutSheet
          onClose={() => setCreating(false)}
          onStart={(workout) => {
            setCreating(false)
            setSaved(null)
            setEditing({ workout, isNew: true })
          }}
        />
      )}
    </div>
  )
}

function NewPastWorkoutSheet({ onClose, onStart }: { onClose: () => void; onStart: (w: Workout) => void }) {
  const { state } = useStore()
  const yesterday = new Date(Date.now() - 864e5)
  const [date, setDate] = useState(toYmd(yesterday))
  const [routineId, setRoutineId] = useState(state.routines[0]?.id ?? '')

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Entreno pasado</h2>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <div className="form">
          <label>
            ¿Qué día fue?
            <input type="date" value={date} max={toYmd(new Date())} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label>
            Rutina
            <select value={routineId} onChange={(e) => setRoutineId(e.target.value)}>
              {state.routines.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              <option value="">Entreno libre</option>
            </select>
          </label>
          <button
            className="primary full"
            disabled={!date}
            onClick={() => {
              // Hora por defecto 18:00 del día elegido
              const base = new Date()
              base.setHours(18, 0, 0, 0)
              const startedAt = withLocalDate(base.toISOString(), date)
              const routine = state.routines.find((r) => r.id === routineId) ?? null
              onStart(startWorkout(routine, state.exercises, state.workouts, startedAt, true))
            }}
          >
            Continuar
          </button>
        </div>
      </div>
    </div>
  )
}

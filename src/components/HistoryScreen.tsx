import { useStore } from '../lib/store'
import { fmtDate, fmtDuration } from '../lib/format'
import { useDialog } from './Dialog'

export function HistoryScreen() {
  const { state, update } = useStore()
  const dialog = useDialog()
  const nameOf = (id: string) => state.exercises.find((e) => e.id === id)?.name ?? '—'
  const workouts = [...state.workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt))

  return (
    <div className="screen">
      <h1>Historial</h1>
      {!workouts.length && (
        <div className="empty">
          <p>Sin entrenos todavía.</p>
          <p className="muted">Ve a Entrenar y empieza tu primera rutina.</p>
        </div>
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
              </span>
            </div>
          </summary>
          {w.entries.map((e, i) => (
            <div key={i} className="history-line">
              <span>{nameOf(e.exerciseId)}</span>
              <span className="muted">{e.sets.map((s) => (s.weight ? `${s.weight}×${s.reps}` : `${s.reps}`)).join('  ')}</span>
            </div>
          ))}
          <button
            className="danger-link"
            onClick={async () => {
              if (await dialog.confirm({ message: '¿Eliminar este entreno del historial?', confirmLabel: 'Eliminar', danger: true }))
                update((s) => ({ ...s, workouts: s.workouts.filter((x) => x.id !== w.id) }))
            }}
          >
            Eliminar entreno
          </button>
        </details>
      ))}
    </div>
  )
}

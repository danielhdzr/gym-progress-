import { useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import { bestSet, isBodyweight, isStalled, sessionsFor, weeklySets } from '../lib/progression'
import { fmtKg, fmtShortDate } from '../lib/format'
import { LineChart } from './LineChart'

/** Rango orientativo de series semanales por músculo para hipertrofia. */
const TARGET_MIN = 10
const TARGET_MAX = 20

export function ProgressScreen() {
  const { state } = useStore()

  const trained = useMemo(
    () =>
      state.exercises
        .map((ex) => ({ ex, sessions: sessionsFor(ex.id, state.workouts) }))
        .filter((x) => x.sessions.length)
        .sort((a, b) => b.sessions.at(-1)!.date.localeCompare(a.sessions.at(-1)!.date)),
    [state.exercises, state.workouts],
  )

  const [selected, setSelected] = useState<string>('')
  const current = trained.find((t) => t.ex.id === selected) ?? trained[0]
  const stalled = trained.filter((t) => isStalled(t.sessions))
  const weekly = weeklySets(state.workouts, state.exercises)
  const weeklyRows = Object.entries(weekly).sort((a, b) => b[1] - a[1])

  if (!trained.length) {
    return (
      <div className="screen">
        <h1>Progreso</h1>
        <div className="empty">
          <p>Aún no hay datos.</p>
          <p className="muted">Termina tu primer entreno y aquí verás tus gráficas, récords y alertas.</p>
        </div>
      </div>
    )
  }

  const bw = current && isBodyweight(current.sessions)
  const points = current.sessions.map((s) => ({ label: fmtShortDate(s.date), value: bestSet(s.sets).e1rm }))
  const first = points[0].value
  const lastVal = points.at(-1)!.value
  const change = first ? ((lastVal - first) / first) * 100 : 0
  const heaviest = Math.max(...current.sessions.flatMap((s) => s.sets.map((x) => x.weight)))
  const bestE1rm = Math.max(...points.map((p) => p.value))

  return (
    <div className="screen">
      <h1>Progreso</h1>

      {stalled.length > 0 && (
        <section className="card alert">
          <h3>⚠️ Estancados</h3>
          <p className="small">Sin mejorar en las últimas 3 sesiones:</p>
          <ul>{stalled.map((s) => <li key={s.ex.id}>{s.ex.name}</li>)}</ul>
          <p className="muted small">Prueba una semana de deload (−10% peso), cambiar el rango de reps o una variante del ejercicio.</p>
        </section>
      )}

      <section className="card">
        <select className="select-lg" value={current.ex.id} onChange={(e) => setSelected(e.target.value)} aria-label="Ejercicio">
          {trained.map((t) => <option key={t.ex.id} value={t.ex.id}>{t.ex.name}</option>)}
        </select>

        <div className="stats">
          <div>
            <span className="stat">{bw ? bestE1rm : fmtKg(Math.round(bestE1rm * 10) / 10)}</span>
            <span className="muted small">{bw ? 'Mejor reps' : '1RM estimado'}</span>
          </div>
          {!bw && (
            <div>
              <span className="stat">{fmtKg(heaviest)}</span>
              <span className="muted small">Peso máximo</span>
            </div>
          )}
          <div>
            <span className={`stat ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>
              {change > 0 ? '+' : ''}{change.toFixed(0)}%
            </span>
            <span className="muted small">desde el inicio</span>
          </div>
        </div>

        <LineChart points={points} unit={bw ? 'reps' : 'kg'} />
        <p className="muted small center">{bw ? 'Mejor serie (reps) por sesión' : '1RM estimado (Epley) de tu mejor serie por sesión'}</p>

        <div className="group-label">Últimas sesiones</div>
        {current.sessions.slice(-5).reverse().map((s) => (
          <div key={s.workoutId} className="history-line">
            <span>{fmtShortDate(s.date)}</span>
            <span className="muted">{s.sets.map((x) => (x.weight ? `${x.weight}×${x.reps}` : `${x.reps}`)).join('  ')}</span>
          </div>
        ))}
      </section>

      <section className="card">
        <h3>Series por músculo (7 días)</h3>
        <p className="muted small">Referencia: {TARGET_MIN}–{TARGET_MAX} series semanales por músculo.</p>
        {weeklyRows.length ? (
          weeklyRows.map(([muscle, n]) => (
            <div key={muscle} className="bar-row">
              <span className="bar-label">{muscle}</span>
              <div className="bar-track">
                <div className="bar-target" style={{ left: `${(TARGET_MIN / 25) * 100}%`, width: `${((TARGET_MAX - TARGET_MIN) / 25) * 100}%` }} />
                <div className={`bar-fill ${n < TARGET_MIN ? 'low' : n > TARGET_MAX ? 'high' : 'ok'}`} style={{ width: `${Math.min(n / 25, 1) * 100}%` }} />
              </div>
              <span className="bar-value">{n}</span>
            </div>
          ))
        ) : (
          <p className="muted small">No entrenaste en los últimos 7 días.</p>
        )}
      </section>
    </div>
  )
}

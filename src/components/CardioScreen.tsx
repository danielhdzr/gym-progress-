import { useEffect, useState } from 'react'
import type { CardioSession, CardioType } from '../types'
import { uid, useStore } from '../lib/store'
import {
  CARDIO_TYPES,
  cardioLabel,
  cardioPRs,
  fmtDurationClock,
  fmtKm,
  fmtPace,
  fmtSpeed,
  pace,
  pauseTimer,
  records,
  resumeTimer,
  speedKmh,
  startTimer,
  timerElapsedMs,
  weekSummary,
  weeklyKm,
} from '../lib/cardio'
import { fmtDate, fmtShortDate, toYmd, withLocalDate } from '../lib/format'
import { LineChart } from './LineChart'
import { NumInput } from './NumInput'
import { useDialog } from './Dialog'

type Draft = Omit<CardioSession, 'id'> & { id?: string; fromTimer?: boolean }

export function CardioScreen() {
  const { state, update } = useStore()
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saved, setSaved] = useState<{ session: CardioSession; prs: string[] } | null>(null)
  const sessions = [...state.cardio].sort((a, b) => b.date.localeCompare(a.date))

  const save = (d: Draft) => {
    const session: CardioSession = {
      id: d.id ?? uid(),
      type: d.type,
      date: d.date,
      distanceKm: d.distanceKm,
      durationMin: d.durationMin,
      note: d.note?.trim() || undefined,
    }
    update((s) => ({
      ...s,
      cardio: s.cardio.some((x) => x.id === session.id)
        ? s.cardio.map((x) => (x.id === session.id ? session : x))
        : [...s.cardio, session],
      cardioTimer: d.fromTimer ? null : s.cardioTimer,
    }))
    setSaved({ session, prs: cardioPRs(session, state.cardio) })
    setDraft(null)
    window.scrollTo(0, 0)
  }

  return (
    <div className="screen">
      <header className="hello">
        <h1>Cardio</h1>
        <p className="muted">Caminatas y carreras</p>
      </header>

      {saved && (
        <section className="card summary">
          <h2>{saved.prs.length ? '¡Nuevo récord! 🏆' : `¡${cardioLabel(saved.session.type).label} registrada! ${cardioLabel(saved.session.type).icon}`}</h2>
          <p>
            {fmtKm(saved.session.distanceKm)} · {fmtDurationClock(saved.session.durationMin)} · {fmtPace(pace(saved.session))} · {fmtSpeed(speedKmh(saved.session))}
          </p>
          {saved.prs.length > 0 && <ul>{saved.prs.map((p) => <li key={p}>{p}</li>)}</ul>}
          <button className="ghost" onClick={() => setSaved(null)}>Cerrar</button>
        </section>
      )}

      <TimerCard
        onFinish={(type, startedAt, minutes) =>
          setDraft({ type, date: startedAt, distanceKm: 0, durationMin: minutes, fromTimer: true })
        }
      />

      <button
        className="secondary full"
        onClick={() => setDraft({ type: 'walk', date: new Date().toISOString(), distanceKm: 0, durationMin: 0 })}
      >
        + Registrar manualmente
      </button>

      <WeekCard />

      {CARDIO_TYPES.map(({ id }) => <RecordsCard key={id} type={id} />)}

      {sessions.length > 0 && (
        <section className="card">
          <h3>Historial</h3>
          {sessions.slice(0, 15).map((s) => (
            <button key={s.id} className="cardio-row" onClick={() => setDraft({ ...s })}>
              <span className="cardio-icon" aria-hidden>{cardioLabel(s.type).icon}</span>
              <span className="grow">
                <strong>{fmtKm(s.distanceKm)}</strong> · {fmtDurationClock(s.durationMin)}
                <span className="muted small block">
                  {fmtDate(s.date)} · {fmtPace(pace(s))} · {fmtSpeed(speedKmh(s))}
                  {s.note && ` · “${s.note}”`}
                </span>
              </span>
              <span className="muted">›</span>
            </button>
          ))}
        </section>
      )}

      {draft && <CardioForm draft={draft} onClose={() => setDraft(null)} onSave={save} />}
    </div>
  )
}

/** Cronómetro: iniciar, pausar, reanudar y terminar. Guardado en el estado, sobrevive a cerrar la app. */
function TimerCard({ onFinish }: { onFinish: (type: CardioType, startedAt: string, minutes: number) => void }) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const timer = state.cardioTimer
  const [type, setType] = useState<CardioType>('walk')
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!timer || timer.runningSince === null) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [timer])

  if (!timer) {
    return (
      <section className="card">
        <h3>Cronómetro</h3>
        <TypePicker value={type} onChange={setType} />
        <button
          className="primary full big"
          onClick={() => {
            const t = Date.now()
            setNow(t)
            update((s) => ({ ...s, cardioTimer: startTimer(type, t) }))
          }}
        >
          ▶ Iniciar {cardioLabel(type).label.toLowerCase()}
        </button>
        <p className="muted small">Al terminar anotas los km (de tu reloj, una app o la caminadora).</p>
      </section>
    )
  }

  const running = timer.runningSince !== null
  const elapsed = timerElapsedMs(timer, now)
  const setTimer = (fn: typeof pauseTimer) => {
    const t = Date.now()
    setNow(t)
    update((s) => (s.cardioTimer ? { ...s, cardioTimer: fn(s.cardioTimer, t) } : s))
  }

  return (
    <section className="card timer-card">
      <h3>
        {cardioLabel(timer.type).icon} {cardioLabel(timer.type).label} {running ? 'en curso' : 'en pausa'}
      </h3>
      <div className={`timer-clock ${running ? '' : 'paused'}`} role="timer">{fmtDurationClock(elapsed / 60000)}</div>
      <div className="row2">
        {running ? (
          <button className="secondary" onClick={() => setTimer(pauseTimer)}>⏸ Pausar</button>
        ) : (
          <button className="secondary" onClick={() => setTimer(resumeTimer)}>▶ Reanudar</button>
        )}
        <button
          className="primary"
          onClick={() => {
            setTimer(pauseTimer)
            onFinish(timer.type, timer.startedAt, elapsed / 60000)
          }}
        >
          ■ Terminar
        </button>
      </div>
      <button
        className="danger-link"
        onClick={async () => {
          if (await dialog.confirm({ message: '¿Descartar este cronómetro?', confirmLabel: 'Descartar', danger: true }))
            update((s) => ({ ...s, cardioTimer: null }))
        }}
      >
        Descartar
      </button>
    </section>
  )
}

function TypePicker({ value, onChange }: { value: CardioType; onChange: (t: CardioType) => void }) {
  return (
    <div className="chips">
      {CARDIO_TYPES.map((t) => (
        <button key={t.id} type="button" className={`chip ${value === t.id ? 'on' : ''}`} aria-pressed={value === t.id} onClick={() => onChange(t.id)}>
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  )
}

function WeekCard() {
  const { state, update } = useStore()
  const [editingGoal, setEditingGoal] = useState(false)
  const week = weekSummary(state.cardio)
  const lastWeek = weekSummary(state.cardio, Date.now() - 7 * 24 * 60 * 60 * 1000)
  const goal = state.cardioGoalKm
  const weeks = weeklyKm(state.cardio)
  const pct = goal ? Math.min(100, (week.km / goal) * 100) : 0

  return (
    <section className="card">
      <div className="card-head">
        <h3>Esta semana</h3>
        <button className="ghost" onClick={() => setEditingGoal((v) => !v)}>{goal ? 'Meta' : '+ Meta'}</button>
      </div>
      <div className="stats">
        <div>
          <span className="stat">{fmtKm(week.km)}</span>
          <span className="muted small">{goal ? `de ${goal} km` : 'recorridos'}</span>
        </div>
        <div>
          <span className="stat">{week.sessions}</span>
          <span className="muted small">{week.sessions === 1 ? 'salida' : 'salidas'}</span>
        </div>
        <div>
          <span className="stat">{fmtDurationClock(week.minutes)}</span>
          <span className="muted small">tiempo</span>
        </div>
      </div>

      {goal > 0 && (
        <>
          <div className="goal-track" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div className={`goal-fill ${pct >= 100 ? 'done' : ''}`} style={{ width: `${pct}%` }} />
          </div>
          <p className="small center">
            {pct >= 100 ? '🎉 ¡Meta semanal cumplida!' : `Te faltan ${fmtKm(Math.round((goal - week.km) * 100) / 100)} para tu meta.`}
          </p>
        </>
      )}

      {editingGoal && (
        <label className="field inline">
          Meta semanal (km, 0 = sin meta)
          <NumInput decimal ariaLabel="Meta semanal en km" value={goal} onChange={(cardioGoalKm) => update((s) => ({ ...s, cardioGoalKm }))} />
        </label>
      )}

      {lastWeek.km > 0 && (
        <p className="muted small">
          Semana pasada: {fmtKm(lastWeek.km)}
          {week.km > lastWeek.km && ' · ¡ya la superaste! 💪'}
        </p>
      )}

      {weeks.some((w) => w.km > 0) && (
        <>
          <LineChart points={weeks.map((w) => ({ label: fmtShortDate(new Date(w.weekStart).toISOString()), value: w.km }))} unit="km" />
          <p className="muted small center">Km por semana (últimas 8)</p>
        </>
      )}
    </section>
  )
}

function RecordsCard({ type }: { type: CardioType }) {
  const { state } = useStore()
  const r = records(state.cardio, type)
  if (!r.longestKm) return null
  const { label, icon } = cardioLabel(type)
  return (
    <section className="card">
      <h3>{icon} Récords de {label.toLowerCase()}</h3>
      <div className="history-line">
        <span>Distancia más larga</span>
        <span>{fmtKm(r.longestKm.distanceKm)} <span className="muted small">{fmtShortDate(r.longestKm.date)}</span></span>
      </div>
      {r.longestTime && (
        <div className="history-line">
          <span>Más tiempo</span>
          <span>{fmtDurationClock(r.longestTime.durationMin)} <span className="muted small">{fmtShortDate(r.longestTime.date)}</span></span>
        </div>
      )}
      {r.bestPace && (
        <div className="history-line">
          <span>Más rápida</span>
          <span>{fmtPace(pace(r.bestPace))} <span className="muted small">({fmtSpeed(speedKmh(r.bestPace))}) {fmtShortDate(r.bestPace.date)}</span></span>
        </div>
      )}
    </section>
  )
}

function CardioForm({ draft, onClose, onSave }: { draft: Draft; onClose: () => void; onSave: (d: Draft) => void }) {
  const { update } = useStore()
  const dialog = useDialog()
  const [d, setD] = useState(draft)
  const totalSec = Math.round(d.durationMin * 60)
  const [min, sec] = [Math.floor(totalSec / 60), totalSec % 60]
  const setDuration = (m: number, s: number) => setD({ ...d, durationMin: m + s / 60 })
  const valid = d.distanceKm > 0 && d.durationMin > 0
  const isEdit = !!draft.id

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{isEdit ? 'Editar' : draft.fromTimer ? '¡Listo! Anota la distancia' : 'Registrar'}</h2>
          <button className="ghost" onClick={onClose}>Cerrar</button>
        </div>
        <form
          className="form sheet-body"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) onSave(d)
          }}
        >
          <TypePicker value={d.type} onChange={(type) => setD({ ...d, type })} />
          <div className="row2">
            <label>
              Distancia (km)
              <NumInput decimal ariaLabel="Distancia en km" placeholder="0" value={d.distanceKm} onChange={(distanceKm) => setD({ ...d, distanceKm })} />
            </label>
            <label>
              Fecha
              <input
                type="date"
                value={toYmd(d.date)}
                max={toYmd(new Date())}
                onChange={(e) => e.target.value && setD({ ...d, date: withLocalDate(d.date, e.target.value) })}
              />
            </label>
          </div>
          <div className="row2">
            <label>
              Minutos
              <NumInput ariaLabel="Minutos" placeholder="0" value={min} onChange={(m) => setDuration(m, sec)} />
            </label>
            <label>
              Segundos
              <NumInput ariaLabel="Segundos" placeholder="0" value={sec} onChange={(s) => setDuration(min, Math.min(59, s))} />
            </label>
          </div>
          <p className="pace-preview">Ritmo: <strong>{fmtPace(pace(d))}</strong> · Velocidad: <strong>{fmtSpeed(speedKmh(d))}</strong></p>
          <label>
            Nota (opcional)
            <input value={d.note ?? ''} placeholder="Ej. ruta del parque, con subidas" onChange={(e) => setD({ ...d, note: e.target.value })} />
          </label>
          <div className="actions">
            {isEdit && (
              <button
                type="button"
                className="danger-link"
                onClick={async () => {
                  if (await dialog.confirm({ message: '¿Eliminar este registro?', confirmLabel: 'Eliminar', danger: true })) {
                    update((s) => ({ ...s, cardio: s.cardio.filter((x) => x.id !== draft.id) }))
                    onClose()
                  }
                }}
              >
                Eliminar
              </button>
            )}
            <button type="submit" className="primary" disabled={!valid}>Guardar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

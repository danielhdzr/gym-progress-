import { useMemo, useState } from 'react'
import type { ExerciseLog, Workout } from '../types'
import { useStore } from '../lib/store'
import { isStalled, sessionsFor, suggestFor } from '../lib/progression'
import { ITEM_GOAL_LABEL, fmtRest, fmtScheme } from '../lib/goals'
import { addSet, patchSet, removeEntry, removeLastSet, setNote } from '../lib/workout'
import { fmtPlates, platesPerSide, warmupSets } from '../lib/tools'
import { fmtShortDate } from '../lib/format'
import { NumInput } from './NumInput'
import { fmtSet, metricOf, unitHeader } from '../lib/metric'
import { useDialog } from './Dialog'

type Entries = ExerciseLog[]

interface Props {
  entry: ExerciseLog
  index: number
  /** Entrenos anteriores a este, para sugerencias y "última vez" */
  history: Workout[]
  /** live: entreno en curso (marcar ✓ + descanso). log: registro/edición a posteriori. */
  mode: 'live' | 'log'
  setEntries: (fn: (entries: Entries) => Entries) => void
  onToggle?: (si: number) => void
}

export function ExerciseCard({ entry, index, history, mode, setEntries, onToggle }: Props) {
  const { state } = useStore()
  const dialog = useDialog()
  const [showTools, setShowTools] = useState(false)
  const [showNote, setShowNote] = useState(!!entry.note)
  const ex = state.exercises.find((e) => e.id === entry.exerciseId)
  const sessions = useMemo(() => sessionsFor(entry.exerciseId, history), [entry.exerciseId, history])
  if (!ex) return null

  const live = mode === 'live'
  const metric = metricOf(ex)
  const tip = suggestFor(ex, entry.target, history, entry.sets.length)
  const last = sessions.at(-1)
  const stalled = live && isStalled(sessions, metric)
  const working = Math.max(0, ...entry.sets.map((s) => s.weight))
  const { barWeight, plates } = state.settings

  return (
    <section className="card">
      <div className="card-head">
        <div>
          <h3>{ex.name}</h3>
          {entry.target && (
            <span className={`goal-tag ${entry.target.goal}`}>
              {ITEM_GOAL_LABEL[entry.target.goal]} · {fmtScheme(entry.sets.length, entry.target, metric)} · descanso {fmtRest(entry.target.restSeconds)}
            </span>
          )}
        </div>
        <button
          className="icon"
          aria-label="Quitar ejercicio"
          onClick={async () => {
            if (await dialog.confirm({ message: `¿Quitar ${ex.name} del entreno?`, confirmLabel: 'Quitar', danger: true }))
              setEntries((es) => removeEntry(es, index))
          }}
        >
          ✕
        </button>
      </div>

      {live && <p className={`tip tip-${tip.kind}`}>{tip.text}</p>}
      {stalled && (
        <p className="tip tip-deload">
          Llevas 3 sesiones sin mejorar en este ejercicio. Prueba un deload, cambiar el rango o una variante.
        </p>
      )}
      {last && (
        <p className="muted small">
          {live ? 'Última vez' : `Sesión anterior (${fmtShortDate(last.date)})`}: {last.sets.map((x) => fmtSet(x, metric)).join(', ')}
          {last.note && <span className="last-note"> · “{last.note}”</span>}
        </p>
      )}

      <div className={`sets ${live ? '' : 'no-check'}`}>
        <div className="set-row set-header">
          <span>#</span><span>kg</span><span>{unitHeader(metric)}</span><span>RPE</span>{live && <span />}
        </div>
        {entry.sets.map((set, si) => (
          <div key={si} className={`set-row ${live && set.done ? 'is-done' : ''}`}>
            <span className="set-n">{si + 1}</span>
            <NumInput decimal ariaLabel={`Peso serie ${si + 1}`} placeholder="0" value={set.weight} onChange={(weight) => setEntries((es) => patchSet(es, index, si, { weight }))} />
            <NumInput ariaLabel={`${metric === 'reps' ? 'Reps' : metric === 'seconds' ? 'Segundos' : 'Metros'} serie ${si + 1}`} placeholder="0" value={set.reps} onChange={(reps) => setEntries((es) => patchSet(es, index, si, { reps }))} />
            <NumInput
              decimal
              ariaLabel={`RPE serie ${si + 1}`}
              placeholder="–"
              value={set.rpe ?? 0}
              onChange={(n) => setEntries((es) => patchSet(es, index, si, { rpe: n > 0 ? Math.min(10, n) : undefined }))}
            />
            {live && (
              <button
                className={`check ${set.done ? 'on' : ''}`}
                aria-label={set.done ? 'Desmarcar serie' : 'Marcar serie hecha'}
                onClick={() => onToggle?.(si)}
              >
                ✓
              </button>
            )}
          </div>
        ))}
      </div>

      {showNote && (
        <textarea
          className="note"
          rows={2}
          placeholder="Ej. molestia en el hombro, agarre cerrado…"
          value={entry.note ?? ''}
          onChange={(e) => setEntries((es) => setNote(es, index, e.target.value))}
        />
      )}

      {showTools && (
        <div className="tools">
          {working > 0 ? (
            <>
              <div className="group-label">Calentamiento</div>
              {warmupSets(working, barWeight).map((w, i) => (
                <div key={i} className="tool-line">
                  <span>{w.weight} kg × {w.reps}</span>
                  <span className="muted">{fmtPlates(platesPerSide(w.weight, barWeight, plates))}</span>
                </div>
              ))}
              {!warmupSets(working, barWeight).length && <p className="muted small">Peso ligero: no hace falta rampa.</p>}
              <div className="group-label">Trabajo</div>
              <div className="tool-line">
                <strong>{working} kg</strong>
                <span>{fmtPlates(platesPerSide(working, barWeight, plates))}</span>
              </div>
              <p className="muted small">Discos por lado, barra de {barWeight} kg. Cámbialo en Ajustes.</p>
            </>
          ) : (
            <p className="muted small">Escribe el peso de trabajo para ver el calentamiento y los discos.</p>
          )}
        </div>
      )}

      <div className="card-actions">
        <button className="ghost" onClick={() => setEntries((es) => removeLastSet(es, index))} disabled={!entry.sets.length}>− Serie</button>
        <button className={`ghost ${showTools ? 'on' : ''}`} onClick={() => setShowTools((v) => !v)} aria-pressed={showTools}>🔥 Discos</button>
        <button className={`ghost ${showNote ? 'on' : ''}`} onClick={() => setShowNote((v) => !v)} aria-pressed={showNote}>📝 Nota</button>
        <button className="ghost" onClick={() => setEntries((es) => addSet(es, index))}>+ Serie</button>
      </div>
    </section>
  )
}

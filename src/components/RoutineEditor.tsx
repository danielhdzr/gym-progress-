import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, X } from 'lucide-react'
import type { Exercise, ItemGoal, Routine, RoutineGoal, RoutineItem, Target } from '../types'
import { useStore } from '../lib/store'
import { metricOf, unitHeader } from '../lib/metric'
import { GOAL_DEFAULTS, ITEM_GOAL_LABEL, REST_OPTIONS, ROUTINE_GOALS, defaultTarget, fmtRest, fmtScheme, itemTarget, routineGoalInfo } from '../lib/goals'
import { ExercisePicker } from './ExercisePicker'
import { NumInput } from './NumInput'
import { Help } from './Help'
import { useDialog } from './Dialog'

interface Props {
  routine: Routine
  onSave: (r: Routine) => void
  onDelete: () => void
  onClose: () => void
}

/** Objetivo de un ejercicio nuevo según el objetivo de la rutina (en powerbuilding, el primero va a fuerza). */
const goalForNew = (routineGoal: RoutineGoal | undefined, index: number): ItemGoal =>
  routineGoal === 'strength' || (routineGoal === 'powerbuilding' && index === 0) ? 'strength' : 'hypertrophy'

export function RoutineEditor({ routine, onSave, onDelete, onClose }: Props) {
  const { state } = useStore()
  const dialog = useDialog()
  const [draft, setDraft] = useState(routine)
  const [picking, setPicking] = useState(false)
  const [open, setOpen] = useState<number | null>(null)
  const exists = state.routines.some((r) => r.id === routine.id)
  const exOf = (id: string) => state.exercises.find((e) => e.id === id)

  const setItems = (fn: (items: RoutineItem[]) => RoutineItem[]) => setDraft((d) => ({ ...d, items: fn(d.items) }))
  const patchItem = (i: number, patch: Partial<RoutineItem>) => setItems((its) => its.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir
    if (j < 0 || j >= draft.items.length) return
    setItems((items) => {
      const copy = [...items]
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
      return copy
    })
    setOpen((o) => (o === i ? j : o === j ? i : o))
  }

  /** Corrige rangos inválidos (mín > máx, ceros) antes de guardar. */
  const save = () =>
    onSave({
      ...draft,
      name: draft.name.trim() || 'Rutina',
      items: draft.items.map((item) => {
        if (!item.target) return item
        const repMin = Math.max(1, item.target.repMin)
        return { ...item, target: { ...item.target, repMin, repMax: Math.max(repMin, item.target.repMax) } }
      }),
    })

  const changeGoal = async (goal: RoutineGoal) => {
    if (goal === draft.goal) return
    const apply =
      draft.items.length > 0 &&
      (await dialog.confirm({
        message: `¿Ajustar los ${draft.items.length} ejercicios a ${routineGoalInfo(goal)!.label}? Se cambian series, reps y descansos. ${goal === 'powerbuilding' ? 'El primero irá a fuerza y el resto a hipertrofia.' : ''}`,
        confirmLabel: 'Ajustar ejercicios',
        cancelLabel: 'Solo cambiar el objetivo',
      }))
    setDraft((d) => ({
      ...d,
      goal,
      items: apply
        ? d.items.map((item, i) => {
            const target = defaultTarget(goalForNew(goal, i), goal, exOf(item.exerciseId))
            return { ...item, sets: GOAL_DEFAULTS[target.goal].sets, target }
          })
        : d.items,
    }))
  }

  return (
    <div className="screen narrow">
      <header className="workout-head">
        <button className="ghost" onClick={onClose}>‹ Volver</button>
        <button className="primary" onClick={save}>
          Guardar
        </button>
      </header>

      <input className="title-input" value={draft.name} aria-label="Nombre de la rutina" onChange={(e) => setDraft({ ...draft, name: e.target.value })} />

      <section className="card">
        <h3>Objetivo de la rutina</h3>
        <div className="chips">
          {ROUTINE_GOALS.map((g) => (
            <button key={g.id} className={`chip ${draft.goal === g.id ? 'on' : ''}`} aria-pressed={draft.goal === g.id} onClick={() => changeGoal(g.id)}>
              {g.emoji} {g.label}
            </button>
          ))}
        </div>
        <p className="muted small">
          {routineGoalInfo(draft.goal)?.description ?? 'Elige un objetivo para que los ejercicios nuevos tengan reps y descansos adecuados. Siempre puedes ajustar cada ejercicio.'}
        </p>
      </section>

      {draft.items.map((item, i) => {
        const ex = exOf(item.exerciseId)
        if (!ex) return null
        const t = itemTarget(item, ex, state.settings.restSeconds)
        const isOpen = open === i
        return (
          <div key={`${item.exerciseId}-${i}`} className={`card item-card ${isOpen ? 'open' : ''}`}>
            <div className="item-row">
              <div className="reorder">
                <button className="icon" aria-label="Subir" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp size={16} aria-hidden /></button>
                <button className="icon" aria-label="Bajar" onClick={() => move(i, 1)} disabled={i === draft.items.length - 1}><ArrowDown size={16} aria-hidden /></button>
              </div>
              <button className="item-main" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}>
                <span className="item-name">{ex.name}</span>
                <span className={`goal-tag ${t.goal}`}>
                  {ITEM_GOAL_LABEL[t.goal]} · {fmtScheme(item.sets, t, metricOf(ex))} · {fmtRest(t.restSeconds)}
                </span>
              </button>
              <ChevronDown size={18} className={isOpen ? 'flip' : ''} aria-hidden />
              <button className="icon" aria-label={`Quitar ${ex.name}`} onClick={() => setItems((its) => its.filter((_, j) => j !== i))}>
                <X size={16} aria-hidden />
              </button>
            </div>
            {isOpen && <TargetEditor ex={ex} sets={item.sets} target={t} routineGoal={draft.goal} onChange={(sets, target) => patchItem(i, { sets, target })} />}
          </div>
        )
      })}

      {!draft.items.length && <p className="muted center">Agrega ejercicios a esta rutina.</p>}

      <button className="secondary full" onClick={() => setPicking(true)}>+ Agregar ejercicio</button>
      {exists && (
        <button
          className="danger-link"
          onClick={async () => {
            if (await dialog.confirm({ message: `¿Eliminar la rutina “${routine.name}”?`, confirmLabel: 'Eliminar', danger: true })) onDelete()
          }}
        >
          Eliminar rutina
        </button>
      )}

      {picking && (
        <ExercisePicker
          onClose={() => setPicking(false)}
          onPick={(ex) => {
            const target = defaultTarget(goalForNew(draft.goal, draft.items.length), draft.goal, ex)
            setItems((items) => [...items, { exerciseId: ex.id, sets: GOAL_DEFAULTS[target.goal].sets, target }])
            setOpen(draft.items.length)
            setPicking(false)
          }}
        />
      )}
    </div>
  )
}

/** Ajustes de un ejercicio dentro de la rutina: fuerza/hipertrofia, series, reps y descanso. */
function TargetEditor({
  ex,
  sets,
  target,
  routineGoal,
  onChange,
}: {
  ex: Exercise
  sets: number
  target: Target
  routineGoal?: RoutineGoal
  onChange: (sets: number, t: Target) => void
}) {
  const unit = unitHeader(metricOf(ex))
  const set = (patch: Partial<Target>) => onChange(sets, { ...target, ...patch })

  return (
    <div className="target-editor">
      {metricOf(ex) === 'reps' && (
        <div className="segmented-row">
        <div className="segmented" role="radiogroup" aria-label="Tipo de trabajo">
          {(['strength', 'hypertrophy'] as ItemGoal[]).map((g) => (
            <button
              key={g}
              role="radio"
              aria-checked={target.goal === g}
              className={target.goal === g ? 'on' : ''}
              onClick={() => target.goal !== g && onChange(GOAL_DEFAULTS[g].sets, defaultTarget(g, routineGoal, ex))}
            >
              {ITEM_GOAL_LABEL[g]}
            </button>
          ))}
        </div>
        <Help topic="goal" />
        </div>
      )}
      <p className="muted small">
        {target.goal === 'strength'
          ? 'Fuerza: pocas reps pesadas. Al completar todas las series, la app sube el peso.'
          : 'Hipertrofia: busca más reps cada vez; al llegar al máximo en todas las series, sube el peso.'}
      </p>
      <div className="row3">
        <label className="field">
          Series
          <NumInput ariaLabel="Series" value={sets} onChange={(n) => onChange(Math.min(10, Math.max(1, n || 1)), target)} />
        </label>
        <label className="field">
          {unit} mín
          <NumInput ariaLabel={`Mínimo de ${unit}`} value={target.repMin} onChange={(n) => set({ repMin: n, repMax: Math.max(n, target.repMax) })} />
        </label>
        <label className="field">
          {unit} máx
          <NumInput ariaLabel={`Máximo de ${unit}`} value={target.repMax} onChange={(n) => set({ repMax: n })} />
        </label>
      </div>
      <div className="field">
        Descanso entre series
        <div className="chips">
          {REST_OPTIONS.map((s) => (
            <button key={s} className={`chip mini ${target.restSeconds === s ? 'on' : ''}`} aria-pressed={target.restSeconds === s} onClick={() => set({ restSeconds: s })}>
              {fmtRest(s)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

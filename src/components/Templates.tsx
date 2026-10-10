import { useState } from 'react'
import { X } from 'lucide-react'
import type { AppState } from '../types'
import { useStore } from '../lib/store'
import { TEMPLATES, buildRoutines, type Template } from '../lib/templates'
import { fmtScheme, routineGoalInfo } from '../lib/goals'
import { metricOf } from '../lib/metric'
import { useDialog } from './Dialog'

/** Aplica una plantilla: agrega sus rutinas (o reemplaza las actuales) y, en definición, propone una meta de cardio. */
export function applyTemplate(s: AppState, t: Template, replace: boolean): AppState {
  const routines = buildRoutines(t, s.exercises)
  return {
    ...s,
    routines: replace ? routines : [...s.routines, ...routines],
    cardioGoalKm: t.cardioKm && !s.cardioGoalKm ? t.cardioKm : s.cardioGoalKm,
  }
}

export function TemplateCard({ t, recommended, onUse }: { t: Template; recommended?: boolean; onUse: () => void }) {
  const { state } = useStore()
  const goal = routineGoalInfo(t.goal)!
  const first = t.routines[0]
  // Rutina real del primer día, para mostrar el esquema exacto de cada ejercicio
  const preview = buildRoutines({ ...t, routines: [first] }, state.exercises)[0]
  return (
    <section className={`card template ${recommended ? 'recommended' : ''}`}>
      {recommended && <span className="badge">Recomendada para ti</span>}
      <div className="card-head">
        <div>
          <h3>{t.name}</h3>
          <span className="muted small">{goal.emoji} {goal.label} · {t.days}</span>
        </div>
      </div>
      <p className="small">{t.description}</p>
      <p className="muted small">
        {first.name}:{' '}
        {preview.items
          .map((i) => {
            const ex = state.exercises.find((e) => e.id === i.exerciseId)!
            return `${ex.name} ${fmtScheme(i.sets, i.target!, metricOf(ex))}`
          })
          .join(' · ')}
      </p>
      <button className="primary full" onClick={onUse}>Usar esta plantilla</button>
    </section>
  )
}

export function TemplatesSheet({ onClose }: { onClose: () => void }) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const [replace, setReplace] = useState(false)

  const use = async (t: Template) => {
    const n = t.routines.length
    if (replace && state.routines.length) {
      const ok = await dialog.confirm({
        message: `Se borrarán tus ${state.routines.length} rutinas actuales y se crearán ${n} de “${t.name}”. Tu historial no se toca. ¿Continuar?`,
        confirmLabel: 'Reemplazar',
        danger: true,
      })
      if (!ok) return
    }
    update((s) => applyTemplate(s, t, replace))
    onClose()
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet tall" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Plantillas</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <p className="muted small">Rutinas listas para empezar. Después puedes editarlas como quieras.</p>
        <label className="check-row">
          <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
          Reemplazar mis rutinas actuales (si no, se agregan)
        </label>
        <div className="sheet-body templates-list">
          {TEMPLATES.map((t) => <TemplateCard key={t.id} t={t} onUse={() => use(t)} />)}
        </div>
      </div>
    </div>
  )
}

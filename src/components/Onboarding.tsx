import { useState } from 'react'
import { Dumbbell, Flame, Footprints, Layers, Sparkles, type LucideIcon } from 'lucide-react'
import type { UserGoal } from '../types'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { recommendTemplates, type Template } from '../lib/templates'
import { applyTemplate, TemplateCard } from './Templates'

const GOALS: { id: UserGoal; label: string; hint: string; Icon: LucideIcon }[] = [
  { id: 'strength', label: 'Ganar fuerza', hint: 'Levantar más peso en los básicos', Icon: Dumbbell },
  { id: 'muscle', label: 'Ganar músculo', hint: 'Hipertrofia: más tamaño', Icon: Sparkles },
  { id: 'cut', label: 'Definir', hint: 'Perder grasa conservando músculo', Icon: Flame },
  { id: 'cardio', label: 'Caminar o correr', hint: 'Cardio y metas de km', Icon: Footprints },
  { id: 'mixed', label: 'Un poco de todo', hint: 'Fuerza, músculo y cardio', Icon: Layers },
]

/** Bienvenida de 3 pasos: objetivo, nombre y días, y rutina inicial. Se puede omitir. */
export function Onboarding() {
  const { state, update } = useStore()
  const nav = useNav()
  const [step, setStep] = useState(0)
  const [goal, setGoal] = useState<UserGoal | null>(null)
  const [name, setName] = useState(state.settings.userName)
  const [days, setDays] = useState(3)

  const finish = (template: Template | null, keepExamples = false) => {
    update((s) => {
      let next = {
        ...s,
        settings: { ...s.settings, onboarded: true, goal, userName: name.trim().slice(0, 30), namePrompted: true, weeklyGoalDays: days },
        cardioGoalKm: goal === 'cardio' && !s.cardioGoalKm ? 10 : s.cardioGoalKm,
      }
      if (template) next = applyTemplate(next, template, true)
      else if (!keepExamples) next = { ...next, routines: [] }
      return next
    })
    nav.go(goal === 'cardio' && !template ? 'cardio' : template || keepExamples ? 'home' : 'gym')
  }

  const skip = () => update((s) => ({ ...s, settings: { ...s.settings, onboarded: true } }))
  const recommended = recommendTemplates(goal, days).slice(0, 3)

  return (
    <div className="onboarding" role="dialog" aria-modal="true" aria-label="Bienvenida">
      <div className="onboarding-inner">
        <div className="steps" aria-hidden>
          {[0, 1, 2].map((i) => <span key={i} className={i <= step ? 'on' : ''} />)}
        </div>
        <p className="muted small center">Paso {step + 1} de 3</p>

        {step === 0 && (
          <>
            <h1 className="center">¿Qué quieres lograr?</h1>
            <p className="muted center">Así te mostramos lo que más te sirve. Puedes cambiarlo después.</p>
            <div className="goal-options">
              {GOALS.map(({ id, label, hint, Icon }) => (
                <button key={id} className={`goal-option ${goal === id ? 'on' : ''}`} aria-pressed={goal === id} onClick={() => setGoal(id)}>
                  <Icon aria-hidden />
                  <span>
                    <strong>{label}</strong>
                    <span className="muted small block">{hint}</span>
                  </span>
                </button>
              ))}
            </div>
            {goal === 'cut' && (
              <p className="note-box small">
                💡 Definir depende sobre todo de la alimentación (un déficit calórico). La app te ayuda con el entrenamiento para conservar músculo y con el cardio, pero no lleva tu dieta.
              </p>
            )}
            <button className="primary full big" disabled={!goal} onClick={() => setStep(1)}>Continuar</button>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="center">Cuéntanos de ti</h1>
            <label className="field">
              ¿Cómo te llamas?
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" maxLength={30} autoComplete="given-name" />
            </label>
            <div className="field">
              ¿Cuántos días por semana puedes entrenar?
              <div className="chips">
                {[2, 3, 4, 5, 6].map((n) => (
                  <button key={n} className={`chip ${days === n ? 'on' : ''}`} aria-pressed={days === n} onClick={() => setDays(n)}>
                    {n} días
                  </button>
                ))}
              </div>
            </div>
            <p className="muted small">Será tu meta semanal en "Tu semana". La cambias cuando quieras.</p>
            <div className="row2">
              <button className="secondary" onClick={() => setStep(0)}>Atrás</button>
              <button className="primary" onClick={() => setStep(2)}>Continuar</button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="center">Elige cómo empezar</h1>
            <p className="muted center">Podrás editar cualquier rutina o crear las tuyas cuando quieras.</p>
            {goal === 'cardio' && (
              <button className="secondary full" onClick={() => finish(null, true)}>Solo cardio por ahora</button>
            )}
            <div className="templates-list">
              {recommended.map((t, i) => <TemplateCard key={t.id} t={t} recommended={i === 0} onUse={() => finish(t)} />)}
            </div>
            <button className="secondary full" onClick={() => finish(null)}>Armaré mis propias rutinas</button>
            <button className="ghost full" onClick={() => setStep(1)}>Atrás</button>
          </>
        )}

        <button className="link center skip" onClick={skip}>Omitir</button>
      </div>
    </div>
  )
}

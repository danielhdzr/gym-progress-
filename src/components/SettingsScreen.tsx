import { useRef, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import type { CountryCode, Exercise, Settings } from '../types'
import { parseState, useStore } from '../lib/store'
import { ALL_PLATES, defaultState } from '../lib/defaults'
import { NumInput } from './NumInput'
import { useDialog } from './Dialog'
import { playRestDone, unlockAudio } from '../lib/sound'
import { ExerciseForm } from './ExercisePicker'
import { metricOf, unitHeader } from '../lib/metric'
import { COUNTRIES } from '../lib/occasions'
import { ACCENTS, accentInfo } from '../lib/accents'
import { toYmd } from '../lib/format'

export function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const { state, update } = useStore()
  const dialog = useDialog()
  const fileRef = useRef<HTMLInputElement>(null)
  const [editingEx, setEditingEx] = useState<Exercise | null>(null)
  const setSetting = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  const firstWorkout = state.workouts.filter((w) => w.finishedAt).map((w) => w.startedAt).sort()[0]
  const firstWorkoutYmd = firstWorkout ? toYmd(firstWorkout) : ''

  const editExercise = (id: string, patch: Partial<Exercise>) =>
    update((s) => ({ ...s, exercises: s.exercises.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gym-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importData = async (file: File) => {
    try {
      const next = parseState(await file.text())
      const ok = await dialog.confirm({
        message: `Esto reemplaza tus datos actuales con ${next.workouts.length} entrenos del respaldo. ¿Continuar?`,
        confirmLabel: 'Importar',
      })
      if (ok) {
        update(() => next)
      }
    } catch (err) {
      await dialog.alert(`No se pudo importar: ${(err as Error).message}`)
    }
  }

  return (
    <div className="screen narrow">
      <header className="page-head with-back">
        {onBack && (
          <button className="icon-btn" onClick={onBack} aria-label="Volver">
            <ArrowLeft aria-hidden />
          </button>
        )}
        <h1>Ajustes</h1>
      </header>

      <section className="card">
        <label className="field">
          Tu nombre
          <input
            value={state.settings.userName}
            placeholder="Para los saludos y mensajes de ánimo"
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) =>
              update((s) => ({ ...s, settings: { ...s.settings, userName: e.target.value, namePrompted: true } }))
            }
          />
        </label>
      </section>

      <section className="card">
        <h3>Apariencia</h3>
        <div className="field">
          Color de la app
          <div className="swatches" role="radiogroup" aria-label="Color de la app">
            {ACCENTS.map((c) => (
              <button
                key={c.id}
                role="radio"
                aria-checked={state.settings.accent === c.id}
                aria-label={c.name}
                title={c.name}
                className={`swatch ${state.settings.accent === c.id ? 'on' : ''}`}
                style={{ '--sw-dark': c.dark[0], '--sw-light': c.light[0] } as React.CSSProperties}
                onClick={() => setSetting({ accent: c.id })}
              />
            ))}
          </div>
        </div>
        <p className="muted small">
          {accentInfo(state.settings.accent).name}
          {state.settings.seasonalThemes && ' · En fechas especiales se usa el color de temporada.'}
        </p>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Temas de temporada</h3>
            <p className="muted small">Colores y mensajes según la hora, la estación y fechas especiales.</p>
          </div>
          <button
            className={`switch ${state.settings.seasonalThemes ? 'on' : ''}`}
            role="switch"
            aria-checked={state.settings.seasonalThemes}
            aria-label="Temas de temporada"
            onClick={() => setSetting({ seasonalThemes: !state.settings.seasonalThemes })}
          />
        </div>
        <label className="field">
          País (festivos y estaciones)
          <select value={state.settings.country} onChange={(e) => setSetting({ country: e.target.value as CountryCode })}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </label>
        <div className="row2">
          <label className="field">
            🎂 Tu cumpleaños
            <input type="date" value={state.settings.birthday} max={toYmd(new Date())} onChange={(e) => setSetting({ birthday: e.target.value })} />
          </label>
          <label className="field">
            🏋️ Empecé a entrenar
            <input type="date" value={state.settings.trainingStart || firstWorkoutYmd} max={toYmd(new Date())} onChange={(e) => setSetting({ trainingStart: e.target.value })} />
          </label>
        </div>
        <p className="muted small">
          Te felicitaremos en tu cumpleaños, cada mes que cumplas entrenando y en tu aniversario.
          {!state.settings.trainingStart && firstWorkoutYmd && ' Por ahora se usa la fecha de tu primer entreno registrado.'}
        </p>
      </section>

      <section className="card">
        <h3>Descanso entre series</h3>
        <div className="chips">
          {[60, 90, 120, 180, 240].map((s) => (
            <button
              key={s}
              className={`chip ${state.settings.restSeconds === s ? 'on' : ''}`}
              onClick={() => update((st) => ({ ...st, settings: { ...st.settings, restSeconds: s } }))}
            >
              {s < 120 ? `${s} s` : `${s / 60} min`}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <div>
            <h3>Sonido al terminar el descanso</h3>
            <p className="muted small">En iPhone no suena si el interruptor de silencio está activado.</p>
          </div>
          <button
            className={`switch ${state.settings.restSound ? 'on' : ''}`}
            role="switch"
            aria-checked={state.settings.restSound}
            aria-label="Sonido al terminar el descanso"
            onClick={() => update((s) => ({ ...s, settings: { ...s.settings, restSound: !s.settings.restSound } }))}
          />
        </div>
        <button
          className="secondary"
          onClick={() => {
            unlockAudio()
            playRestDone()
          }}
        >
          🔊 Probar sonido
        </button>
      </section>

      <section className="card">
        <h3>Barra y discos</h3>
        <p className="muted small">Para la calculadora de discos y las series de calentamiento.</p>
        <label className="field inline">
          Peso de la barra (kg)
          <NumInput
            decimal
            ariaLabel="Peso de la barra"
            value={state.settings.barWeight}
            onChange={(barWeight) => update((s) => ({ ...s, settings: { ...s.settings, barWeight } }))}
          />
        </label>
        <div className="group-label">Discos disponibles</div>
        <div className="chips">
          {ALL_PLATES.map((p) => {
            const on = state.settings.plates.includes(p)
            return (
              <button
                key={p}
                className={`chip ${on ? 'on' : ''}`}
                aria-pressed={on}
                onClick={() =>
                  update((s) => ({
                    ...s,
                    settings: {
                      ...s.settings,
                      plates: on ? s.settings.plates.filter((x) => x !== p) : [...s.settings.plates, p],
                    },
                  }))
                }
              >
                {p}
              </button>
            )
          })}
        </div>
      </section>

      <section className="card">
        <h3>Ejercicios</h3>
        <p className="muted small">
          Meta (reps, segundos o metros) y cuánto subir de peso. Toca un ejercicio para cambiar su nombre, músculo o unidad.
        </p>
        <div className="ex-table">
          <div className="ex-row ex-header"><span>Ejercicio</span><span>Mín</span><span>Máx</span><span>+kg</span></div>
          {state.exercises.map((e) => (
            <div key={e.id} className="ex-row">
              <button className="ex-name small" onClick={() => setEditingEx(e)} aria-label={`Editar ${e.name}`}>
                {e.name}
                {metricOf(e) !== 'reps' && <span className="muted"> ({unitHeader(metricOf(e))})</span>}
                <span className="muted"> ›</span>
              </button>
              <NumInput ariaLabel={`Meta mínima ${e.name}`} value={e.repMin} onChange={(n) => editExercise(e.id, { repMin: n })} />
              <NumInput ariaLabel={`Meta máxima ${e.name}`} value={e.repMax} onChange={(n) => editExercise(e.id, { repMax: n })} />
              <NumInput decimal ariaLabel={`Incremento ${e.name}`} value={e.increment} onChange={(n) => editExercise(e.id, { increment: n })} />
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <h3>Tus datos</h3>
        <p className="muted small">
          Todo se guarda solo en este dispositivo. Exporta un respaldo de vez en cuando para no perder tu historial.
        </p>
        <div className="row2">
          <button className="secondary" onClick={exportData}>Exportar respaldo</button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>Importar</button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) importData(f)
            e.target.value = ''
          }}
        />
        <button
          className="danger-link"
          onClick={async () => {
            if (await dialog.confirm({ message: '¿Borrar TODOS tus datos? Esto no se puede deshacer.', confirmLabel: 'Borrar todo', danger: true }))
              update(() => defaultState())
          }}
        >
          Borrar todos los datos
        </button>
      </section>

      <p className="muted small center">Gym Progress · v1.0</p>

      {editingEx && (
        <div className="sheet-backdrop" onClick={() => setEditingEx(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Editar ejercicio</h2>
            </div>
            <div className="sheet-body">
              <ExerciseForm
                initial={editingEx}
                onCancel={() => setEditingEx(null)}
                onSave={(ex) => {
                  editExercise(ex.id, ex)
                  setEditingEx(null)
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

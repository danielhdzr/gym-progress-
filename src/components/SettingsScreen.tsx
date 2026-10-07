import { useRef } from 'react'
import type { Exercise } from '../types'
import { parseState, useStore } from '../lib/store'
import { defaultState } from '../lib/defaults'
import { NumInput } from './NumInput'
import { useDialog } from './Dialog'

export function SettingsScreen() {
  const { state, update } = useStore()
  const dialog = useDialog()
  const fileRef = useRef<HTMLInputElement>(null)

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
    <div className="screen">
      <h1>Ajustes</h1>

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
        <h3>Ejercicios</h3>
        <p className="muted small">
          Rango de reps y cuánto subir de peso. Cuando completas el máximo de reps en todas las series, la app te sugiere subir.
        </p>
        <div className="ex-table">
          <div className="ex-row ex-header"><span>Ejercicio</span><span>Mín</span><span>Máx</span><span>+kg</span></div>
          {state.exercises.map((e) => (
            <div key={e.id} className="ex-row">
              <span className="small">{e.name}</span>
              <NumInput ariaLabel={`Reps mínimas ${e.name}`} value={e.repMin} onChange={(n) => editExercise(e.id, { repMin: n })} />
              <NumInput ariaLabel={`Reps máximas ${e.name}`} value={e.repMax} onChange={(n) => editExercise(e.id, { repMax: n })} />
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

      <p className="muted small center">Gym Progress · v0.1</p>
    </div>
  )
}

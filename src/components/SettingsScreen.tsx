import { useMemo, useRef, useState, type ReactNode } from 'react'
import {
  ArrowLeft,
  BookOpen,
  ChevronRight,
  Database,
  Dumbbell,
  ListChecks,
  Palette,
  Search,
  Timer,
  User,
  Weight,
  X,
  type LucideIcon,
} from 'lucide-react'
import type { CountryCode, Exercise, Settings, UserGoal } from '../types'
import { parseState, useStore } from '../lib/store'
import { ALL_PLATES, DEFAULT_EXERCISES, MUSCLES, defaultState } from '../lib/defaults'
import { NumInput } from './NumInput'
import { useDialog } from './Dialog'
import { playRestDone, unlockAudio } from '../lib/sound'
import { ExerciseForm } from './ExercisePicker'
import { fmtRange, metricOf } from '../lib/metric'
import { COUNTRIES, countryInfo } from '../lib/occasions'
import { ACCENTS, accentInfo } from '../lib/accents'
import { toYmd } from '../lib/format'
import { fmtRest } from '../lib/goals'

type Section = 'profile' | 'training' | 'equipment' | 'exercises' | 'appearance' | 'data' | 'help'

const GUIDE_URL = 'https://github.com/danielhdzr/gym-progress-/blob/main/GUIA-DE-USO.md'
const REPO_URL = 'https://github.com/danielhdzr/gym-progress-'
const VERSION = 'v1.2'

const GOAL_LABELS: Record<UserGoal, string> = {
  strength: 'Ganar fuerza',
  muscle: 'Ganar músculo',
  cut: 'Definir',
  cardio: 'Caminar o correr',
  mixed: 'Un poco de todo',
}

/** Días desde una fecha ISO: "hoy", "ayer", "hace 12 días". */
function daysAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 864e5)
  return days <= 0 ? 'hoy' : days === 1 ? 'ayer' : `hace ${days} días`
}

function useSettings() {
  const { state, update } = useStore()
  const set = (patch: Partial<Settings>) => update((s) => ({ ...s, settings: { ...s.settings, ...patch } }))
  return { state, update, s: state.settings, set }
}

export function SettingsScreen({ onBack }: { onBack?: () => void }) {
  const { state, s } = useSettings()
  const [section, setSection] = useState<Section | null>(null)

  const backupDays = s.lastBackupAt ? Math.floor((Date.now() - new Date(s.lastBackupAt).getTime()) / 864e5) : null
  const needsBackup = state.workouts.length > 0 && (backupDays === null || backupDays > 30)

  const rows: { id: Section; Icon: LucideIcon; title: string; summary: string; warn?: boolean }[] = [
    { id: 'profile', Icon: User, title: 'Perfil', summary: [s.userName || 'Sin nombre', s.goal ? GOAL_LABELS[s.goal] : null, s.weeklyGoalDays ? `Meta ${s.weeklyGoalDays} días` : null].filter(Boolean).join(' · ') },
    { id: 'training', Icon: Timer, title: 'Entrenamiento', summary: `Descanso ${fmtRest(s.restSeconds)} · Sonido ${s.restSound ? 'activado' : 'desactivado'}${s.readinessCheck ? ' · Check-in' : ''}` },
    { id: 'equipment', Icon: Weight, title: 'Barra y discos', summary: `Barra ${s.barWeight} kg · ${s.plates.length} discos` },
    { id: 'exercises', Icon: ListChecks, title: 'Ejercicios', summary: `${state.exercises.length} ejercicios` },
    { id: 'appearance', Icon: Palette, title: 'Apariencia', summary: `${accentInfo(s.accent).name} · Temas de temporada ${s.seasonalThemes ? 'activados' : 'desactivados'}` },
    {
      id: 'data',
      Icon: Database,
      title: 'Mis datos',
      summary: s.lastBackupAt ? `Último respaldo ${daysAgo(s.lastBackupAt)}` : 'Sin respaldos todavía',
      warn: needsBackup,
    },
    { id: 'help', Icon: BookOpen, title: 'Ayuda', summary: 'Guía de uso y bienvenida' },
  ]

  if (section) {
    const row = rows.find((r) => r.id === section)!
    return (
      <div className="screen narrow">
        <header className="page-head with-back">
          <button className="icon-btn" onClick={() => setSection(null)} aria-label="Volver a Ajustes">
            <ArrowLeft aria-hidden />
          </button>
          <h1>{row.title}</h1>
        </header>
        {section === 'profile' && <ProfileSection />}
        {section === 'training' && <TrainingSection />}
        {section === 'equipment' && <EquipmentSection />}
        {section === 'exercises' && <ExercisesSection />}
        {section === 'appearance' && <AppearanceSection />}
        {section === 'data' && <DataSection />}
        {section === 'help' && <HelpSection />}
      </div>
    )
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

      {needsBackup && (
        <button className="card backup-nudge" onClick={() => setSection('data')}>
          <Database aria-hidden />
          <span className="grow">
            <strong>Haz un respaldo de tus datos</strong>
            <span className="muted small block">Viven solo en este dispositivo. Toma 5 segundos.</span>
          </span>
          <ChevronRight aria-hidden />
        </button>
      )}

      <nav className="card settings-list" aria-label="Secciones de ajustes">
        {rows.map(({ id, Icon, title, summary, warn }) => (
          <button key={id} className="settings-row" onClick={() => setSection(id)}>
            <span className="settings-icon"><Icon size={20} aria-hidden /></span>
            <span className="grow">
              <span className="settings-title">{title}</span>
              <span className={`small block ${warn ? 'warn-text' : 'muted'}`}>{summary}</span>
            </span>
            <ChevronRight size={18} className="muted" aria-hidden />
          </button>
        ))}
      </nav>

      <p className="muted small center">Gym Progress · {VERSION}</p>
    </div>
  )
}

function Card({ title, children, hint }: { title?: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <section className="card">
      {title && <h3>{title}</h3>}
      {children}
      {hint && <p className="muted small">{hint}</p>}
    </section>
  )
}

function Switch({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return <button className={`switch ${on ? 'on' : ''}`} role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} />
}

/* ---------- Perfil ---------- */

function ProfileSection() {
  const { state, s, set } = useSettings()
  const firstWorkout = state.workouts.filter((w) => w.finishedAt).map((w) => w.startedAt).sort()[0]
  const firstWorkoutYmd = firstWorkout ? toYmd(firstWorkout) : ''

  return (
    <>
      <Card>
        <label className="field">
          Tu nombre
          <input
            value={s.userName}
            placeholder="Para los saludos y mensajes"
            maxLength={30}
            autoComplete="given-name"
            onChange={(e) => set({ userName: e.target.value, namePrompted: true })}
          />
        </label>
        <div className="field">
          Tu objetivo
          <div className="chips">
            {(Object.keys(GOAL_LABELS) as UserGoal[]).map((g) => (
              <button key={g} className={`chip ${s.goal === g ? 'on' : ''}`} aria-pressed={s.goal === g} onClick={() => set({ goal: g })}>
                {GOAL_LABELS[g]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          Meta de días activos por semana
          <div className="chips">
            {[0, 2, 3, 4, 5, 6].map((n) => (
              <button key={n} className={`chip ${s.weeklyGoalDays === n ? 'on' : ''}`} aria-pressed={s.weeklyGoalDays === n} onClick={() => set({ weeklyGoalDays: n })}>
                {n ? `${n} días` : 'Sin meta'}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card title="Fechas especiales" hint="Te felicitaremos en tu cumpleaños, cada mes que cumplas entrenando y en tu aniversario.">
        <div className="row2">
          <label className="field">
            🎂 Tu cumpleaños
            <input type="date" value={s.birthday} max={toYmd(new Date())} onChange={(e) => set({ birthday: e.target.value })} />
          </label>
          <label className="field">
            🏋️ Empecé a entrenar
            <input type="date" value={s.trainingStart || firstWorkoutYmd} max={toYmd(new Date())} onChange={(e) => set({ trainingStart: e.target.value })} />
          </label>
        </div>
        {!s.trainingStart && firstWorkoutYmd && <p className="muted small">Por ahora se usa la fecha de tu primer entreno registrado.</p>}
        <label className="field">
          País (festivos y estaciones)
          <select value={s.country} onChange={(e) => set({ country: e.target.value as CountryCode })}>
            {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
          </select>
        </label>
        <p className="muted small">{countryInfo(s.country).south ? 'Hemisferio sur: las estaciones van al revés.' : 'Hemisferio norte.'}</p>
      </Card>
    </>
  )
}

/* ---------- Entrenamiento ---------- */

function TrainingSection() {
  const { s, set } = useSettings()
  return (
    <>
      <Card title="Descanso por defecto" hint="Se usa en entrenos libres y en rutinas sin descanso propio. En las rutinas, cada ejercicio puede tener el suyo.">
        <div className="chips">
          {[60, 90, 120, 180, 240].map((sec) => (
            <button key={sec} className={`chip ${s.restSeconds === sec ? 'on' : ''}`} aria-pressed={s.restSeconds === sec} onClick={() => set({ restSeconds: sec })}>
              {fmtRest(sec)}
            </button>
          ))}
        </div>
      </Card>
      <Card hint="Al empezar una rutina eliges cómo llegas (con energía, normal, cansado o día ligero) y la app ajusta peso y series.">
        <div className="card-head">
          <h3>Preguntar “¿Cómo llegas hoy?”</h3>
          <Switch on={s.readinessCheck} label="Preguntar cómo llegas hoy" onChange={(readinessCheck) => set({ readinessCheck })} />
        </div>
      </Card>
      <Card hint="En iPhone no suena si el interruptor de silencio está activado o la pantalla está bloqueada.">
        <div className="card-head">
          <h3>Sonido al terminar el descanso</h3>
          <Switch on={s.restSound} label="Sonido al terminar el descanso" onChange={(restSound) => set({ restSound })} />
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
      </Card>
    </>
  )
}

/* ---------- Barra y discos ---------- */

function EquipmentSection() {
  const { s, set } = useSettings()
  return (
    <Card hint="Para la calculadora de discos y las series de calentamiento (botón 🔥 Discos en cada ejercicio).">
      <label className="field inline">
        Peso de la barra (kg)
        <NumInput decimal ariaLabel="Peso de la barra" value={s.barWeight} onChange={(barWeight) => set({ barWeight })} />
      </label>
      <div className="group-label">Discos disponibles en tu gym</div>
      <div className="chips">
        {ALL_PLATES.map((p) => {
          const on = s.plates.includes(p)
          return (
            <button key={p} className={`chip ${on ? 'on' : ''}`} aria-pressed={on} onClick={() => set({ plates: on ? s.plates.filter((x) => x !== p) : [...s.plates, p] })}>
              {p} kg
            </button>
          )
        })}
      </div>
    </Card>
  )
}

/* ---------- Ejercicios ---------- */

function ExercisesSection() {
  const { state, update } = useSettings()
  const dialog = useDialog()
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState<Exercise | 'new' | null>(null)

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const order = new Map(MUSCLES.map((m, i) => [m, i]))
    const map = new Map<string, Exercise[]>()
    for (const e of state.exercises.filter((e) => !q || e.name.toLowerCase().includes(q))) map.set(e.muscle, [...(map.get(e.muscle) ?? []), e])
    return [...map.entries()].sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99))
  }, [state.exercises, query])

  const builtIn = new Set(DEFAULT_EXERCISES.map((e) => e.id))
  const inUse = (id: string) =>
    state.routines.some((r) => r.items.some((i) => i.exerciseId === id)) ||
    state.workouts.some((w) => w.entries.some((e) => e.exerciseId === id)) ||
    !!state.active?.entries.some((e) => e.exerciseId === id)

  const remove = async (ex: Exercise) => {
    if (inUse(ex.id)) {
      await dialog.alert(`“${ex.name}” está en tus rutinas o en tu historial, así que no se puede borrar. Puedes cambiarle el nombre.`)
      return
    }
    if (await dialog.confirm({ message: `¿Borrar “${ex.name}”?`, confirmLabel: 'Borrar', danger: true })) {
      update((st) => ({ ...st, exercises: st.exercises.filter((e) => e.id !== ex.id) }))
      setEditing(null)
    }
  }

  return (
    <>
      <div className="search-row">
        <Search size={18} aria-hidden />
        <input className="search" placeholder="Buscar ejercicio" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar ejercicio" />
      </div>
      <button className="secondary full" onClick={() => setEditing('new')}>+ Crear ejercicio</button>

      {groups.map(([muscle, list]) => (
        <section key={muscle} className="card ex-group">
          <div className="group-label">{muscle}</div>
          {list.map((e) => (
            <button key={e.id} className="settings-row" onClick={() => setEditing(e)}>
              <span className="grow">
                <span className="settings-title">{e.name}</span>
                <span className="muted small block">
                  {fmtRange(e.repMin, e.repMax, metricOf(e))} · sube {e.increment} kg{!builtIn.has(e.id) && ' · creado por ti'}
                </span>
              </span>
              <ChevronRight size={18} className="muted" aria-hidden />
            </button>
          ))}
        </section>
      ))}
      {!groups.length && <p className="muted center">No hay ejercicios con ese nombre.</p>}

      {editing && (
        <div className="sheet-backdrop" onClick={() => setEditing(null)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>{editing === 'new' ? 'Nuevo ejercicio' : 'Editar ejercicio'}</h2>
              <button className="icon-btn" onClick={() => setEditing(null)} aria-label="Cerrar"><X aria-hidden /></button>
            </div>
            <div className="sheet-body">
              <ExerciseForm
                initial={editing === 'new' ? undefined : editing}
                initialName={editing === 'new' ? query : ''}
                onCancel={() => setEditing(null)}
                onSave={(ex) => {
                  update((st) => ({
                    ...st,
                    exercises: st.exercises.some((e) => e.id === ex.id) ? st.exercises.map((e) => (e.id === ex.id ? ex : e)) : [...st.exercises, ex],
                  }))
                  setEditing(null)
                }}
              />
              {editing !== 'new' && !builtIn.has(editing.id) && (
                <button className="danger-link" onClick={() => remove(editing)}>Borrar ejercicio</button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/* ---------- Apariencia ---------- */

function AppearanceSection() {
  const { s, set } = useSettings()
  return (
    <>
      <Card title="Color de la app" hint={s.seasonalThemes ? 'En fechas especiales se usa el color de temporada.' : undefined}>
        <div className="swatches" role="radiogroup" aria-label="Color de la app">
          {ACCENTS.map((c) => (
            <button
              key={c.id}
              role="radio"
              aria-checked={s.accent === c.id}
              aria-label={c.name}
              title={c.name}
              className={`swatch ${s.accent === c.id ? 'on' : ''}`}
              style={{ '--sw-dark': c.dark[0], '--sw-light': c.light[0] } as React.CSSProperties}
              onClick={() => set({ accent: c.id })}
            />
          ))}
        </div>
        <p className="small">{accentInfo(s.accent).name}</p>
      </Card>
      <Card hint="El encabezado de Inicio cambia según la hora y la estación, y en fechas especiales (festivos, tu cumpleaños, tus meses entrenando) cambia el color y aparece un mensaje. El país y tus fechas se configuran en Perfil.">
        <div className="card-head">
          <h3>Temas de temporada</h3>
          <Switch on={s.seasonalThemes} label="Temas de temporada" onChange={(seasonalThemes) => set({ seasonalThemes })} />
        </div>
      </Card>
    </>
  )
}

/* ---------- Mis datos ---------- */

function DataSection() {
  const { state, update, s, set } = useSettings()
  const dialog = useDialog()
  const fileRef = useRef<HTMLInputElement>(null)

  const exportData = () => {
    const now = new Date().toISOString()
    const data = { ...state, settings: { ...state.settings, lastBackupAt: now } }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `gym-progress-${now.slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    set({ lastBackupAt: now })
  }

  const importData = async (file: File) => {
    try {
      const next = parseState(await file.text())
      const ok = await dialog.confirm({
        message: `Esto reemplaza los datos de este dispositivo con los del respaldo (${next.workouts.length} entrenos, ${next.cardio.length} de cardio). ¿Continuar?`,
        confirmLabel: 'Importar',
      })
      if (ok) update(() => next)
    } catch (err) {
      await dialog.alert(`No se pudo importar: ${(err as Error).message}`)
    }
  }

  return (
    <>
      <Card title="Respaldo" hint="Tus datos viven solo en este dispositivo. Si borras la app o cambias de teléfono, se pierden sin un respaldo. Guarda el archivo en Drive, iCloud o tu correo.">
        <p className="small">
          {s.lastBackupAt ? `Último respaldo: ${daysAgo(s.lastBackupAt)}.` : 'Todavía no has hecho ningún respaldo.'}{' '}
          {state.workouts.length} entrenos, {state.cardio.length} de cardio y {state.bodyweight.length} registros de peso.
        </p>
        <div className="row2">
          <button className="primary" onClick={exportData}>Exportar respaldo</button>
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
      </Card>
      <Card title="Zona de peligro">
        <button
          className="danger-link"
          onClick={async () => {
            if (await dialog.confirm({ message: '¿Borrar TODOS tus datos de este dispositivo? Esto no se puede deshacer.', confirmLabel: 'Borrar todo', danger: true }))
              update(() => defaultState())
          }}
        >
          Borrar todos los datos
        </button>
      </Card>
    </>
  )
}

/* ---------- Ayuda ---------- */

function HelpSection() {
  const { set } = useSettings()
  return (
    <>
      <Card title="Guía de uso" hint="Instalación en iPhone y Android, cómo funcionan las sugerencias, respaldos y preguntas frecuentes.">
        <a className="secondary link-btn" href={GUIDE_URL} target="_blank" rel="noreferrer">
          <BookOpen size={18} aria-hidden /> Abrir la guía
        </a>
      </Card>
      <Card title="Bienvenida" hint="Vuelve a elegir tu objetivo, días y una rutina recomendada. Tus rutinas e historial se conservan.">
        <button className="secondary" onClick={() => set({ onboarded: false })}>
          <Dumbbell size={18} aria-hidden /> Repetir la bienvenida
        </button>
      </Card>
      <p className="muted small center">
        Gym Progress {VERSION} · <a href={REPO_URL} target="_blank" rel="noreferrer">Código en GitHub</a>
      </p>
    </>
  )
}

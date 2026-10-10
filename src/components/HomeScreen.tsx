import { useState } from 'react'
import { CalendarPlus, ChevronRight, Dumbbell, Footprints, Play, Scale, Timer, Trophy, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { greeting } from '../lib/motivation'
import { dataLine, estimateMinutes, nextRoutine, routinePreview, weekDays, weekGoalMessage } from '../lib/home'
import { startWorkout } from '../lib/workout'
import { cardioLabel, fmtDurationClock, timerElapsedMs } from '../lib/cardio'
import { AmbienceHero, useAmbience } from './Ambience'
import { NamePrompt } from './TrainScreen'
import { BodyweightCard } from './BodyweightCard'

export function HomeScreen() {
  const { state } = useStore()
  const nav = useNav()
  const ambience = useAmbience()
  const [weighing, setWeighing] = useState(false)
  const { userName, namePrompted } = state.settings

  return (
    <div className="screen">
      <AmbienceHero
        greeting={greeting(userName, ambience.now, '')}
        dataLine={dataLine(state.workouts, state.cardio, ambience.now)}
        onSettings={nav.openSettings}
      />

      {!namePrompted && <NamePrompt />}

      <div className="home-grid">
        <div className="home-main">
          <TodayCard />
          <div className="quick-grid">
            <QuickAction icon={<Footprints aria-hidden />} label="Caminar o correr" onClick={() => nav.go('cardio')} />
            <QuickAction icon={<Scale aria-hidden />} label="Registrar peso" onClick={() => setWeighing(true)} />
            <QuickAction icon={<CalendarPlus aria-hidden />} label="Anotar entreno pasado" onClick={() => nav.go('progress', 'past-workout')} />
            <QuickAction icon={<Trophy aria-hidden />} label="Mis récords" onClick={() => nav.go('progress', 'records')} />
          </div>
        </div>
        <WeekCard />
      </div>

      {weighing && (
        <div className="sheet-backdrop" onClick={() => setWeighing(false)}>
          <div className="sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>Registrar peso</h2>
              <button className="icon-btn" onClick={() => setWeighing(false)} aria-label="Cerrar">
                <X aria-hidden />
              </button>
            </div>
            <div className="sheet-body">
              <BodyweightCard />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button className="quick" onClick={onClick}>
      <span className="quick-icon">{icon}</span>
      <span>{label}</span>
    </button>
  )
}

/** "Hoy te toca": la siguiente rutina, o continuar lo que está en curso. */
function TodayCard() {
  const { state, update } = useStore()
  const nav = useNav()
  const timer = state.cardioTimer

  if (state.active) {
    const done = state.active.entries.reduce((n, e) => n + e.sets.filter((s) => s.done).length, 0)
    const minutes = Math.round((Date.now() - new Date(state.active.startedAt).getTime()) / 60000)
    return (
      <section className="card today live">
        <span className="eyebrow"><Dumbbell size={16} aria-hidden /> Entreno en curso</span>
        <h2>{state.active.name}</h2>
        <p className="muted small">{minutes} min · {done} {done === 1 ? 'serie' : 'series'} hechas</p>
        <button className="primary full big" onClick={() => nav.go('gym')}>
          <Play size={18} aria-hidden /> Continuar entreno
        </button>
      </section>
    )
  }

  const routine = nextRoutine(state.routines, state.workouts)
  const timerCard = timer && (
    <button className="card today-mini" onClick={() => nav.go('cardio')}>
      <Timer aria-hidden />
      <span className="grow">
        {cardioLabel(timer.type).label} en curso · {fmtDurationClock(timerElapsedMs(timer) / 60000)}
      </span>
      <ChevronRight aria-hidden />
    </button>
  )

  if (!routine) {
    return (
      <>
        {timerCard}
        <section className="card today">
          <span className="eyebrow"><Dumbbell size={16} aria-hidden /> Empieza aquí</span>
          <h2>Crea tu primera rutina</h2>
          <p className="muted small">Elige tus ejercicios y la app te dirá qué peso usar cada vez.</p>
          <button className="primary full big" onClick={() => nav.go('gym')}>Ir a Pesas</button>
        </section>
      </>
    )
  }

  const preview = routinePreview(routine, state.exercises, state.workouts)
  return (
    <>
      {timerCard}
      <section className="card today">
        <span className="eyebrow">Hoy te toca</span>
        <h2>{routine.name}</h2>
        <p className="muted small">
          {routine.items.length} ejercicios · ~{estimateMinutes(routine, state.settings.restSeconds)} min
          {preview && <><br />{preview}</>}
        </p>
        <button
          className="primary full big"
          onClick={() => {
            update((s) => ({ ...s, active: startWorkout(routine, s.exercises, s.workouts) }))
            nav.go('gym')
          }}
        >
          <Play size={18} aria-hidden /> Empezar entreno
        </button>
        <button className="ghost full" onClick={() => nav.go('gym')}>Elegir otra rutina</button>
      </section>
    </>
  )
}

function WeekCard() {
  const { state, update } = useStore()
  const ambience = useAmbience()
  const days = weekDays(state.workouts, state.cardio, ambience.now)
  const active = days.filter((d) => d.gym || d.cardio).length
  const goal = state.settings.weeklyGoalDays
  const message = weekGoalMessage(active, goal)
  const [editingGoal, setEditingGoal] = useState(false)

  return (
    <section className="card week-card">
      <div className="card-head">
        <h3>Tu semana</h3>
        <span className="muted small">{goal ? `${active} de ${goal} días` : `${active} ${active === 1 ? 'día' : 'días'}`}</span>
      </div>
      <div className="week-days">
        {days.map((d, i) => (
          <div key={i} className="week-day">
            <span>{d.letter}</span>
            <span
              className={['dot', d.gym && 'gym', !d.gym && d.cardio && 'cardio', d.gym && d.cardio && 'both', d.today && 'today', d.future && 'future']
                .filter(Boolean)
                .join(' ')}
              title={d.gym && d.cardio ? 'Pesas y cardio' : d.gym ? 'Pesas' : d.cardio ? 'Cardio' : undefined}
            />
          </div>
        ))}
      </div>
      <p className="legend small">
        <span className="dot gym mini" aria-hidden /> Pesas <span className="dot cardio mini" aria-hidden /> Cardio <span className="dot today mini" aria-hidden /> Hoy
      </p>
      <div className="week-foot">
        {message ? <p className="small week-msg">{message}</p> : <span />}
        <button className="link small" onClick={() => setEditingGoal((v) => !v)}>{editingGoal ? 'Listo' : 'Cambiar meta'}</button>
      </div>
      {editingGoal && (
      <div className="goal-picker">
        <span className="muted small">Meta:</span>
        {[0, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            className={`chip mini ${goal === n ? 'on' : ''}`}
            aria-pressed={goal === n}
            onClick={() => update((s) => ({ ...s, settings: { ...s.settings, weeklyGoalDays: n } }))}
          >
            {n ? `${n} días` : 'Sin meta'}
          </button>
        ))}
      </div>
      )}
    </section>
  )
}

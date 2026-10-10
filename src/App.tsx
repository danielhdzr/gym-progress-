import { ChartLine, Dumbbell, Footprints, House, Settings, type LucideIcon } from 'lucide-react'
import { StoreProvider, useStore } from './lib/store'
import { NavProvider, useNav, type Tab } from './lib/nav'
import { HomeScreen } from './components/HomeScreen'
import { TrainScreen } from './components/TrainScreen'
import { ProgressHub } from './components/ProgressHub'
import { SettingsScreen } from './components/SettingsScreen'
import { CardioScreen } from './components/CardioScreen'
import { AmbienceStyle } from './components/Ambience'
import { DialogProvider } from './components/Dialog'
import { RestTimerProvider } from './components/RestTimer'
import { Onboarding } from './components/Onboarding'

const TABS: { id: Tab; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Inicio', Icon: House },
  { id: 'gym', label: 'Pesas', Icon: Dumbbell },
  { id: 'cardio', label: 'Cardio', Icon: Footprints },
  { id: 'progress', label: 'Progreso', Icon: ChartLine },
]

function Shell() {
  const { state } = useStore()
  const nav = useNav()

  /** Punto rojo cuando hay algo en curso en otra sección. */
  const live = (id: Tab) =>
    (id === 'gym' && !!state.active && nav.tab !== 'gym') || (id === 'cardio' && !!state.cardioTimer && nav.tab !== 'cardio')

  const items = TABS.map(({ id, label, Icon }) => {
    const current = nav.tab === id && !nav.settingsOpen
    return (
      <button key={id} className={current ? 'active' : ''} aria-current={current ? 'page' : undefined} onClick={() => nav.go(id)}>
        <span className="nav-icon">
          <Icon aria-hidden />
          {live(id) && <span className="live-dot" aria-label="En curso" />}
        </span>
        <span>{label}</span>
      </button>
    )
  })

  return (
    <div className="app">
      <AmbienceStyle />

      {/* Computadora: menú lateral */}
      <nav className="sidebar" aria-label="Secciones">
        <div className="brand">
          <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={32} height={32} />
          <span>Gym Progress</span>
        </div>
        {items}
        <button className={nav.settingsOpen ? 'active settings-link' : 'settings-link'} onClick={nav.openSettings}>
          <span className="nav-icon">
            <Settings aria-hidden />
          </span>
          <span>Ajustes</span>
        </button>
      </nav>

      <main>
        {nav.settingsOpen ? (
          <SettingsScreen onBack={nav.closeSettings} />
        ) : (
          <>
            {nav.tab === 'home' && <HomeScreen />}
            {nav.tab === 'gym' && <TrainScreen />}
            {nav.tab === 'cardio' && <CardioScreen />}
            {nav.tab === 'progress' && <ProgressHub />}
          </>
        )}
      </main>

      {!state.settings.onboarded && <Onboarding />}

      {/* Teléfono y tableta: menú inferior */}
      <nav className="tabbar" aria-label="Secciones">
        {items}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <NavProvider>
        <DialogProvider>
          <RestTimerProvider>
            <Shell />
          </RestTimerProvider>
        </DialogProvider>
      </NavProvider>
    </StoreProvider>
  )
}

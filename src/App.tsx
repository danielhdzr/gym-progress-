import { useState } from 'react'
import { StoreProvider, useStore } from './lib/store'
import { TrainScreen } from './components/TrainScreen'
import { HistoryScreen } from './components/HistoryScreen'
import { ProgressScreen } from './components/ProgressScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { CardioScreen } from './components/CardioScreen'
import { AmbienceStyle } from './components/Ambience'
import { DialogProvider } from './components/Dialog'
import { RestTimerProvider } from './components/RestTimer'

const TABS = [
  { id: 'train', label: 'Entrenar', icon: '🏋️' },
  { id: 'cardio', label: 'Cardio', icon: '🏃' },
  { id: 'progress', label: 'Progreso', icon: '📈' },
  { id: 'history', label: 'Historial', icon: '🗓️' },
  { id: 'settings', label: 'Ajustes', icon: '⚙️' },
] as const

type TabId = (typeof TABS)[number]['id']

function Shell() {
  const { state } = useStore()
  const [tab, setTab] = useState<TabId>('train')

  return (
    <div className="app">
      <AmbienceStyle />
      <main>
        {tab === 'train' && <TrainScreen />}
        {tab === 'cardio' && <CardioScreen />}
        {tab === 'progress' && <ProgressScreen />}
        {tab === 'history' && <HistoryScreen />}
        {tab === 'settings' && <SettingsScreen />}
      </main>
      <nav className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'active' : ''}
            onClick={() => {
              setTab(t.id)
              window.scrollTo(0, 0)
            }}
          >
            <span className="tab-icon" aria-hidden>{t.icon}</span>
            {t.label}
            {t.id === 'train' && state.active && tab !== 'train' && <span className="live-dot" aria-label="Entreno en curso" />}
            {t.id === 'cardio' && state.cardioTimer && tab !== 'cardio' && <span className="live-dot" aria-label="Cronómetro en curso" />}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <DialogProvider>
        <RestTimerProvider>
          <Shell />
        </RestTimerProvider>
      </DialogProvider>
    </StoreProvider>
  )
}

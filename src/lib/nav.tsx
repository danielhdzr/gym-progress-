import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

export type Tab = 'home' | 'gym' | 'cardio' | 'progress'

/** Acción pendiente que la pantalla destino ejecuta al abrirse (p. ej. abrir "entreno pasado"). */
export type Intent = 'past-workout' | 'records' | 'history' | null

interface Nav {
  tab: Tab
  intent: Intent
  settingsOpen: boolean
  go: (tab: Tab, intent?: Intent) => void
  consumeIntent: () => Intent
  openSettings: () => void
  closeSettings: () => void
}

const NavContext = createContext<Nav | null>(null)

export function NavProvider({ children }: { children: ReactNode }) {
  const [tab, setTab] = useState<Tab>('home')
  const [intent, setIntent] = useState<Intent>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const go = useCallback((t: Tab, i: Intent = null) => {
    setTab(t)
    setIntent(i)
    setSettingsOpen(false)
    window.scrollTo(0, 0)
  }, [])

  const consumeIntent = useCallback(() => {
    const i = intent
    if (i) setIntent(null)
    return i
  }, [intent])

  const openSettings = useCallback(() => {
    setSettingsOpen(true)
    window.scrollTo(0, 0)
  }, [])
  const closeSettings = useCallback(() => setSettingsOpen(false), [])

  return (
    <NavContext.Provider value={{ tab, intent, settingsOpen, go, consumeIntent, openSettings, closeSettings }}>
      {children}
    </NavContext.Provider>
  )
}

export function useNav() {
  const ctx = useContext(NavContext)
  if (!ctx) throw new Error('useNav fuera de NavProvider')
  return ctx
}

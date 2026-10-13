import { useEffect, useState } from 'react'
import { useNav } from '../lib/nav'
import { ProgressScreen } from './ProgressScreen'
import { HistoryScreen } from './HistoryScreen'
import { AchievementsGallery } from './Achievements'

/** Progreso con dos vistas: gráficas/récords e historial de entrenos. */
export function ProgressHub() {
  const nav = useNav()
  // La intención llega una sola vez (desde los accesos rápidos de Inicio)
  const [intent] = useState(nav.intent)
  const { consumeIntent } = nav
  useEffect(() => {
    consumeIntent()
  }, [consumeIntent])
  const [view, setView] = useState<'charts' | 'history' | 'achievements'>(
    intent === 'past-workout' || intent === 'history' ? 'history' : intent === 'achievements' ? 'achievements' : 'charts',
  )

  const header = (
    <header className="page-head">
      <h1>Progreso</h1>
      <div className="segmented" role="tablist">
        <button role="tab" aria-selected={view === 'charts'} className={view === 'charts' ? 'on' : ''} onClick={() => setView('charts')}>
          Gráficas
        </button>
        <button role="tab" aria-selected={view === 'history'} className={view === 'history' ? 'on' : ''} onClick={() => setView('history')}>
          Historial
        </button>
        <button role="tab" aria-selected={view === 'achievements'} className={view === 'achievements' ? 'on' : ''} onClick={() => setView('achievements')}>
          Logros
        </button>
      </div>
    </header>
  )

  if (view === 'achievements')
    return (
      <div className="screen">
        {header}
        <AchievementsGallery />
      </div>
    )
  return view === 'charts' ? (
    <ProgressScreen header={header} focusRecords={intent === 'records'} />
  ) : (
    <HistoryScreen header={header} autoOpenPast={intent === 'past-workout'} />
  )
}

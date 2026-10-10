import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, Settings } from 'lucide-react'
import { useStore } from '../lib/store'
import { accentInfo } from '../lib/accents'
import {
  TIME_THEME,
  countryInfo,
  occasionFor,
  previewNow,
  seasonOf,
  timeOfDay,
  type Occasion,
  type Season,
  type TimeOfDay,
} from '../lib/occasions'

export interface Ambience {
  enabled: boolean
  now: Date
  time: TimeOfDay
  season: Season
  occasion: Occasion | null
  gradient: [string, string]
}

/** Hora, estación y ocasión actuales. Se recalcula cada minuto (cambio de mañana/tarde/noche). */
export function useAmbience(): Ambience {
  const { state } = useStore()
  const { settings, workouts, exercises, cardio } = state
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  return useMemo(() => {
    void tick
    const now = previewNow()
    const time = timeOfDay(now)
    const season = seasonOf(now, countryInfo(settings.country).south)
    const occasion = settings.seasonalThemes
      ? occasionFor({
          now,
          name: settings.userName,
          country: settings.country,
          birthday: settings.birthday,
          trainingStart: settings.trainingStart,
          workouts,
          exercises,
          cardio,
        })
      : null
    return {
      enabled: settings.seasonalThemes,
      now,
      time,
      season,
      occasion,
      gradient: occasion?.palette.gradient ?? TIME_THEME[time].gradient,
    }
  }, [tick, settings, workouts, exercises, cardio])
}

/**
 * Color de acento de toda la app: el de la fecha especial si hay una (y los temas están activos);
 * si no, el que eligió el usuario en Ajustes. Lima es el de la hoja de estilos base.
 */
export function AmbienceStyle() {
  const { occasion } = useAmbience()
  const { state } = useStore()
  const chosen = state.settings.accent
  if (!occasion && chosen === 'lime') return null
  const { dark, light } = occasion ? occasion.palette : accentInfo(chosen)
  const css = `
:root { --accent: ${dark[0]}; --accent-ink: ${dark[1]}; }
@media (prefers-color-scheme: light) { :root { --accent: ${light[0]}; --accent-ink: ${light[1]}; } }`
  return <style>{css}</style>
}

/**
 * Encabezado de Inicio: dos líneas como máximo.
 *  1. Saludo con emoji de la hora.
 *  2. La versión corta de la fecha especial o, si no hay, una línea de datos.
 * Si la ocasión tiene más que decir, al tocar se despliega el mensaje completo.
 */
export function AmbienceHero({ greeting, dataLine, onSettings }: { greeting: string; dataLine: string; onSettings: () => void }) {
  const a = useAmbience()
  const [open, setOpen] = useState(false)
  const o = a.occasion
  const expandable = !!o && (o.message !== o.short || !!o.detail)

  const settingsButton = (
    <button className="icon-btn" onClick={onSettings} aria-label="Ajustes">
      <Settings size={22} aria-hidden />
    </button>
  )

  return (
    <header
      className={a.enabled ? 'hero' : 'hero plain'}
      style={a.enabled ? ({ '--g1': a.gradient[0], '--g2': a.gradient[1] } as React.CSSProperties) : undefined}
    >
      <div className="hero-row">
        <h1>
          {greeting} {a.enabled ? TIME_THEME[a.time].emoji : '👋'}
        </h1>
        {settingsButton}
      </div>
      {o ? (
        expandable ? (
          <button className="hero-line hero-occasion" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {o.short}
            <span className="hero-more">{open ? 'Ver menos' : 'Ver más'} <ChevronDown size={16} className={open ? 'flip' : ''} aria-hidden /></span>
          </button>
        ) : (
          <p className="hero-line hero-occasion">{o.short}</p>
        )
      ) : (
        <p className="hero-line">{dataLine}</p>
      )}
      {o && open && (
        <div className="hero-expand">
          <p>{o.message}</p>
          {o.detail && <p>{o.detail}</p>}
          <p className="muted small">{dataLine}</p>
        </div>
      )}
    </header>
  )
}

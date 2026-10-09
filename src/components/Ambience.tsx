import { useEffect, useMemo, useState } from 'react'
import { useStore } from '../lib/store'
import {
  SEASONS,
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

/** Cambia el color de acento de toda la app durante una fecha especial (con su variante clara y oscura). */
export function AmbienceStyle() {
  const { occasion } = useAmbience()
  if (!occasion) return null
  const { dark, light } = occasion.palette
  const css = `
:root { --accent: ${dark[0]}; --accent-ink: ${dark[1]}; }
@media (prefers-color-scheme: light) { :root { --accent: ${light[0]}; --accent-ink: ${light[1]}; } }`
  return <style>{css}</style>
}

/** Encabezado de inicio: degradado según hora u ocasión, saludo, mensaje especial y estación. */
export function AmbienceHero({ greeting, message }: { greeting: string; message: string }) {
  const a = useAmbience()
  const season = SEASONS[a.season]

  if (!a.enabled) {
    return (
      <header className="hello">
        <h1>{greeting} 👋</h1>
        <p className="muted">{message}</p>
      </header>
    )
  }

  return (
    <header className="hero" style={{ '--g1': a.gradient[0], '--g2': a.gradient[1] } as React.CSSProperties}>
      <div className="hero-top">
        <span className="hero-chip">{season.emoji} {season.name}</span>
      </div>
      <h1>{greeting} {TIME_THEME[a.time].emoji}</h1>
      {a.occasion ? (
        <>
          <p className="hero-occasion">{a.occasion.message}</p>
          {a.occasion.detail && <p className="hero-detail">{a.occasion.detail}</p>}
          <p className="hero-sub">{message}</p>
        </>
      ) : (
        <p className="hero-sub">{message}</p>
      )}
    </header>
  )
}

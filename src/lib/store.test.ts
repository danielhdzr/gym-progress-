import { describe, expect, it } from 'vitest'
import { parseState } from './store'
import { defaultState } from './defaults'

const legacy = (extra: Record<string, unknown> = {}) => {
  const s = defaultState() as unknown as Record<string, unknown>
  const settings = { ...(s.settings as object) } as Record<string, unknown>
  delete settings.onboarded
  delete settings.accent
  return JSON.stringify({
    ...s,
    exercises: (s.exercises as { id: string }[]).filter((e) => e.id !== 'leg-ext').concat({ id: 'mio', name: 'Mi ejercicio', muscle: 'Core', repMin: 8, repMax: 12, increment: 1 } as never),
    settings: { ...settings, ...extra },
  })
}

describe('parseState (migración)', () => {
  it('quien ya usaba la app no ve la bienvenida', () => {
    expect(parseState(legacy({ namePrompted: true })).settings.onboarded).toBe(true)
  })

  it('un respaldo sin uso todavía muestra la bienvenida', () => {
    expect(parseState(legacy({ namePrompted: false })).settings.onboarded).toBe(false)
  })

  it('agrega ejercicios nuevos de la lista base sin perder los propios', () => {
    const ids = parseState(legacy()).exercises.map((e) => e.id)
    expect(ids).toContain('leg-ext')
    expect(ids).toContain('mio')
  })

  it('completa los ajustes nuevos con sus valores por defecto', () => {
    expect(parseState(legacy()).settings.accent).toBe('lime')
  })
})

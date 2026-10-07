const LOCALE = 'es-MX'

export const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' })

export const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })

export const fmtKg = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)} kg`

export function fmtDuration(ms: number) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return h ? `${h} h ${m} min` : `${m} min`
}

export function fmtClock(seconds: number) {
  const s = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

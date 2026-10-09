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

const pad = (n: number) => String(n).padStart(2, '0')

/** Fecha local YYYY-MM-DD (para <input type="date">). */
export function toYmd(date: Date | string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Cambia el día de un ISO conservando la hora local. */
export function withLocalDate(iso: string, ymd: string) {
  const d = new Date(iso)
  const [y, m, day] = ymd.split('-').map(Number)
  d.setFullYear(y, m - 1, day)
  return d.toISOString()
}

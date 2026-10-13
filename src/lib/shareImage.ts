import type { PeriodSummary } from './summary'

/**
 * Dibuja la tarjeta del resumen como imagen (1080×1350, formato vertical de Instagram).
 * Siempre en tema oscuro para que se vea igual en cualquier teléfono; usa el color de acento actual.
 */
export async function renderSummaryImage(s: PeriodSummary, name: string): Promise<Blob> {
  const W = 1080
  const H = 1350
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c6f432'
  // En modo claro el acento es oscuro; para la imagen oscura usamos el lima de base si no contrasta
  const accentOnDark = isDark(accent) ? '#c6f432' : accent
  const font = (weight: number, size: number) => `${weight} ${size}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`

  // Fondo
  ctx.fillStyle = '#0e0f11'
  ctx.fillRect(0, 0, W, H)
  const glow = ctx.createRadialGradient(W, 0, 50, W, 0, 900)
  glow.addColorStop(0, withAlpha(accentOnDark, 0.35))
  glow.addColorStop(1, 'transparent')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Encabezado
  ctx.fillStyle = accentOnDark
  ctx.font = font(800, 40)
  ctx.fillText('GYM PROGRESS', 80, 120)
  ctx.fillStyle = '#f2f3f5'
  ctx.font = font(800, 96)
  ctx.fillText(s.label, 80, 240)
  ctx.fillStyle = '#8b929c'
  ctx.font = font(500, 40)
  ctx.fillText(name.trim() ? `El resumen de ${name.trim()}` : 'Mi resumen de entrenamiento', 80, 305)

  // Cuadrícula de datos
  const stats: [string, string][] = [
    [String(s.workouts), s.workouts === 1 ? 'entreno' : 'entrenos'],
    [fmtVolume(s.volumeKg), 'levantados'],
    [String(s.prs), s.prs === 1 ? 'récord' : 'récords'],
    [s.km ? `${s.km} km` : String(s.activeDays), s.km ? 'de cardio' : 'días activos'],
  ]
  stats.forEach(([value, label], i) => {
    const x = 80 + (i % 2) * 470
    const y = 400 + Math.floor(i / 2) * 290
    roundRect(ctx, x, y, 440, 250, 36)
    ctx.fillStyle = '#17191c'
    ctx.fill()
    ctx.fillStyle = '#f2f3f5'
    ctx.font = font(800, fit(ctx, value, 96, 380, font))
    ctx.fillText(value, x + 40, y + 140)
    ctx.fillStyle = '#8b929c'
    ctx.font = font(500, 40)
    ctx.fillText(label, x + 40, y + 205)
  })

  // Líneas destacadas
  let y = 1030
  ctx.font = font(600, 42)
  for (const line of [s.topImprovement && `📈 ${s.topImprovement}`, s.favorite && `⭐ Favorito: ${s.favorite}`, `🔥 ${s.activeDays} ${s.activeDays === 1 ? 'día activo' : 'días activos'}`].filter(Boolean) as string[]) {
    ctx.fillStyle = '#f2f3f5'
    ctx.fillText(truncate(ctx, line, W - 160), 80, y)
    y += 70
  }

  // Pie
  ctx.fillStyle = accentOnDark
  ctx.fillRect(80, H - 120, 120, 8)
  ctx.fillStyle = '#8b929c'
  ctx.font = font(500, 34)
  ctx.fillText('danielhdzr.github.io/gym-progress-', 80, H - 60)

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('No se pudo crear la imagen'))), 'image/png'))
}

/** Comparte la imagen con el menú del sistema (WhatsApp, Instagram…) o la descarga si no se puede. */
export async function shareOrDownload(blob: Blob, filename: string, text: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'shared'
    }
  }
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
  return 'downloaded'
}

function fmtVolume(kg: number) {
  return kg >= 10000 ? `${(kg / 1000).toFixed(1)} t` : `${kg.toLocaleString('es-MX')} kg`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Tamaño de letra que hace caber el texto en `max` px. */
function fit(ctx: CanvasRenderingContext2D, text: string, size: number, max: number, font: (w: number, s: number) => string) {
  let s = size
  ctx.font = font(800, s)
  while (s > 40 && ctx.measureText(text).width > max) ctx.font = font(800, (s -= 4))
  return s
}

function truncate(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text
  let t = text
  while (t.length > 3 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1)
  return `${t}…`
}

function hexToRgb(hex: string) {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

const withAlpha = (hex: string, a: number) => `rgba(${hexToRgb(hex).join(',')},${a})`

function isDark(hex: string) {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110
}

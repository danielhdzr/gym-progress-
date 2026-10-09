/**
 * Sonido de fin de descanso con Web Audio (sin archivos de audio).
 * iOS solo permite reproducir audio si el AudioContext se activó durante un toque del usuario,
 * por eso `unlockAudio()` se llama al marcar una serie y el pitido suena después.
 */

type AudioCtor = typeof AudioContext
let ctx: AudioContext | null = null

export function unlockAudio() {
  try {
    const AC: AudioCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
    if (!AC) return
    ctx ??= new AC()
    if (ctx.state === 'suspended') void ctx.resume()
  } catch {
    // sin soporte de audio: el temporizador sigue funcionando sin sonido
  }
}

function beep(at: number, freq: number, length = 0.16) {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, at)
  gain.gain.linearRampToValueAtTime(0.35, at + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, at + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(at)
  osc.stop(at + length + 0.02)
}

/** Tres pitidos ascendentes. */
export function playRestDone() {
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()
  const t0 = ctx.currentTime + 0.05
  beep(t0, 880)
  beep(t0 + 0.22, 880)
  beep(t0 + 0.44, 1320, 0.35)
}

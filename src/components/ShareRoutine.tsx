import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { Copy, Share2, X } from 'lucide-react'
import type { Routine } from '../types'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { decodeRoutine, encodeRoutine, importRoutine, routineCodeFromHash, shareUrl } from '../lib/shareRoutine'
import { fmtScheme, itemTarget } from '../lib/goals'
import { metricOf } from '../lib/metric'
import { useDialog } from './Dialog'

/** Enlace + QR para compartir una rutina. */
export function ShareRoutineSheet({ routine, onClose }: { routine: Routine; onClose: () => void }) {
  const { state } = useStore()
  const url = shareUrl(encodeRoutine(routine, state.exercises))
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 480, errorCorrectionLevel: 'M' }).then(setQr, () => setQr(null))
  }, [url])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setStatus('Enlace copiado')
    } catch {
      setStatus('No se pudo copiar; mantén presionado el enlace para copiarlo')
    }
  }

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label={`Compartir ${routine.name}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Compartir rutina</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <div className="sheet-body share-body">
          <p><strong>{routine.name}</strong> · {routine.items.length} ejercicios</p>
          {qr && <img className="qr" src={qr} alt={`Código QR para importar ${routine.name}`} width={240} height={240} />}
          <p className="muted small center">Tu amigo escanea el código o abre el enlace y la importa con un toque. No se usa ningún servidor ni cuenta.</p>
          <div className="row2">
            {'share' in navigator && (
              <button className="primary" onClick={() => navigator.share({ title: routine.name, text: `Mi rutina “${routine.name}” en Gym Progress 💪`, url }).catch(() => {})}>
                <Share2 size={18} aria-hidden /> Compartir
              </button>
            )}
            <button className="secondary" onClick={copy}>
              <Copy size={18} aria-hidden /> Copiar enlace
            </button>
          </div>
          {status && <p className="muted small center">{status}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Si la app se abrió con un enlace #rutina=…, muestra la rutina y ofrece importarla.
 * Espera a que termine la bienvenida (si no, una plantilla podría reemplazarla).
 */
export function RoutineImporter() {
  const { state, update } = useStore()
  const nav = useNav()
  const dialog = useDialog()
  const [code, setCode] = useState(() => routineCodeFromHash(location.hash))

  useEffect(() => {
    if (!code) return
    // Quitar el código de la barra de direcciones para que no se reimporte al recargar
    history.replaceState(null, '', location.pathname + location.search)
  }, [code])

  if (!code || !state.settings.onboarded) return null

  let payload: ReturnType<typeof decodeRoutine>
  try {
    payload = decodeRoutine(code)
  } catch (err) {
    setTimeout(() => {
      setCode(null)
      void dialog.alert((err as Error).message)
    })
    return null
  }

  const preview = importRoutine(state, payload)
  return createPortal(
    <div className="sheet-backdrop" onClick={() => setCode(null)}>
      <div className="sheet" role="dialog" aria-label="Importar rutina" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>Te compartieron una rutina</h2>
          <button className="icon-btn" onClick={() => setCode(null)} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <div className="sheet-body">
          <h3>{preview.routine.name}</h3>
          <ul className="routine-items">
            {preview.routine.items.map((i, k) => {
              const ex = preview.state.exercises.find((e) => e.id === i.exerciseId)!
              return (
                <li key={k}>
                  <span>{ex.name}</span>
                  <span className="scheme">{fmtScheme(i.sets, itemTarget(i, ex, state.settings.restSeconds), metricOf(ex))}</span>
                </li>
              )
            })}
          </ul>
          <div className="row2" style={{ marginTop: 12 }}>
            <button className="secondary" onClick={() => setCode(null)}>Ahora no</button>
            <button
              className="primary"
              onClick={() => {
                update((s) => importRoutine(s, payload).state)
                setCode(null)
                nav.go('gym')
              }}
            >
              Importar rutina
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}

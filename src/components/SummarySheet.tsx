import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, Share2, X } from 'lucide-react'
import { useStore } from '../lib/store'
import { hasActivity, monthRange, periodSummary, yearRange } from '../lib/summary'
import { renderSummaryImage, shareOrDownload } from '../lib/shareImage'

interface Props {
  initial?: { kind: 'month' | 'year'; year: number; month0: number }
  onClose: () => void
}

/** Resumen de un mes o un año, con botón para compartirlo como imagen. */
export function SummarySheet({ initial, onClose }: Props) {
  const { state } = useStore()
  const now = new Date()
  const [kind, setKind] = useState<'month' | 'year'>(initial?.kind ?? 'month')
  const [year, setYear] = useState(initial?.year ?? now.getFullYear())
  const [month0, setMonth0] = useState(initial?.month0 ?? now.getMonth())
  const [status, setStatus] = useState<string | null>(null)

  const s = useMemo(() => periodSummary(state, kind === 'month' ? monthRange(year, month0) : yearRange(year)), [state, kind, year, month0])
  const isFuture = kind === 'month' ? new Date(year, month0 + 1, 1) > new Date(now.getFullYear(), now.getMonth() + 1, 1) : year > now.getFullYear()

  const step = (dir: -1 | 1) => {
    setStatus(null)
    if (kind === 'year') return setYear((y) => y + dir)
    const d = new Date(year, month0 + dir, 1)
    setYear(d.getFullYear())
    setMonth0(d.getMonth())
  }
  const atLatest = kind === 'month' ? year === now.getFullYear() && month0 === now.getMonth() : year === now.getFullYear()

  const share = async () => {
    try {
      setStatus('Creando imagen…')
      const blob = await renderSummaryImage(s, state.settings.userName)
      const result = await shareOrDownload(blob, `gym-progress-${s.label.replace(/\s+/g, '-').toLowerCase()}.png`, `Mi resumen de ${s.label} en Gym Progress 💪`)
      setStatus(result === 'downloaded' ? 'Imagen descargada' : null)
    } catch {
      setStatus('No se pudo crear la imagen')
    }
  }

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-label="Resumen" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>📊 Resumen</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X aria-hidden /></button>
        </div>
        <div className="segmented" role="tablist">
          <button role="tab" aria-selected={kind === 'month'} className={kind === 'month' ? 'on' : ''} onClick={() => setKind('month')}>Mes</button>
          <button role="tab" aria-selected={kind === 'year'} className={kind === 'year' ? 'on' : ''} onClick={() => setKind('year')}>Año</button>
        </div>
        <div className="period-nav">
          <button className="icon-btn" onClick={() => step(-1)} aria-label="Periodo anterior"><ChevronLeft aria-hidden /></button>
          <strong>{s.label}</strong>
          <button className="icon-btn" onClick={() => step(1)} disabled={atLatest} aria-label="Periodo siguiente"><ChevronRight aria-hidden /></button>
        </div>
        <div className="sheet-body">
          {isFuture || !hasActivity(s) ? (
            <p className="muted center">Sin entrenos en este periodo.</p>
          ) : (
            <>
              <div className="summary-grid">
                <div><span className="stat">{s.workouts}</span><span className="muted small">entrenos</span></div>
                <div><span className="stat">{s.volumeKg.toLocaleString('es-MX')}</span><span className="muted small">kg levantados</span></div>
                <div><span className="stat">{s.prs}</span><span className="muted small">récords</span></div>
                <div><span className="stat">{s.km}</span><span className="muted small">km de cardio</span></div>
              </div>
              <ul className="summary-lines">
                {s.topImprovement && <li>📈 Más avance: <strong>{s.topImprovement}</strong></li>}
                {s.favorite && <li>⭐ Favorito: <strong>{s.favorite}</strong></li>}
                <li>🔥 <strong>{s.activeDays}</strong> {s.activeDays === 1 ? 'día activo' : 'días activos'} · {s.sets} series</li>
              </ul>
              <button className="primary full big" onClick={share}>
                <Share2 size={18} aria-hidden /> Compartir imagen
              </button>
              {status && <p className="muted small center">{status}</p>}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

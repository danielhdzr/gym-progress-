import { useState } from 'react'
import { useStore } from '../lib/store'
import { fmtKg, fmtShortDate, toYmd } from '../lib/format'
import { LineChart } from './LineChart'
import { NumInput } from './NumInput'

/** "YYYY-MM-DD" → fecha local a mediodía (evita que la zona horaria la mueva de día). */
const ymdToIso = (ymd: string) => new Date(`${ymd}T12:00:00`).toISOString()

export function BodyweightCard() {
  const { state, update } = useStore()
  const entries = [...state.bodyweight].sort((a, b) => a.date.localeCompare(b.date))
  const latest = entries.at(-1)
  const [kg, setKg] = useState(latest?.kg ?? 0)
  const today = toYmd(new Date())

  const record = () => {
    if (kg <= 0) return
    update((s) => ({
      ...s,
      bodyweight: [...s.bodyweight.filter((b) => b.date !== today), { date: today, kg }],
    }))
  }

  const change = entries.length >= 2 ? entries.at(-1)!.kg - entries[0].kg : 0

  return (
    <section className="card">
      <h3>Peso corporal</h3>
      <div className="bw-input">
        <NumInput decimal ariaLabel="Peso corporal en kg" placeholder="kg" value={kg} onChange={setKg} />
        <button className="primary" onClick={record} disabled={kg <= 0}>
          {entries.some((b) => b.date === today) ? 'Actualizar hoy' : 'Registrar hoy'}
        </button>
      </div>

      {entries.length >= 2 && (
        <>
          <div className="stats">
            <div>
              <span className="stat">{fmtKg(latest!.kg)}</span>
              <span className="muted small">Actual</span>
            </div>
            <div>
              <span className="stat">{change > 0 ? '+' : ''}{change.toFixed(1)} kg</span>
              <span className="muted small">desde {fmtShortDate(ymdToIso(entries[0].date))}</span>
            </div>
          </div>
          <LineChart points={entries.map((b) => ({ label: fmtShortDate(ymdToIso(b.date)), value: b.kg }))} unit="kg" />
        </>
      )}

      {entries.slice(-5).reverse().map((b) => (
        <div key={b.date} className="history-line">
          <span>{fmtShortDate(ymdToIso(b.date))}</span>
          <span>
            {fmtKg(b.kg)}
            <button
              className="icon"
              aria-label={`Borrar registro del ${b.date}`}
              onClick={() => update((s) => ({ ...s, bodyweight: s.bodyweight.filter((x) => x.date !== b.date) }))}
            >
              ✕
            </button>
          </span>
        </div>
      ))}
      {!entries.length && <p className="muted small">Pésate a la misma hora (idealmente en ayunas) para comparar mejor.</p>}
    </section>
  )
}

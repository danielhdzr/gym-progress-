import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { CircleHelp, X } from 'lucide-react'

type Topic = 'rpe' | 'goal' | 'progression' | 'e1rm' | 'kcal'

const TOPICS: Record<Topic, { title: string; body: ReactNode }> = {
  rpe: {
    title: '¿Qué es el RPE?',
    body: (
      <>
        <p>Es qué tan pesada se sintió la serie, del 1 al 10. Anotarlo es opcional, pero mejora las sugerencias.</p>
        <table className="help-table">
          <tbody>
            <tr><td>10</td><td>Al fallo: no podías hacer ni una rep más</td></tr>
            <tr><td>9</td><td>Te quedaba 1 rep</td></tr>
            <tr><td>8</td><td>Te quedaban 2 reps</td></tr>
            <tr><td>7 o menos</td><td>Fácil: te quedaban 3 o más</td></tr>
          </tbody>
        </table>
        <p>Si llegas a la meta pero al fallo (10), la app te pide repetir el peso antes de subir. Si todo fue fácil (7 o menos), te pide avanzar más rápido.</p>
      </>
    ),
  },
  goal: {
    title: 'Fuerza vs. hipertrofia',
    body: (
      <>
        <p><strong>Fuerza:</strong> pocas reps muy pesadas (3–5), descansos largos (3–5 min). Cuando completas todas las series, sube el peso. Sirve para levantar más.</p>
        <p><strong>Hipertrofia:</strong> 8–12 reps cerca del fallo, descansos de 1.5–2 min. Primero sumas reps y, al llegar al máximo en todas las series, subes el peso. Sirve para ganar músculo.</p>
        <p>Puedes mezclarlas en una misma rutina (powerbuilding): un básico de fuerza primero y accesorios de hipertrofia después.</p>
      </>
    ),
  },
  progression: {
    title: '¿Cómo decide la app el peso?',
    body: (
      <>
        <p>Mira tu última sesión de ese ejercicio con el mismo objetivo:</p>
        <ul>
          <li>Si llegaste al <strong>máximo de reps en todas las series</strong>, sube el peso y vuelves al mínimo.</li>
          <li>Si no, <strong>mantén el peso</strong> y busca una rep más (o 5 s / 5 m más).</li>
          <li>Si <strong>dos sesiones seguidas</strong> no llegas al mínimo, baja ~10 % para recuperar (deload).</li>
        </ul>
        <p>Las series ya vienen llenas con la sugerencia; ajústalas si hoy te sientes distinto.</p>
      </>
    ),
  },
  e1rm: {
    title: '1RM estimado',
    body: (
      <>
        <p>Es el peso máximo que podrías levantar <strong>una vez</strong>, calculado a partir de tus series con la fórmula de Epley:</p>
        <p className="help-formula">peso × (1 + reps ÷ 30)</p>
        <p>Así se comparan sesiones distintas: 60 kg × 10 y 65 kg × 6 dan casi lo mismo (~80 kg). No hace falta que pruebes tu máximo real.</p>
      </>
    ),
  },
  kcal: {
    title: 'Calorías aproximadas',
    body: (
      <>
        <p>Se estiman con la fórmula estándar de METs:</p>
        <p className="help-formula">MET × tu peso (kg) × horas</p>
        <p>Pesas usa un MET de 3.5 (incluye descansos). En caminata y carrera el MET sube con tu velocidad.</p>
        <p>Es una estimación (±20–30 %): no conoce tu frecuencia cardiaca. Úsala para comparar tus semanas. Necesita que registres tu peso corporal.</p>
      </>
    ),
  },
}

/** Botón "?" que abre una explicación breve de un concepto. */
export function Help({ topic, label }: { topic: Topic; label?: string }) {
  const [open, setOpen] = useState(false)
  const t = TOPICS[topic]
  return (
    <>
      <button type="button" className="help-btn" onClick={() => setOpen(true)} aria-label={label ?? `Ayuda: ${t.title}`}>
        <CircleHelp size={16} aria-hidden />
      </button>
      {/* Portal: fuera de su contenedor, para no heredar estilos (p. ej. el encabezado en mayúsculas de la tabla) */}
      {open && createPortal(
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet help-sheet" role="dialog" aria-label={t.title} onClick={(e) => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>{t.title}</h2>
              <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Cerrar"><X aria-hidden /></button>
            </div>
            <div className="sheet-body help-body">{t.body}</div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

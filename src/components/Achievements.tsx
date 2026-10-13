import { useEffect, useMemo, useState } from 'react'
import { Lock } from 'lucide-react'
import { useStore } from '../lib/store'
import { useNav } from '../lib/nav'
import { evaluateAchievements, type AchievementGroup, type AchievementResult } from '../lib/achievements'

const GROUPS: AchievementGroup[] = ['Constancia', 'Fuerza', 'Cardio', 'Especiales']

/** Galería de logros (Progreso → Logros). */
export function AchievementsGallery() {
  const { state } = useStore()
  const all = useMemo(() => evaluateAchievements(state), [state])
  const done = all.filter((a) => a.done).length

  return (
    <>
      <section className="card">
        <div className="card-head">
          <h3>🏅 Tus logros</h3>
          <span className="muted small">{done} de {all.length}</span>
        </div>
        <div className="goal-track" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={all.length}>
          <div className="goal-fill done" style={{ width: `${(done / all.length) * 100}%` }} />
        </div>
      </section>
      {GROUPS.map((g) => (
        <section key={g} className="card">
          <h3>{g}</h3>
          <div className="badge-grid">
            {all.filter((a) => a.group === g).map((a) => <Badge key={a.id} a={a} />)}
          </div>
        </section>
      ))}
    </>
  )
}

function Badge({ a }: { a: AchievementResult }) {
  return (
    <div className={`badge-item ${a.done ? 'done' : 'locked'}`}>
      <span className="badge-emoji" aria-hidden>{a.done ? a.emoji : <Lock size={22} />}</span>
      <span className="badge-text">
        <strong>{a.name}</strong>
        <span className="muted small block">{a.description}</span>
        {!a.done && a.progress && <span className="small block badge-progress">{a.progress}</span>}
      </span>
    </div>
  )
}

/**
 * Vigila los logros: la primera vez marca los ya ganados sin avisar;
 * después, cada logro nuevo muestra un aviso que lleva a la galería.
 */
export function AchievementWatcher() {
  const { state, update } = useStore()
  const nav = useNav()
  const [toast, setToast] = useState<AchievementResult[]>([])
  const doneIds = useMemo(
    () => evaluateAchievements(state).filter((a) => a.done).map((a) => a.id),
    // Solo lo que afecta a los logros
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.workouts, state.cardio, state.bodyweight, state.settings.birthday, state.settings.trainingStart, state.settings.weeklyGoalDays],
  )

  useEffect(() => {
    const seen = state.achievementsSeen
    if (seen === null) {
      update((s) => ({ ...s, achievementsSeen: doneIds }))
      return
    }
    const fresh = doneIds.filter((id) => !seen.includes(id))
    if (!fresh.length) return
    const all = evaluateAchievements(state)
    setToast(all.filter((a) => fresh.includes(a.id)))
    update((s) => ({ ...s, achievementsSeen: [...(s.achievementsSeen ?? []), ...fresh] }))
  }, [doneIds]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!toast.length) return
    const t = setTimeout(() => setToast([]), 6000)
    return () => clearTimeout(t)
  }, [toast])

  if (!toast.length) return null
  return (
    <button
      className="achievement-toast"
      role="status"
      onClick={() => {
        setToast([])
        nav.go('progress', 'achievements')
      }}
    >
      <span className="badge-emoji" aria-hidden>{toast[0].emoji}</span>
      <span>
        <span className="small block">🏅 {toast.length > 1 ? `¡${toast.length} logros nuevos!` : '¡Logro desbloqueado!'}</span>
        <strong>{toast.map((t) => t.name).join(', ')}</strong>
      </span>
    </button>
  )
}

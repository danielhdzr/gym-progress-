import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface ConfirmOptions {
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface Dialog {
  /** Reemplazo de window.confirm(), que algunos navegadores y WebViews bloquean. */
  confirm: (opts: ConfirmOptions | string) => Promise<boolean>
  alert: (message: string) => Promise<void>
}

interface Pending extends ConfirmOptions {
  alertOnly: boolean
  resolve: (ok: boolean) => void
}

const DialogContext = createContext<Dialog | null>(null)

export function DialogProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null)

  const confirm = useCallback<Dialog['confirm']>(
    (opts) =>
      new Promise((resolve) =>
        setPending({ ...(typeof opts === 'string' ? { message: opts } : opts), alertOnly: false, resolve }),
      ),
    [],
  )

  const alert = useCallback<Dialog['alert']>(
    (message) => new Promise((resolve) => setPending({ message, alertOnly: true, resolve: () => resolve() })),
    [],
  )

  const close = (ok: boolean) => {
    pending?.resolve(ok)
    setPending(null)
  }

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {pending && (
        <div className="dialog-backdrop" onClick={() => close(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <p>{pending.message}</p>
            <div className="actions">
              {!pending.alertOnly && (
                <button className="secondary" onClick={() => close(false)}>
                  {pending.cancelLabel ?? 'Cancelar'}
                </button>
              )}
              <button className={pending.danger ? 'danger' : 'primary'} onClick={() => close(true)} autoFocus>
                {pending.confirmLabel ?? 'Aceptar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  )
}

export function useDialog() {
  const ctx = useContext(DialogContext)
  if (!ctx) throw new Error('useDialog fuera de DialogProvider')
  return ctx
}

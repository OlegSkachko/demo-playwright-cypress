import { createContext, useCallback, useContext, useState } from 'react'

const ToastContext = createContext(null)
const ICONS = { success: '✓', error: '!', info: '🔔' }

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const notify = useCallback((text, kind = 'success') => {
    const id = Math.random().toString(36).slice(2)
    setToasts((t) => [...t, { id, text, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'info' ? 5000 : 2600)
  }, [])

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toasts">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.kind}`} data-testid="toast" data-kind={t.kind}>
            <span className="toast__icon">{ICONS[t.kind]}</span> {t.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

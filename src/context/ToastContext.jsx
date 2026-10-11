import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastCtx = createContext(null)
let seq = 1

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const push = useCallback((message, kind = 'info') => {
    const id = seq++
    setToasts((t) => [...t, { id, message, kind }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400)
  }, [])
  const value = useMemo(() => ({ toasts, notify: push }), [toasts, push])
  return <ToastCtx.Provider value={value}>{children}</ToastCtx.Provider>
}

export function useToast() {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

import { useEffect } from 'react'
import { Inbox, TriangleAlert } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'

// Modal / drawer with Escape-to-close + basic focus handling.
export function Modal({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="card w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close dialog" className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/70" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="absolute inset-y-0 left-0 w-[86%] max-w-sm overflow-y-auto bg-[var(--color-surface)] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Close filters" className="rounded-lg border border-[var(--color-border)] px-2.5 py-1.5">✕</button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Toasts() {
  const { toasts } = useToast()
  return (
    <div aria-live="polite" className="fixed bottom-4 right-4 z-[60] flex w-[min(92vw,360px)] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className="card-elevated border-l-4 p-3 text-sm" style={{ borderLeftColor: t.kind === 'error' ? '#fb7185' : t.kind === 'success' ? '#10D9A0' : '#38bdf8' }}>
          {t.message}
        </div>
      ))}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div role="tablist" aria-label="Sections" className="flex flex-wrap gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => onChange(t.id)}
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${active === t.id ? 'bg-[#2855FF] text-white' : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <div aria-hidden className={`animate-pulse rounded-xl bg-black/5 ${className}`} />
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4" aria-label="Loading products">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card overflow-hidden"><Skeleton className="aspect-[16/10] !rounded-none" /><div className="space-y-2 p-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/3" /></div></div>
      ))}
    </div>
  )
}

export function EmptyState({ title, hint, action }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <Inbox size={36} className="text-[var(--color-muted)]" aria-hidden />
      <h3 className="text-lg font-bold">{title}</h3>
      {hint && <p className="max-w-md text-sm text-[var(--color-muted)]">{hint}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', hint = 'Please try again.', onRetry }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-10 text-center">
      <TriangleAlert size={36} className="text-[#fbbf24]" aria-hidden />
      <h3 className="text-lg font-bold">{title}</h3>
      {hint && <p className="max-w-md text-sm text-[var(--color-muted)]">{hint}</p>}
      {onRetry && <button onClick={onRetry} className="btn-primary px-4 py-2 text-sm">Retry</button>}
    </div>
  )
}

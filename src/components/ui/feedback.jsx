import { useId, useRef } from 'react'
import { Inbox, TriangleAlert, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext.jsx'
import useFocusTrap from '../../hooks/useFocusTrap.js'
import Skeleton from './Skeleton.jsx'

export { Skeleton }

export function Modal({ open, onClose, title, children }) {
  const panel = useRef(null)
  const titleId = useId()
  useFocusTrap({ open, onClose, ref: panel })
  if (!open) return null
  return <div className="ui-overlay" onClick={onClose}>
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="ui-modal" onClick={event => event.stopPropagation()}>
      <div className="ui-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close dialog" className="ui-close"><X size={20} aria-hidden="true" /></button>
      </div>
      {children}
    </div>
  </div>
}

export function Drawer({ open, onClose, title, children }) {
  const panel = useRef(null)
  const titleId = useId()
  useFocusTrap({ open, onClose, ref: panel })
  if (!open) return null
  return <div className="ui-overlay ui-drawer-overlay" onClick={onClose}>
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId} className="ui-drawer" onClick={event => event.stopPropagation()}>
      <div className="ui-dialog-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" onClick={onClose} aria-label="Close filters" className="ui-close"><X size={20} aria-hidden="true" /></button>
      </div>
      {children}
    </div>
  </div>
}

export function Toasts() {
  const { toasts } = useToast()
  return <div aria-live="polite" aria-atomic="false" aria-relevant="additions text" className="toast-stack">
    {toasts.map(toast => <div key={toast.id} className={`ui-toast ui-toast--${toast.kind}`}>{toast.message}</div>)}
  </div>
}

export function Tabs({ tabs, active, onChange, idPrefix = 'product-sections' }) {
  function keydown(event) {
    const current = tabs.findIndex(tab => tab.id === active)
    let next
    if (event.key === 'ArrowRight') next = (current + 1) % tabs.length
    else if (event.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = tabs.length - 1
    else return
    event.preventDefault()
    onChange(tabs[next].id)
    event.currentTarget.querySelectorAll('[role="tab"]')[next]?.focus()
  }
  return <div role="tablist" aria-label="Sections" className="ui-tabs" onKeyDown={keydown}>
    {tabs.map(tab => <button type="button" key={tab.id} role="tab" id={`${idPrefix}-tab-${tab.id}`} aria-controls={`${idPrefix}-panel-${tab.id}`} aria-selected={active === tab.id} tabIndex={active === tab.id ? 0 : -1} onClick={() => onChange(tab.id)} className="ui-tab">{tab.label}</button>)}
  </div>
}

export function ProductGridSkeleton({ count = 8 }) {
  return <div className="product-grid" aria-label="Loading products" role="status">
    {Array.from({ length: count }, (_, index) => <div key={index} className="card overflow-hidden">
      <Skeleton className="aspect-[3/4] !rounded-none" />
      <div className="space-y-3 p-4"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-8 w-2/3" /></div>
    </div>)}
    <span className="sr-only">Loading products</span>
  </div>
}

export function EmptyState({ title, hint, action }) {
  return <div className="card ui-state">
    <Inbox size={36} className="ui-state-icon" aria-hidden="true" />
    <h3>{title}</h3>
    {hint && <p>{hint}</p>}
    {action}
  </div>
}

export function ErrorState({ title = 'Something went wrong', hint = 'Please try again.', onRetry }) {
  return <div className="card ui-state ui-state--error">
    <TriangleAlert size={36} className="ui-state-icon" aria-hidden="true" />
    <h3>{title}</h3>
    {hint && <p>{hint}</p>}
    {onRetry && <button type="button" onClick={onRetry} className="ui-button btn-primary">Retry</button>}
  </div>
}

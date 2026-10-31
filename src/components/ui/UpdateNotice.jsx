import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { RefreshCw, X } from 'lucide-react'

// Updates never interrupt an order. Refresh is an explicit visitor action.
export default function UpdateNotice() {
  const { pathname } = useLocation()
  const [worker, setWorker] = useState(null)
  const [dismissed, setDismissed] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    let alive = true
    const cleanups = []
    const offerUpdate = registration => {
      if (alive && registration.waiting && navigator.serviceWorker.controller) {
        setWorker(registration.waiting)
        setDismissed(false)
      }
    }
    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        if (!alive) return
        offerUpdate(registration)
        const found = () => {
          const installing = registration.installing
          if (!installing) return
          const changed = () => {
            if (installing.state === 'installed') offerUpdate(registration)
          }
          installing.addEventListener('statechange', changed)
          cleanups.push(() => installing.removeEventListener('statechange', changed))
        }
        registration.addEventListener('updatefound', found)
        cleanups.push(() => registration.removeEventListener('updatefound', found))
        registration.update().catch(() => {})
      } catch (error) {
        console.warn('[GameVault] Offline support unavailable:', error.message)
      }
    }
    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register, { once: true })
      cleanups.push(() => window.removeEventListener('load', register))
    }
    return () => { alive = false; cleanups.forEach(cleanup => cleanup()) }
  }, [])
  if (!worker || dismissed || /(?:^|\/)checkout(?:\/|$)|(?:^|\/)orders(?:\/|$)/.test(pathname)) return null
  const refresh = () => {
    setRefreshing(true)
    navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true })
    worker.postMessage({ type: 'SKIP_WAITING' })
  }
  return <aside className="update-notice" aria-label="Store update" role="status">
    <RefreshCw size={18} aria-hidden="true" /><span>Update available</span>
    <button type="button" onClick={refresh} disabled={refreshing}>{refreshing ? 'Refreshing…' : 'Refresh'}</button>
    <button type="button" className="update-dismiss" aria-label="Dismiss update notice" onClick={() => setDismissed(true)}><X size={18} aria-hidden="true" /></button>
  </aside>
}

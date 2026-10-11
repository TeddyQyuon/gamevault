import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { getMySubscriptions, getOrders } from '../services/orderService.js'

const OrdersCtx = createContext(null)

// Thin refresh bus + API-backed reads. Orders, codes and subscriptions live in
// MySQL and are fetched per user — nothing is seeded or stored locally.
export function OrdersProvider({ children }) {
  const [ordersVersion, setOrdersVersion] = useState(0)
  const [subs, setSubs] = useState([])
  const [subsStatus, setSubsStatus] = useState('idle')

  const refreshOrders = useCallback(() => setOrdersVersion((v) => v + 1), [])

  const refreshSubs = useCallback(async () => {
    setSubsStatus('loading')
    try {
      setSubs(await getMySubscriptions())
      setSubsStatus('ready')
    } catch {
      setSubs([])
      setSubsStatus('error')
    }
  }, [])

  useEffect(() => {
    refreshSubs()
  }, [refreshSubs, ordersVersion])

  const api = useMemo(() => ({
    ordersVersion,
    refreshOrders,
    subs,
    subsStatus,
    refreshSubs,
    // Local refresh helper for the dashboard (server is the source of truth).
    fetchOrders: () => getOrders().catch(() => []),
  }), [ordersVersion, refreshOrders, subs, subsStatus, refreshSubs])

  return <OrdersCtx.Provider value={api}>{children}</OrdersCtx.Provider>
}

export function useOrders() {
  const ctx = useContext(OrdersCtx)
  if (!ctx) throw new Error('useOrders must be used inside OrdersProvider')
  return ctx
}

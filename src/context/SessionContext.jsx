import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { apiGet, apiPost, ApiError, getStripeMode } from '../services/api.js'

// REAL authentication: bcrypt password hashes + HttpOnly session cookie,
// verified on every request by the Express API. Nothing sensitive lives in
// localStorage. Route guards are still UX-only; the server enforces ownership.
const SessionCtx = createContext(null)

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | authed | guest

  const refresh = useCallback(async () => {
    try {
      const data = await apiGet('/api/me')
      setUser(data.user)
      setStatus('authed')
      return data.user
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setUser(null)
        setStatus('guest')
        return null
      }
      // Backend down: stay usable for browsing, but logged out.
      setUser(null)
      setStatus('guest')
      return null
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const api = useMemo(() => ({
    user,
    status,
    loading: status === 'loading',
    // Checkout contact prefill comes from the server profile.
    profile: user ? { firstName: user.name.split(' ')[0] || '', lastName: user.name.split(' ').slice(1).join(' ') || '', email: user.email, country: user.country || 'Singapore' } : { firstName: '', lastName: '', email: '', country: 'Singapore' },
    refresh,
    login: async (email, password) => {
      const data = await apiPost('/api/auth/login', { email, password })
      setUser(data.user)
      setStatus('authed')
      return data.user
    },
    register: async ({ name, email, password, country }) => {
      const data = await apiPost('/api/auth/register', { name, email, password, country })
      setUser(data.user)
      setStatus('authed')
      return data.user
    },
    logout: async () => {
      try {
        await apiPost('/api/auth/logout', {})
      } catch {
        // Even if the request fails, drop local state.
      }
      setUser(null)
      setStatus('guest')
    },
  }), [user, status, refresh])

  return <SessionCtx.Provider value={api}>{children}</SessionCtx.Provider>
}

export function useSession() {
  const ctx = useContext(SessionCtx)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}

// Live/test payment mode from /api/health. Returns 'test-mode' | 'live' |
// 'unconfigured' | null (still loading). Copy rule: show test-mode wording
// ONLY when mode === 'test-mode'; every other state (including loading)
// uses live-safe wording so we never promise "no real charge" on a live
// backend. const live = mode !== 'test-mode'.
export function useStripeMode() {
  const [mode, setMode] = useState(null)
  useEffect(() => {
    let alive = true
    getStripeMode().then((m) => { if (alive) setMode(m) })
    return () => { alive = false }
  }, [])
  return mode
}

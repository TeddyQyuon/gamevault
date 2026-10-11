import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { readJSON, writeJSON, KEYS } from '../utils/storage.js'

const WishCtx = createContext(null)

export function WishlistProvider({ children }) {
  const [ids, setIds] = useState(() => {
    const raw = readJSON(KEYS.WISHLIST, [])
    return Array.isArray(raw) ? raw.filter((x) => typeof x === 'string') : []
  })
  useEffect(() => writeJSON(KEYS.WISHLIST, ids), [ids])
  const api = useMemo(() => ({
    ids,
    has: (id) => ids.includes(id),
    toggle: (id) => setIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
  }), [ids])
  return <WishCtx.Provider value={api}>{children}</WishCtx.Provider>
}

export function useWishlist() {
  const ctx = useContext(WishCtx)
  if (!ctx) throw new Error('useWishlist must be used inside WishlistProvider')
  return ctx
}

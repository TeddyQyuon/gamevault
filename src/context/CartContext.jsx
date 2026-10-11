import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { findVariant } from '../data/products.js'
import { readJSON, writeJSON, KEYS } from '../utils/storage.js'
import { cartTotals } from '../services/orderService.js'
import { getProducts, getCatalogueError } from '../services/catalogService.js'
import { variantInStock, variantQuantityLimit } from '../utils/stock.js'

// Cart identity = variant ID. Same variant merges (qty+); different
// editions / billing periods stay as separate lines.
const CartCtx = createContext(null)

function sanitize(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((l) => l && typeof l.variantId === 'string')
    .map((l) => ({ variantId: l.variantId, qty: Math.max(1, Math.min(Number(l.qty) || 1, 5)) }))
}

export function CartProvider({ children }) {
  const [lines, setLines] = useState(() => sanitize(readJSON(KEYS.CART, [])))
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let alive = true
    getProducts().catch(() => []).then(() => {
      if (!alive) return
      if (!getCatalogueError()) setLines((previous) => previous.filter((line) => findVariant(line.variantId)))
      setReady(true)
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    writeJSON(KEYS.CART, lines)
  }, [lines])

  const api = useMemo(() => ({
    lines,
    ready,
    count: lines.reduce((s, l) => s + l.qty, 0),
    totals: (promo) => cartTotals(lines, promo),
    add: (variantId, qty = 1) => {
      const found = findVariant(variantId)
      if (!ready || !found || !variantInStock(found.variant) || found.product.isPreview) return false
      setLines((prev) => {
        const at = prev.find((l) => l.variantId === variantId)
        const cap = variantQuantityLimit(found.variant)
        if (at) return prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.min(l.qty + qty, cap) } : l))
        return [...prev, { variantId, qty: Math.min(qty, cap) }]
      })
      return true
    },
    setQty: (variantId, qty) => {
      const found = findVariant(variantId)
      const cap = found ? variantQuantityLimit(found.variant) : 0
      if (!cap) return
      setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, qty: Math.max(1, Math.min(qty, cap)) } : l)))
    },
    remove: (variantId) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)),
    clear: () => setLines([]),
  }), [lines, ready])

  return <CartCtx.Provider value={api}>{children}</CartCtx.Provider>
}

export function useCart() {
  const ctx = useContext(CartCtx)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}

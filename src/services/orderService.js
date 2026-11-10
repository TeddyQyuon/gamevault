// Orders + checkout, now backed by the Express API.
//
// Two layers here — don't confuse them:
// 1. DISPLAY estimators (priceLines/cartTotals/applyPromo): instant cart math
//    from local fixture data. The SERVER recomputes everything authoritatively;
//    these numbers are only shown, never charged.
// 2. API calls (getOrders/getOrderById/validatePromo/create*Session/...):
//    authenticated requests; ownership + pricing enforced server-side.

import { findVariant } from '../data/products.js'
import { apiGet, apiPost } from './api.js'
import { applyPromo } from './promoPolicy.js'
export { DEMO_PROMO, applyPromo } from './promoPolicy.js'

/** Resolve cart lines against local data; drops unknown variants. */
export function priceLines(lines) {
  return lines
    .map((l) => {
      const found = findVariant(l.variantId)
      if (!found) return null
      const qty = Math.max(1, Math.min(l.qty || 1, 5))
      return { ...l, qty, product: found.product, variant: found.variant, lineTotal: found.variant.priceCents * qty }
    })
    .filter(Boolean)
}

export function cartTotals(lines, promoCode = '') {
  const priced = priceLines(lines)
  const subtotal = priced.reduce((s, l) => s + l.lineTotal, 0)
  const promo = promoCode ? applyPromo(subtotal, promoCode) : { ok: false, discountCents: 0 }
  const discount = promo.ok ? promo.discountCents : 0
  return { priced, subtotal, discount, total: Math.max(0, subtotal - discount), promo }
}

// ---- Shop API (ownership enforced server-side) ----
// Checkout + promo + single-order reads work for guests (no login). Order
// history / subscriptions stay login-only. Guest order reads pass the Stripe
// session id as the access token (see getOrderById).

export async function getOrders() {
  const data = await apiGet('/api/orders')
  return data.orders || []
}

export async function getOrderById(id, sessionId) {
  try {
    const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
    const data = await apiGet(`/api/orders/${encodeURIComponent(id)}${qs}`)
    return data.order
  } catch (err) {
    if (err?.status === 404) return null
    throw err
  }
}

/** Server-validated promo preview (no order created). */
export async function validatePromo(items, promoCode) {
  return apiPost('/api/promos/validate', { items, promoCode })
}

// In-flight guard: the button also disables, but this stops double-fires from
// any path (keyboard, double-tap). The SERVER fingerprint is the real guarantee.
let sessionInFlight = false

async function guardedSessionCall(payload, kind) {
  if (sessionInFlight) throw new Error('Payment already starting — please wait.')
  sessionInFlight = true
  try {
    const path = kind === 'subscription' ? '/api/checkout/subscriptions' : '/api/checkout/sessions'
    return await apiPost(path, payload)
  } finally {
    sessionInFlight = false
  }
}

/** One-time cart → returns { url, orderId }. Redirect the browser to url. */
export function createOneTimeSession({ items, promoCode, contact }) {
  return guardedSessionCall({ items, promoCode, contact }, 'payment')
}

/** Exactly one recurring plan → returns { url, orderId }. Cart is untouched. */
export function createSubscriptionSession({ variantId, contact }) {
  return guardedSessionCall({ variantId, contact }, 'subscription')
}

/** Stripe Customer Portal for the logged-in user (server-owned customer id). */
export function createPortalSession() {
  return apiPost('/api/billing/portal', {})
}

export async function getMySubscriptions() {
  const data = await apiGet('/api/subscriptions/me')
  return data.subscriptions || []
}

/** Reveal encrypted key with statutory waiver audit trail */
export async function revealOrderKey({ orderId, itemId, allocationId, sessionId }) {
  const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
  const itemPath = itemId ? `/items/${encodeURIComponent(itemId)}` : ''
  return apiPost(`/api/orders/${encodeURIComponent(orderId)}${itemPath}/reveal/${encodeURIComponent(allocationId)}${qs}`, { sessionId })
}

// Test seam: reset the in-flight flag between tests.
export function __resetSessionGuard() {
  sessionInFlight = false
}

// Shared by display estimates and the stateless checkout/promo handlers.
export const DEMO_PROMO = {
  code: 'GAMER10',
  description: 'S$10 off one-time orders over S$50',
  minSubtotalCents: 5000,
  discountCents: 1000,
}

export function applyPromo(subtotalCents, code) {
  const clean = typeof code === 'string' ? code.trim().toUpperCase() : ''
  if (!clean) return { ok: false, discountCents: 0, message: 'Enter a promo code.' }
  if (clean !== DEMO_PROMO.code) return { ok: false, discountCents: 0, message: 'That code is not valid.' }
  if (!Number.isSafeInteger(subtotalCents) || subtotalCents < DEMO_PROMO.minSubtotalCents) {
    return { ok: false, discountCents: 0, message: 'Needs a subtotal of at least S$50.' }
  }
  return { ok: true, discountCents: DEMO_PROMO.discountCents, message: `${DEMO_PROMO.code} applied! You saved S$10.00` }
}

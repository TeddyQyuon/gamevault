import crypto from 'node:crypto'
import { badRequest } from '../errors.js'

// Server-authoritative pricing. The browser sends ONLY variant ids, quantities
// and a promo code — prices, discounts, currency and totals are recomputed here
// from MySQL. Loaders are injected so this module unit-tests without a database.

export const CURRENCY = 'SGD'
export const MAX_QTY = 5

export function normaliseLines(items) {
  if (!Array.isArray(items) || items.length === 0) throw badRequest('EMPTY_CART', 'Your cart is empty.')
  if (items.length > 20) throw badRequest('TOO_MANY_LINES', 'Too many distinct items (max 20).')
  return items.map((l) => {
    const variantId = typeof l?.variantId === 'string' ? l.variantId : ''
    const qty = Number(l?.qty)
    if (!variantId) throw badRequest('UNKNOWN_VARIANT', 'A cart item is missing its variant.')
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) {
      throw badRequest('BAD_QTY', `Quantity for ${variantId} must be 1–${MAX_QTY}.`)
    }
    return { variantId, qty }
  })
}

/**
 * Price a one-time cart. Throws 400/422 HttpErrors on any tampering.
 * loaders: { findVariant(id) -> row|null, findPromo(code) -> row|null }
 * A variant row carries: id, label, priceCents, stock, billingType,
 * billingInterval, stripePriceId, active, productTitle, productType,
 * publication, availability, fulfilment, trackInventory, availableCount,
 * imagePath, region. fulfilment passes through to priced lines so callers
 * can enforce the LIVE rule: demo_test products are never sold for real money.
 */
export async function priceOneTimeCart({ items, promoCode }, loaders) {
  const lines = normaliseLines(items)
  const priced = []
  const recurring = []
  for (const l of lines) {
    const row = await loaders.findVariant(l.variantId)
    if (!row) throw badRequest('UNKNOWN_VARIANT', `Unknown item: ${l.variantId}.`)
    if (!row.active) throw badRequest('VARIANT_INACTIVE', `${row.productTitle} (${row.label}) is no longer available.`)
    if (row.billingType !== 'one_time') {
      recurring.push({ variantId: l.variantId, title: row.productTitle, label: row.label })
      continue
    }
    checkPurchasable(row, l.qty, l.playerRef)
    if (row.fulfilment !== 'manual' && row.stock !== 999 && l.qty > row.stock) {
      throw badRequest('OUT_OF_STOCK', `Only ${row.stock} left for ${row.productTitle} (${row.label}).`)
    }
    priced.push({
      variantId: row.id, productTitle: row.productTitle, variantLabel: row.label,
      unitCents: row.priceCents, qty: l.qty, lineTotalCents: row.priceCents * l.qty,
      productType: row.productType || 'gift_card', imagePath: row.imagePath || null,
      playerRef: (l.playerRef || '').trim() || null, region: row.region || '',
      trackInventory: row.fulfilment !== 'manual' && Boolean(row.trackInventory),
      fulfilment: row.fulfilment || 'demo_test',
      deliveryWindowMinutes: row.fulfilment === 'manual' ? 60 : null,
    })
  }
  if (recurring.length) {
    const err = badRequest(
      'MIXED_CART',
      'Your cart mixes one-time items with a recurring subscription. Subscriptions check out separately — your cart stays intact.',
    )
    err.details = { recurring }
    throw err
  }
  if (!priced.length) throw badRequest('EMPTY_CART', 'Your cart is empty.')

  const subtotal = priced.reduce((s, l) => s + l.lineTotalCents, 0)
  let promo = null
  let discount = 0
  const clean = (promoCode || '').trim().toUpperCase()
  if (clean) {
    const row = await loaders.findPromo(clean)
    if (!row || !row.active) throw badRequest('UNKNOWN_PROMO', 'That promo code is not valid.')
    if (subtotal < row.minSubtotalCents) {
      throw badRequest('PROMO_MINIMUM', `That code needs a subtotal of at least S$${(row.minSubtotalCents / 100).toFixed(2)}.`)
    }
    promo = row.code
    discount = Math.min(row.discountCents, subtotal)
  }
  return {
    lines: priced, subtotalCents: subtotal, discountCents: discount,
    promoCode: promo, totalCents: subtotal - discount, currency: CURRENCY,
  }
}

/** Price exactly one recurring plan (subscription checkout). Qty is always 1. */
export async function priceSubscriptionVariant(variantId, loaders) {
  if (typeof variantId !== 'string' || !variantId) throw badRequest('UNKNOWN_VARIANT', 'Choose a subscription plan.')
  const row = await loaders.findVariant(variantId)
  if (!row) throw badRequest('UNKNOWN_VARIANT', `Unknown plan: ${variantId}.`)
  if (!row.active) throw badRequest('VARIANT_INACTIVE', `${row.productTitle} is no longer available.`)
  if (row.billingType !== 'recurring' || !row.billingInterval) {
    throw badRequest('NOT_RECURRING', `${row.productTitle} (${row.label}) is a one-time purchase, not a recurring plan.`)
  }
  checkPurchasable(row, 1)
  return {
    variantId: row.id, productTitle: row.productTitle, variantLabel: row.label,
    unitCents: row.priceCents, qty: 1, lineTotalCents: row.priceCents,
    interval: row.billingInterval, stripePriceId: row.stripePriceId || null,
    subtotalCents: row.priceCents, discountCents: 0, promoCode: null,
    totalCents: row.priceCents, currency: CURRENCY,
    productType: row.productType || 'recurring_service', imagePath: row.imagePath || null,
    fulfilment: row.fulfilment || 'demo_test',
  }
}

// Purchase gating, enforced on the backend (frontend buttons are cosmetic).
// Only published + available items with backing stock can be bought.
export function checkPurchasable(row, qty, playerRef) {
  const name = `${row.productTitle} (${row.label})`
  if (row.publication && row.publication !== 'published') {
    throw badRequest('PRODUCT_UNAVAILABLE', `${name} is not currently available.`)
  }
  if (row.availability === 'coming_soon') {
    throw badRequest('COMING_SOON', `${name} is coming soon — it cannot be purchased yet.`)
  }
  if (row.availability === 'out_of_stock') {
    throw badRequest('OUT_OF_STOCK', `${name} is out of stock.`)
  }
  if (!Number.isSafeInteger(Number(row.priceCents)) || Number(row.priceCents) < 1) {
    throw badRequest('PRICE_UNAVAILABLE', `${name} does not have a verified selling price yet.`)
  }
  if (row.fulfilment !== 'manual' && row.trackInventory && Number(row.availableCount || 0) < qty) {
    throw badRequest('OUT_OF_STOCK', `Only ${row.availableCount || 0} left for ${name}.`)
  }
  // Direct top-ups need the supplier's required player identifier — nothing
  // else (never account passwords).
  if (row.productType === 'direct_topup' && !(playerRef || '').trim()) {
    throw badRequest('PLAYER_REF_REQUIRED', `${name} needs your in-game player ID to deliver.`)
  }
}

/** Canonical cart fingerprint → attempt reuse + Stripe idempotency keys. */
export function fingerprint(mode, lines, promoCode, email) {
  const canon = lines
    .map((l) => `${l.variantId}:${l.qty}`)
    .sort()
    .join('|')
  return crypto
    .createHash('sha256')
    .update(`${mode}~${canon}~${(promoCode || '').toUpperCase()}~${(email || '').toLowerCase().trim()}`)
    .digest('hex')
}

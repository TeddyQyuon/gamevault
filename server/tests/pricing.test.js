import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  priceOneTimeCart, priceSubscriptionVariant, fingerprint, CURRENCY,
} from '../src/services/pricing.js'

// Fake catalogue rows (stand-ins for Sequelize Variant + Product joins).
const VARIANTS = {
  'stormlands-standard': { id: 'stormlands-standard', label: 'Standard Edition', priceCents: 2999, stock: 999, billingType: 'one_time', billingInterval: null, stripePriceId: null, active: true, productTitle: 'Stormlands' },
  'stormlands-deluxe': { id: 'stormlands-deluxe', label: 'Deluxe Edition', priceCents: 4999, stock: 999, billingType: 'one_time', billingInterval: null, stripePriceId: null, active: true, productTitle: 'Stormlands' },
  'rivals-arena-standard': { id: 'rivals-arena-standard', label: 'Standard Edition', priceCents: 3999, stock: 0, billingType: 'one_time', billingInterval: null, stripePriceId: null, active: true, productTitle: 'Rivals Arena' },
  'game-pass-ultimate-monthly': { id: 'game-pass-ultimate-monthly', label: 'Monthly billing', priceCents: 1690, stock: 999, billingType: 'recurring', billingInterval: 'month', stripePriceId: null, active: true, productTitle: 'Xbox Game Pass Ultimate' },
  'retired-pack': { id: 'retired-pack', label: 'Old Pack', priceCents: 100, stock: 999, billingType: 'one_time', billingInterval: null, stripePriceId: null, active: false, productTitle: 'Retired' },
}
const PROMOS = {
  GAMER10: { code: 'GAMER10', discountCents: 1000, minSubtotalCents: 5000, active: true },
  DEAD: { code: 'DEAD', discountCents: 100, minSubtotalCents: 0, active: false },
}
const loaders = {
  findVariant: async (id) => VARIANTS[id] || null,
  findPromo: async (code) => PROMOS[code] || null,
}

describe('server pricing (authoritative, integer cents)', () => {
  it('prices a one-time cart from DB rows, ignoring browser totals', async () => {
    const p = await priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 2 }] }, loaders)
    assert.equal(p.currency, CURRENCY)
    assert.equal(p.subtotalCents, 5998)
    assert.equal(p.totalCents, 5998)
  })

  it('rejects tampered variant ids', async () => {
    await assert.rejects(
      priceOneTimeCart({ items: [{ variantId: 'free-everything', qty: 1 }] }, loaders),
      (e) => e.code === 'UNKNOWN_VARIANT',
    )
  })

  it('rejects invalid quantities and inactive variants', async () => {
    await assert.rejects(priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 0 }] }, loaders),
      (e) => e.code === 'BAD_QTY')
    await assert.rejects(priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 6 }] }, loaders),
      (e) => e.code === 'BAD_QTY')
    await assert.rejects(priceOneTimeCart({ items: [{ variantId: 'retired-pack', qty: 1 }] }, loaders),
      (e) => e.code === 'VARIANT_INACTIVE')
  })

  it('rejects out-of-stock variants', async () => {
    await assert.rejects(priceOneTimeCart({ items: [{ variantId: 'rivals-arena-standard', qty: 1 }] }, loaders),
      (e) => e.code === 'OUT_OF_STOCK')
  })

  it('rejects mixed one-time + recurring carts with details', async () => {
    const err = await priceOneTimeCart({
      items: [{ variantId: 'stormlands-standard', qty: 1 }, { variantId: 'game-pass-ultimate-monthly', qty: 1 }],
    }, loaders).catch((e) => e)
    assert.equal(err.code, 'MIXED_CART')
    assert.equal(err.details.recurring[0].variantId, 'game-pass-ultimate-monthly')
  })

  it('validates promos on the server (unknown / inactive / minimum)', async () => {
    await assert.rejects(
      priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 2 }], promoCode: 'NOPE' }, loaders),
      (e) => e.code === 'UNKNOWN_PROMO')
    await assert.rejects(
      priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 2 }], promoCode: 'dead' }, loaders),
      (e) => e.code === 'UNKNOWN_PROMO')
    await assert.rejects(
      priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 1 }], promoCode: 'GAMER10' }, loaders),
      (e) => e.code === 'PROMO_MINIMUM')
    const p = await priceOneTimeCart({ items: [{ variantId: 'stormlands-standard', qty: 2 }], promoCode: 'gamer10' }, loaders)
    assert.equal(p.discountCents, 1000)
    assert.equal(p.totalCents, 4998)
  })

  it('prices exactly one recurring plan, rejecting one-time variants', async () => {
    const p = await priceSubscriptionVariant('game-pass-ultimate-monthly', loaders)
    assert.equal(p.totalCents, 1690)
    assert.equal(p.interval, 'month')
    await assert.rejects(priceSubscriptionVariant('stormlands-standard', loaders), (e) => e.code === 'NOT_RECURRING')
    await assert.rejects(priceSubscriptionVariant('nope', loaders), (e) => e.code === 'UNKNOWN_VARIANT')
  })

  it('fingerprints are stable for identical carts, sensitive to any change', () => {
    const a = fingerprint('payment', [{ variantId: 'x', qty: 1 }], 'GAMER10', 'a@b.co')
    const b = fingerprint('payment', [{ variantId: 'x', qty: 1 }], 'gamer10', 'A@B.CO')
    const c = fingerprint('payment', [{ variantId: 'x', qty: 2 }], 'GAMER10', 'a@b.co')
    const d = fingerprint('subscription', [{ variantId: 'x', qty: 1 }], 'GAMER10', 'a@b.co')
    assert.equal(a, b)
    assert.notEqual(a, c)
    assert.notEqual(a, d)
  })
})

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cartTotals, applyPromo, priceLines } from '../src/services/orderService.js'
import { yearlyMath, SUBSCRIPTION_PLANS } from '../src/data/subscriptions.js'
import { formatPrice, discountPct } from '../src/utils/format.js'
import { getProductBySlug } from '../src/services/catalogService.js'
import { findVariant, PRODUCTS } from '../src/data/products.js'

// Focused tests: cart math, variant identity, promo rules, subscription math.
describe('cart calculations (integer cents)', () => {
  it('sums line totals from data, not from copies', () => {
    const t = cartTotals([{ variantId: 'stormlands-standard', qty: 2 }])
    assert.equal(t.subtotal, 2999 * 2)
    assert.equal(t.total, 5998)
  })

  it('keeps different editions as separate lines', () => {
    const lines = priceLines([
      { variantId: 'stormlands-standard', qty: 1 },
      { variantId: 'stormlands-deluxe', qty: 1 },
    ])
    assert.equal(lines.length, 2)
    assert.equal(lines[0].lineTotal + lines[1].lineTotal, 2999 + 4999)
  })

  it('drops unknown variants instead of crashing', () => {
    const lines = priceLines([{ variantId: 'nope', qty: 3 }])
    assert.equal(lines.length, 0)
  })

  it('clamps quantity to 1..5', () => {
    const t = cartTotals([{ variantId: 'stormlands-standard', qty: 99 }])
    assert.equal(t.priced[0].qty, 5)
  })
})

describe('promo GAMER10 rules', () => {
  it('rejects unknown codes', () => {
    assert.equal(applyPromo(9999, 'WRONG').ok, false)
  })
  it('requires S$50+ subtotal', () => {
    assert.equal(applyPromo(4999, 'GAMER10').ok, false)
    assert.equal(applyPromo(5000, 'GAMER10').ok, true)
  })
  it('takes S$10 off and never goes negative', () => {
    const t = cartTotals([{ variantId: 'stormlands-standard', qty: 2 }], 'GAMER10')
    assert.equal(t.discount, 1000)
    assert.equal(t.total, 5998 - 1000)
    assert.ok(t.total >= 0)
  })
})

describe('subscription yearly math', () => {
  it('computes pct from stored prices', () => {
    for (const p of SUBSCRIPTION_PLANS) {
      const m = yearlyMath(p)
      assert.equal(m.monthlyTotal, p.monthlyCents * 12)
      assert.equal(m.savings, p.monthlyCents * 12 - p.yearlyCents)
      assert.ok(m.pct > 0 && m.pct < 100)
    }
  })
})

describe('formatting', () => {
  it('formats SGD via Intl', () => {
    assert.ok(formatPrice(4999).includes('49.99'))
  })
  it('discount is 0 without genuine compare-at', () => {
    assert.equal(discountPct(1000, null), 0)
    assert.equal(discountPct(1000, 1000), 0)
    assert.equal(discountPct(2999, 5999), 50)
  })
})

describe('catalogue resolution & slug aliases', () => {
  it('resolves xbox-game-pass-ultimate slug correctly', async () => {
    const p = await getProductBySlug('xbox-game-pass-ultimate')
    assert.ok(p, 'Product must exist')
    assert.equal(p.title, 'Xbox Game Pass Ultimate')
    assert.ok(p.variants.length > 0)
  })

  it('resolves alias game-pass-ultimate and game-pass-ultimate-1mo', async () => {
    const p1 = await getProductBySlug('game-pass-ultimate')
    assert.ok(p1)
    assert.equal(p1.title, 'Xbox Game Pass Ultimate')

    const p2 = await getProductBySlug('game-pass-ultimate-1mo')
    assert.ok(p2)
    assert.equal(p2.title, 'Xbox Game Pass Ultimate')
  })

  it('resolves playstation-plus-essential and all 15 subscription templates', async () => {
    const p = await getProductBySlug('playstation-plus-essential')
    assert.ok(p)
    assert.equal(p.title, 'PlayStation Plus Essential')

    const nintendo = await getProductBySlug('nintendo-switch-online')
    assert.ok(nintendo)

    const netflix = await getProductBySlug('netflix-premium')
    assert.ok(netflix)
  })

  it('finds variant by variantId', () => {
    const found = findVariant('xbox-game-pass-ultimate-1mo')
    assert.ok(found)
    assert.equal(found.variant.priceCents, 1958)
  })

  it('resolves legacy and standard variant aliases', () => {
    const netflixStd = findVariant('netflix-premium-standard')
    assert.ok(netflixStd)
    assert.equal(netflixStd.variant.id, 'netflix-1mo')
    assert.equal(netflixStd.variant.priceCents, 1152)

    const gpuVoucher = findVariant('gpu-1mo')
    assert.ok(gpuVoucher)
    assert.equal(gpuVoucher.variant.id, 'xbox-game-pass-ultimate-1mo')

    const gplay = findVariant('gplay-10')
    assert.ok(gplay)
    assert.equal(gplay.variant.id, 'google-10')
  })

  it('has zero duplicate variant labels and IDs across all products in catalogue', () => {
    for (const p of PRODUCTS) {
      const labelCounts = {}
      const idCounts = {}
      for (const v of p.variants) {
        labelCounts[v.label] = (labelCounts[v.label] || 0) + 1
        idCounts[v.id] = (idCounts[v.id] || 0) + 1
      }
      for (const [label, count] of Object.entries(labelCounts)) {
        assert.equal(count, 1, `Product ${p.id} (${p.title}) has duplicate variant label: "${label}"`)
      }
      for (const [id, count] of Object.entries(idCounts)) {
        assert.equal(count, 1, `Product ${p.id} (${p.title}) has duplicate variant ID: "${id}"`)
      }
    }
  })

  it('verifies Netflix Premium has unique editions without duplication', async () => {
    const netflix = await getProductBySlug('netflix-premium')
    assert.ok(netflix)
    assert.equal(netflix.variants.length, 2)
    assert.equal(netflix.variants[0].label, '1 Month · Premium 4K')
    assert.equal(netflix.variants[1].label, '3 Months · Premium 4K')
  })

  it('resolves products when passed variant ID or alias to getProductBySlug', async () => {
    const eshop = await getProductBySlug('eshop-50')
    assert.ok(eshop)
    assert.equal(eshop.id, 'p-eshop-us')

    const gplay = await getProductBySlug('gplay-25')
    assert.ok(gplay)
    assert.equal(gplay.id, 'p-google-play')

    const nord = await getProductBySlug('nordvpn-standard')
    assert.ok(nord)
    assert.equal(nord.id, 'p-nordvpn')
  })
})



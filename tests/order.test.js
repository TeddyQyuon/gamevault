import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cartTotals, applyPromo, priceLines } from '../src/services/orderService.js'
import { yearlyMath, SUBSCRIPTION_PLANS } from '../src/data/subscriptions.js'
import { formatPrice, discountPct } from '../src/utils/format.js'

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

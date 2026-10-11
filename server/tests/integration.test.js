import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

// Live-MySQL integration tests. They run ONLY when GV_LIVE_DB=1 with a
// migrated + seeded database (see README). Otherwise they skip cleanly —
// unit coverage lives in pricing.test.js / webhooks.test.js.
//
//   $env:GV_LIVE_DB = "1"; npm test
// (PowerShell) — requires server/.env to point at the migrated database.

const ENABLED = process.env.GV_LIVE_DB === '1'

let ctx = null

before(async () => {
  if (!ENABLED) return
  const { loadConfigStrict } = await import('../src/config.js')
  const { getSequelize } = await import('../src/db.js')
  const { defineModels } = await import('../src/models.js')
  const cfg = loadConfigStrict()
  const sequelize = getSequelize(cfg)
  await sequelize.authenticate()
  ctx = { models: defineModels(sequelize), sequelize }
})

describe('live MySQL integration (gated)', { skip: !ENABLED }, () => {
  it('seeded catalogue matches the frontend source of truth', async (t) => {
    if (!ctx) return t.skip('no live DB')
    const [{ PRODUCTS }] = [await import('../../src/data/products.js')]
    const count = await ctx.models.Variant.count({ where: { active: true } })
    const expected = PRODUCTS.flatMap((p) => p.variants).length
    assert.equal(count, expected)
    const storm = await ctx.models.Variant.findByPk('stormlands-standard')
    assert.equal(storm.priceCents, 2999)
    const monthly = await ctx.models.Variant.findByPk('game-pass-ultimate-monthly')
    assert.equal(monthly.billingType, 'recurring')
    const voucher = await ctx.models.Variant.findByPk('netflix-1mo')
    assert.equal(voucher.billingType, 'one_time') // prepaid voucher ≠ recurring
  })

  it('enforces attempt uniqueness per cart fingerprint', async (t) => {
    if (!ctx) return t.skip('no live DB')
    const { CheckoutAttempt, Order, User } = ctx.models
    const user = await User.create({ name: 'T', email: `t${Date.now()}@x.co`, passwordHash: 'x' })
    const stamp = String(Date.now()).slice(-6)
    const order = await Order.create({
      id: `GV-T${stamp}`, userId: user.id, mode: 'payment',
      subtotalCents: 1, totalCents: 1, currency: 'SGD',
    })
    const order2 = await Order.create({
      id: `GV-U${stamp}`, userId: user.id, mode: 'payment',
      subtotalCents: 1, totalCents: 1, currency: 'SGD',
    })
    await CheckoutAttempt.create({ userId: user.id, orderId: order.id, fingerprint: 'f'.repeat(64) })
    // Same user + same fingerprint, different (valid) order → UNIQUE violation.
    await assert.rejects(
      CheckoutAttempt.create({ userId: user.id, orderId: order2.id, fingerprint: 'f'.repeat(64) }),
      (e) => e.name === 'SequelizeUniqueConstraintError',
    )
    await CheckoutAttempt.destroy({ where: { userId: user.id } })
    await order.destroy()
    await order2.destroy()
    await user.destroy()
  })

  it('order reads are owner-scoped at the query level', async (t) => {
    if (!ctx) return t.skip('no live DB')
    const { getOrderForUser } = await import('../src/services/checkoutService.js')
    const found = await getOrderForUser(ctx.models, '00000000-0000-0000-0000-000000000000', 'GV-DOESNOTEXIST')
    assert.equal(found, null)
  })
})

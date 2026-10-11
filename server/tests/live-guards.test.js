import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { stripeLiveMode, stripeTestMode } from '../src/config.js'
import { stripeMode } from '../src/services/stripeClient.js'
import { priceOneTimeCart, priceSubscriptionVariant } from '../src/services/pricing.js'
import { createOneTimeCheckout, createSubscriptionCheckout } from '../src/services/checkoutService.js'
import { fulfilOrder } from '../src/services/fulfilment.js'
import { processEvent } from '../src/services/webhookService.js'
import { adminController } from '../src/controllers/adminController.js'

// Live-mode safety net: demo_test products (fictional codes) must never be
// sold or delivered for real money. Two independent lines of defence:
//   1. checkoutService refuses to create the order/session (DEMO_NOT_FOR_SALE)
//   2. fulfilment refuses to invent codes even if an order somehow exists
// Test mode behaviour is unchanged (fakes deliver TEST- codes).

process.env.CODES_ENCRYPTION_KEY = 'a'.repeat(64)

const row = (data) => ({
  ...data,
  async update(patch) {
    Object.assign(data, patch);
    return this;
  },
});

function demoVariant(over = {}) {
  return {
    id: 'demo-pack', label: 'Demo Pack', priceCents: 2999, stock: 999,
    billingType: 'one_time', billingInterval: null, stripePriceId: null,
    active: true, productTitle: 'Demo Game', productType: 'gift_card',
    publication: 'published', availability: 'available',
    fulfilment: 'demo_test', trackInventory: false,
    availableCount: 0, imagePath: null, region: 'Singapore', ...over,
  }
}

const PROMOS = { GAMER10: { code: 'GAMER10', discountCents: 1000, minSubtotalCents: 5000, active: true } }
const liveCfg = { stripeSecretKey: 'sk_live_test123' }
const testCfg = { stripeSecretKey: 'sk_test_123' }
const contact = { firstName: 'G', lastName: 'U', email: 'g@x.co', country: 'SG' }

function shopDb(variantRow) {
  const db = { orders: new Map(), items: [], attempts: [], createdOrders: 0 }
  const models = {
    Variant: {
      async findByPk(id) {
        if (id !== variantRow.id) return null
        return { ...variantRow, Product: { title: variantRow.productTitle, fulfilment: variantRow.fulfilment, publication: variantRow.publication, availability: variantRow.availability, productType: variantRow.productType, region: variantRow.region }, update: async () => {} }
      },
    },
    PromoCode: { async findByPk(code) { return PROMOS[code] || null } },
    Order: {
      async create(values) {
        db.createdOrders += 1
        const d = { ...values }
        db.orders.set(d.id, d)
        return row(d)
      },
      async findByPk(id) {
        const d = db.orders.get(id)
        return d ? row(d) : null
      },
    },
    OrderItem: {
      async bulkCreate(rows) {
        for (const r of rows) db.items.push({ id: db.items.length + 1, ...r })
      },
      async create(values) {
        const r = { id: db.items.length + 1, ...values }
        db.items.push(r)
        return row(r)
      },
      async findAll({ where }) {
        return db.items.filter((i) => i.orderId === where.orderId).map((i) => row(i))
      },
    },
    CheckoutAttempt: {
      async findOne({ where }) {
        const d = db.attempts.find((a) => Object.entries(where).every(([k, v]) => a[k] === v))
        return d ? row(d) : null
      },
      async create(values) {
        const d = { version: 1, status: 'open', stripeSessionId: null, ...values }
        db.attempts.push(d)
        return row(d)
      },
    },
    InventoryCode: {
      async update() { return [0] },
      async count() { return 0; },
      async findAll() { return [] },
      async bulkCreate() {},
    },
    CodeImport: { async create(v) { return row({ ...v }) } },
    Subscription: { async findOne() { return null } },
  }
  const sequelize = { async transaction(fn) { return fn({ LOCK: { UPDATE: 'UPDATE' } }) } }
  return { db, models, sequelize }
}

const fakeStripe = {
  customers: { async create() { return { id: 'cus_test' } } },
  checkout: { sessions: { async create() { return { id: 'cs_x', url: 'http://x/cs_x' } } } },
}

describe('live-mode detection', () => {
  it('classifies test / live / garbage keys', () => {
    assert.equal(stripeTestMode({ stripeSecretKey: 'sk_test_1' }), true)
    assert.equal(stripeLiveMode({ stripeSecretKey: 'sk_live_1' }), true)
    assert.equal(stripeLiveMode({ stripeSecretKey: 'sk_test_1' }), false)
    assert.equal(stripeMode({ stripeSecretKey: 'sk_live_1' }), 'live')
    assert.equal(stripeMode({ stripeSecretKey: 'sk_test_1' }), 'test')
    assert.equal(stripeMode({ stripeSecretKey: 'rk_live_1' }), null)
  })
})

describe('pricing carries fulfilment for the live guard', () => {
  const loaders = (fulfilment) => ({
    findVariant: async () => demoVariant({ fulfilment }),
    findPromo: async (c) => PROMOS[c] || null,
  })
  it('defaults missing fulfilment to demo_test (fail closed)', async () => {
    const loadersNoField = {
      findVariant: async () => {
        const { fulfilment, ...rest } = demoVariant()
        void fulfilment
        return rest
      },
      findPromo: async () => null,
    }
    const p = await priceOneTimeCart({ items: [{ variantId: 'demo-pack', qty: 1 }] }, loadersNoField)
    assert.equal(p.lines[0].fulfilment, 'demo_test')
  })
  it('passes through real fulfilment values', async () => {
    const p = await priceOneTimeCart({ items: [{ variantId: 'demo-pack', qty: 1 }] }, loaders('code_inventory'))
    assert.equal(p.lines[0].fulfilment, 'code_inventory')
    const s = await priceSubscriptionVariant('demo-pack', {
      findVariant: async () => demoVariant({ billingType: 'recurring', billingInterval: 'month', fulfilment: 'manual' }),
    })
    assert.equal(s.fulfilment, 'manual')
  })
})

describe('checkout refuses demo products in live mode', () => {
  it('one-time demo cart → DEMO_NOT_FOR_SALE, no order created', async () => {
    const { db, models, sequelize } = shopDb(demoVariant())
    const err = await createOneTimeCheckout(
      { user: null, body: { items: [{ variantId: 'demo-pack', qty: 1 }], contact } },
      { models, sequelize, stripe: fakeStripe, cfg: liveCfg },
    ).catch((e) => e)
    assert.equal(err?.code, 'DEMO_NOT_FOR_SALE')
    assert.equal(db.createdOrders, 0)
  })

  it('same demo cart in test mode proceeds (guard inactive)', async () => {
    const { db, models, sequelize } = shopDb(demoVariant())
    const out = await createOneTimeCheckout(
      { user: null, body: { items: [{ variantId: 'demo-pack', qty: 1 }], contact } },
      { models, sequelize, stripe: fakeStripe, cfg: testCfg },
    )
    assert.ok(out.orderId)
    assert.equal(db.createdOrders, 1)
  })

  it('subscription demo plan → LIVE_RECURRING_DISABLED in live mode', async () => {
    const v = demoVariant({ id: 'demo-sub', billingType: 'recurring', billingInterval: 'month' })
    const { db, models, sequelize } = shopDb(v)
    const err = await createSubscriptionCheckout(
      { user: null, body: { variantId: 'demo-sub', contact } },
      { models, sequelize, stripe: fakeStripe, cfg: liveCfg },
    ).catch((e) => e)
    assert.equal(err?.code, 'LIVE_RECURRING_DISABLED')
    assert.equal(db.createdOrders, 0)
  })
})

describe('fulfilment refuses demo codes in live mode', () => {
  function fulfilDb() {
    const db = {
      order: { id: 'GV-LIVE1', mode: 'payment', payStatus: 'paid', fulfilStatus: 'pending' },
      items: [{ id: 7, orderId: 'GV-LIVE1', variantId: 'demo-pack', qty: 1 }],
      codes: [],
    }
    const models = {
      OrderItem: {
        async findAll() { return db.items.map((i) => row(i)) },
      },
      CheckoutAttempt: { async findOne() { return null } },
      Variant: { async findByPk() { return null } }, // unknown → demo_test fallback
      CodeAllocation: {
        async count() { return db.codes.length },
        async bulkCreate(rows) { for (const r of rows) db.codes.push(r) },
      },
      SupplierOrder: { async findOrCreate() { return [{}, false] } },
    }
    const order = row(db.order)
    return { db, models, order }
  }

  it('live: paid demo order stays unfulfilled with zero codes', async () => {
    const { db, models, order } = fulfilDb()
    const out = await fulfilOrder(models, order, null, { live: true })
    assert.equal(out.alreadyFulfilled, false)
    assert.equal(db.codes.length, 0)
    assert.equal(db.order.fulfilStatus, 'pending')
  })

  it('test: same order fulfils with demo codes (unchanged)', async () => {
    const { db, models, order } = fulfilDb()
    await fulfilOrder(models, order, null, {})
    assert.equal(db.codes.length, 1)
    assert.equal(db.order.fulfilStatus, 'fulfilled')
  })

  it('live paid webhook marks paid but delivers nothing', async () => {
    const events = new Map()
    const { db, models, order } = fulfilDb()
    void order
    const orderRow = { ...db.order, stripeSessionId: 'cs_live_1', OrderItems: [] }
    const wm = {
      ...models,
      StripeEvent: {
        async findOrCreate({ where, defaults }) {
          if (events.has(where.eventId)) return [row(events.get(where.eventId)), false]
          const d = { attempts: 0, ...defaults, eventId: where.eventId }
          events.set(where.eventId, d)
          return [row(d), true]
        },
        async findByPk(id) { return row(events.get(id)) },
      },
      Order: {
        async findByPk() { return row(orderRow) },
        async findOne() { return null },
      },
      Subscription: { async findOne() { return null } },
    }
    const wseq = { async transaction(fn) { return fn({ LOCK: { UPDATE: 'UPDATE' } }) } }
    const session = {
      id: 'cs_live_1', mode: 'payment', payment_status: 'paid', customer: 'cus_1',
      payment_intent: 'pi_1', subscription: null, client_reference_id: 'GV-LIVE1',
      metadata: { gamevaultOrderId: 'GV-LIVE1', mode: 'payment' },
    }
    const out = await processEvent(wm, wseq, { subscriptions: { retrieve: async () => { throw new Error('n/a') } } }, { id: 'evt_live_1', type: 'checkout.session.completed', data: { object: session } }, { live: true })
    assert.equal(out.processed, true)
    assert.equal(orderRow.payStatus, 'paid')
    assert.equal(db.codes.length, 0)
    assert.equal(orderRow.fulfilStatus, 'pending')
  })
})

describe('staff inventory endpoints', () => {
  function staffModels(role) {
    const stored = { codes: [], imports: [], audits: [] }
    const variantRow = {
      id: 'real-pack', productId: 'p-real', label: 'Standard', priceCents: 2500,
      stock: 999, billingType: 'one_time', active: true, trackInventory: true,
      Product: { fulfilment: 'code_inventory', title: 'Real Pack' },
    }
    const demoRow = {
      ...variantRow, id: 'demo-pack', Product: { fulfilment: 'demo_test', title: 'Demo' },
    }
    const models = {
      User: { async findByPk() { return row({ id: 'u1', role }) } },
      Product: {
        async findByPk(id) {
          if (id === 'p-real') return row({ id: 'p-real', slug: 'real', title: 'Real Pack', publication: 'draft', availability: 'coming_soon', fulfilment: 'code_inventory' })
          return null
        },
        async findAll() { return [] },
        async findOne() { return null },
        async create(v) { return row({ ...v }) },
      },
      Variant: {
        async findByPk(id) {
          if (id === 'real-pack') return row({ ...variantRow })
          if (id === 'demo-pack') return row({ ...demoRow })
          return null
        },
        async findAll() { return [] },
        async create(v) { return row({ ...v }) },
      },
      InventoryCode: {
        async findAll() { return [] },
        async bulkCreate(rows) { for (const r of rows) stored.codes.push(r) },
        async count() { return stored.codes.length },
        async update() { return [0] },
      },
      CodeImport: { async create(v) { stored.imports.push(v); return row({ ...v }) } },
      AdminAudit: { async create(v) { stored.audits.push(v); return row({ ...v }) } },
    }
    const sequelize = { async transaction(fn) { return fn({ LOCK: { UPDATE: 'UPDATE' } }) } }
    return { models, sequelize, stored }
  }

  function call(handler, req) {
    return new Promise((resolve, reject) => {
      const res = {
        status(c) { this.statusCode = c; return this },
        json(v) { resolve({ status: this.statusCode || 200, body: v }) },
      }
      handler(req, res, reject)
    })
  }

  it('non-admin gets 403 on staff endpoints', async () => {
    const { models } = staffModels('customer')
    const err = await call(adminController({ models }).me, { userId: 'u1' }).catch((e) => e)
    assert.equal(err?.status, 403)
  })

  it('admin preview works; demo_test variants rejected', async () => {
    const { models } = staffModels('admin')
    const api = adminController({ models })
    const ok = await call(api.previewInventory, { userId: 'u1', body: { variantId: 'real-pack', text: 'AAA-111\nBBB-222\n' } })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.valid, 2)
    const bad = await call(api.previewInventory, { userId: 'u1', body: { variantId: 'demo-pack', text: 'AAA-111\n' } }).catch((e) => e)
    assert.equal(bad?.code, 'WRONG_FULFILMENT')
  })

  it('admin confirm imports encrypted codes + audits', async () => {
    const { models, sequelize, stored } = staffModels('admin')
    const api = adminController({ models, sequelize })
    const out = await call(api.confirmInventory, { userId: 'u1', body: { variantId: 'real-pack', text: 'AAA-111\nBBB-222\n', filename: 't.txt' } })
    assert.equal(out.status, 201)
    assert.equal(out.body.imported, 2)
    assert.equal(stored.codes.length, 2)
    assert.ok(stored.codes.every((c) => !c.codeCipher.includes('AAA-111')))
    assert.equal(stored.audits.length, 1)
  })
})
describe('live manual checkout', () => {
  it('creates a one-time order without code stock when signed payment confirmation is configured', async () => {
    const variant = demoVariant({ fulfilment: 'manual', stock: 0, trackInventory: true, region: 'Test region' })
    const { db, models, sequelize } = shopDb(variant)
    const result = await createOneTimeCheckout(
      { user: null, body: { items: [{ variantId: variant.id, qty: 2 }], contact } },
      { models, sequelize, stripe: fakeStripe, cfg: { ...liveCfg, stripeWebhookSecret: 'whsec_mock', clientUrl: 'http://localhost:5173' } },
    )
    assert.ok(result.orderId)
    assert.equal(db.createdOrders, 1)
    assert.equal(db.items[0].fulfilment, 'manual')
    assert.equal(db.items[0].region, 'Test region')
    assert.equal(db.items[0].deliveryWindowMinutes, 60)
  })
  it('refuses live checkout before creating an order when the webhook secret is missing', async () => {
    const variant = demoVariant({ fulfilment: 'manual', stock: 0 })
    const { db, models, sequelize } = shopDb(variant)
    await assert.rejects(createOneTimeCheckout(
      { user: null, body: { items: [{ variantId: variant.id, qty: 1 }], contact } },
      { models, sequelize, stripe: fakeStripe, cfg: liveCfg },
    ), { code: 'SERVICE_UNAVAILABLE' })
    assert.equal(db.createdOrders, 0)
  })
})

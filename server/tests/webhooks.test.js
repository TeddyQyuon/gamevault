import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import Stripe from 'stripe'
import { verifySignature, processEvent } from '../src/services/webhookService.js'
import { getOrderForUser } from '../src/services/checkoutService.js'

// ---- Minimal in-memory doubles for Sequelize models ----------------------
// They implement just the methods the services call, honouring the same
// constraints that matter: PK uniqueness, UNIQUE(code), row updates.

function row(data) {
  return { ...data, async update(patch) { Object.assign(data, patch); return this } }
}

function makeDb() {
  const db = {
    events: new Map(), orders: new Map(), items: [], attempts: new Map(),
    subs: new Map(), codes: [], users: new Map(), failNextBulk: false,
  }
  const wrapAll = (m) => [...m.values()].map((d) => row(d))
  void wrapAll
  const findSub = (where) => {
    for (const d of db.subs.values()) {
      if (Object.entries(where).every(([k, v]) => (Array.isArray(v) ? v.includes(d[k]) : d[k] === v))) return row(d)
    }
    return null
  }
  const models = {
    StripeEvent: {
      async findOrCreate({ where, defaults }) {
        const at = db.events.get(where.eventId)
        if (at) return [row(at), false]
        const d = { attempts: 0, lastError: null, processedAt: null, ...defaults, eventId: where.eventId }
        db.events.set(where.eventId, d)
        return [row(d), true]
      },
      async findByPk(id) { const d = db.events.get(id); return d ? row(d) : null },
    },
    Order: {
      async findByPk(id) { const d = db.orders.get(id); return d ? row(d) : null },
      async findOne({ where }) {
        const d = db.orders.get(where.id)
        if (!d || (where.userId && d.userId !== where.userId)) return null
        const r = row(d)
        r.OrderItems = db.items.filter((i) => i.orderId === d.id).map((i) => ({
          ...i,
          CodeAllocations: db.codes.filter((c) => c.orderItemId === i.id),
        }))
        return r
      },
    },
    OrderItem: {
      async findAll({ where }) { return db.items.filter((i) => i.orderId === where.orderId).map((i) => row(i)) },
      async findOne({ where }) { const i = db.items.find((x) => x.orderId === where.orderId); return i ? row(i) : null },
    },
    CheckoutAttempt: {
      async findOne({ where }) { const d = db.attempts.get(where.orderId); return d ? row(d) : null },
    },
    // fulfilOrder routes on Variant→Product fulfilment; null falls back to
    // the demo_test path (DEMO- codes), matching seeded demo products.
    Variant: {
      async findByPk() { return null },
    },
    SupplierOrder: {
      async findOrCreate({ defaults }) { return [row({ ...defaults }), true] },
      async create(values) { return row({ ...values }) },
    },
    Subscription: {
      async findOne({ where }) { return findSub(where) },
      async create(values) {
        for (const d of db.subs.values()) {
          if (d.stripeSubscriptionId === values.stripeSubscriptionId) {
            throw Object.assign(new Error('dup'), { name: 'SequelizeUniqueConstraintError' })
          }
        }
        const d = { id: `sub-row-${db.subs.size + 1}`, lastInvoiceId: null, ...values }
        db.subs.set(d.id, d)
        return row(d)
      },
    },
    CodeAllocation: {
      async count({ where }) { return db.codes.filter((c) => c.orderItemId === where.orderItemId).length },
      async bulkCreate(rows) {
        if (db.failNextBulk) { db.failNextBulk = false; throw new Error('transient db outage') }
        const seen = new Set(db.codes.map((c) => c.code))
        for (const r of rows) {
          if (seen.has(r.code)) throw Object.assign(new Error('dup code'), { name: 'SequelizeUniqueConstraintError' })
          seen.add(r.code)
        }
        for (const r of rows) db.codes.push({ ...r })
      },
    },
    User: {
      async findOne({ where }) {
        for (const d of db.users.values()) {
          if (Object.entries(where).every(([k, v]) => d[k] === v)) return row(d)
        }
        return null
      },
    },
  }
  const sequelize = { async transaction(fn) { return fn({ LOCK: { UPDATE: 'UPDATE' } }) } }
  return { db, models, sequelize }
}

function stripeSub(id = 'sub_1', status = 'active') {
  const start = 1780000000
  return {
    id, status, customer: 'cus_1', cancel_at_period_end: false,
    current_period_start: start, current_period_end: start + 2592000,
    metadata: { variantId: 'game-pass-ultimate-monthly' },
    items: { data: [{ price: { id: 'price_1', recurring: { interval: 'month' } }, current_period_start: start, current_period_end: start + 2592000 }] },
  }
}

function makeStripe(overrides = {}) {
  return {
    subscriptions: { retrieve: async (id) => stripeSub(id, overrides.subStatus || 'active') },
    checkout: { sessions: { retrieve: async () => { throw new Error('gone') } } },
  }
}

function session(obj = {}) {
  return {
    id: 'cs_test_1', mode: 'payment', payment_status: 'paid', customer: 'cus_1',
    payment_intent: 'pi_1', subscription: null, client_reference_id: 'GV-ABC123',
    metadata: { gamevaultOrderId: 'GV-ABC123', gamevaultUserId: 'u1', mode: 'payment' },
    ...obj,
  }
}

function seedOrder(db, over = {}) {
  db.orders.set('GV-ABC123', {
    id: 'GV-ABC123', userId: 'u1', mode: 'payment', payStatus: 'pending', fulfilStatus: 'pending',
    subtotalCents: 5998, discountCents: 0, totalCents: 5998, currency: 'SGD',
    stripeSessionId: 'cs_test_1', stripePaymentIntentId: null, stripeCustomerId: null,
    stripeSubscriptionId: null, contactName: 'Test', contactEmail: 't@x.co', contactCountry: 'SG',
    createdAt: new Date(), ...over,
  })
  db.items.push({
    id: 1, orderId: 'GV-ABC123', variantId: 'stormlands-standard', productTitle: 'Stormlands',
    variantLabel: 'Standard', unitCents: 2999, qty: 2, lineTotalCents: 5998,
  })
  db.attempts.set('GV-ABC123', { orderId: 'GV-ABC123', status: 'open', stripeSessionId: 'cs_test_1', version: 1 })
}

const evt = (id, type, object) => ({ id, type, data: { object } })

describe('webhook signature (real Stripe lib, offline)', () => {
  const stripe = new Stripe('sk_test_123')
  const secret = 'whsec_test123'
  const payload = JSON.stringify({ id: 'evt_1', object: 'event', type: 'checkout.session.completed' })

  it('accepts a correctly signed payload', () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret })
    const event = verifySignature(stripe, payload, header, secret)
    assert.equal(event.id, 'evt_1')
  })

  it('rejects tampered bodies and wrong secrets (400 path, no retry)', () => {
    const header = Stripe.webhooks.generateTestHeaderString({ payload, secret })
    assert.throws(() => verifySignature(stripe, `${payload} `, header, secret))
    assert.throws(() => verifySignature(stripe, payload, header, 'whsec_wrong'))
    assert.throws(() => verifySignature(stripe, payload, 't=1,v1=deadbeef', secret))
  })
})

describe('webhook processing: payment-mode order', () => {
  let db; let models; let sequelize; let stripe
  beforeEach(() => { ({ db, models, sequelize } = makeDb()); stripe = makeStripe(); seedOrder(db) })

  it('marks paid + allocates DEMO codes exactly once, then ignores replays', async () => {
    const event = evt('evt_1', 'checkout.session.completed', session())
    const first = await processEvent(models, sequelize, stripe, event)
    assert.equal(first.processed, true)
    assert.equal(db.orders.get('GV-ABC123').payStatus, 'paid')
    assert.equal(db.orders.get('GV-ABC123').fulfilStatus, 'fulfilled')
    assert.equal(db.codes.length, 2)
    assert.ok(db.codes.every((c) => c.code.startsWith('TEST-')))

    const replay = await processEvent(models, sequelize, stripe, event)
    assert.equal(replay.duplicate, true)
    assert.equal(db.codes.length, 2) // no double delivery
  })

  it('retry after a transient failure resumes without duplicating codes', async () => {
    db.failNextBulk = true
    const event = evt('evt_2', 'checkout.session.completed', session())
    await assert.rejects(processEvent(models, sequelize, stripe, event), /transient db outage/)
    assert.equal(db.events.get('evt_2').status, 'failed') // stays retryable
    assert.equal(db.codes.length, 0)

    const retry = await processEvent(models, sequelize, stripe, event)
    assert.equal(retry.processed, true)
    assert.equal(db.codes.length, 2)
  })

  it('completed-but-unpaid sessions do NOT fulfil (delayed methods)', async () => {
    const out = await processEvent(models, sequelize, stripe, evt('evt_3', 'checkout.session.completed', session({ payment_status: 'unpaid' })))
    assert.equal(out.pending, true)
    assert.equal(db.orders.get('GV-ABC123').payStatus, 'pending')
    assert.equal(db.codes.length, 0)
  })

  it('async failure marks failed; expiry after payment never overwrites paid', async () => {
    await processEvent(models, sequelize, stripe, evt('evt_4', 'checkout.session.async_payment_failed', session({ payment_status: 'unpaid' })))
    assert.equal(db.orders.get('GV-ABC123').payStatus, 'failed')

    // Separate order that already got paid:
    seedOrder(db, {})
    db.orders.get('GV-ABC123').payStatus = 'paid'
    const out = await processEvent(models, sequelize, stripe, evt('evt_5', 'checkout.session.expired', session({ payment_status: 'unpaid' })))
    assert.equal(out.unchanged, true)
    assert.equal(db.orders.get('GV-ABC123').payStatus, 'paid')
  })
})

describe('webhook processing: subscriptions', () => {
  let db; let models; let sequelize; let stripe
  beforeEach(() => {
    ({ db, models, sequelize } = makeDb()); stripe = makeStripe();
    seedOrder(db, { mode: 'subscription', stripeSessionId: 'cs_sub_1' })
    db.items[0].variantId = 'game-pass-ultimate-monthly'
  })

  it('creates the entitlement + fulfils on subscription checkout', async () => {
    const out = await processEvent(models, sequelize, stripe, evt('evt_s1', 'checkout.session.completed',
      session({ id: 'cs_sub_1', mode: 'subscription', subscription: 'sub_1', metadata: { gamevaultOrderId: 'GV-ABC123', gamevaultUserId: 'u1', mode: 'subscription' } })))
    assert.equal(out.processed, true)
    assert.equal(db.orders.get('GV-ABC123').payStatus, 'paid')
    const subs = [...db.subs.values()]
    assert.equal(subs.length, 1)
    assert.equal(subs[0].status, 'active')
    assert.ok(subs[0].currentPeriodEnd instanceof Date || typeof subs[0].currentPeriodEnd === 'object')
  })

  it('rebuilds a missing subscription row on late invoice.paid (out-of-order)', async () => {
    db.users.set('u1', { id: 'u1', stripeCustomerId: 'cus_1' })
    const out = await processEvent(models, sequelize, stripe,
      evt('evt_i1', 'invoice.paid', { id: 'in_1', subscription: 'sub_9' }))
    assert.equal(out.recovered, true)
    assert.equal([...db.subs.values()].length, 1)
  })

  it('renewal failure → past_due; cancellation → canceled', async () => {
    db.subs.set('s1', { id: 's1', userId: 'u1', planName: 'Xbox Game Pass Ultimate', variantId: 'game-pass-ultimate-monthly', stripeSubscriptionId: 'sub_1', stripeCustomerId: 'cus_1', status: 'active' })
    await processEvent(models, sequelize, stripe, evt('evt_i2', 'invoice.payment_failed', { id: 'in_2', subscription: 'sub_1' }))
    assert.equal(db.subs.get('s1').status, 'past_due')
    await processEvent(models, sequelize, stripe, evt('evt_d1', 'customer.subscription.deleted', { id: 'sub_1' }))
    assert.equal(db.subs.get('s1').status, 'canceled')
  })
})

describe('order ownership (forged success-page visits)', () => {
  it('returns null for another user’s order id', async () => {
    const { db, models } = makeDb()
    seedOrder(db) // belongs to u1
    assert.equal(await getOrderForUser(models, 'u2', 'GV-ABC123'), null)
    const own = await getOrderForUser(models, 'u1', 'GV-ABC123')
    assert.equal(own.id, 'GV-ABC123')
    assert.deepEqual(own.items[0].codes, []) // nothing fulfilled → no codes leak
  })
})

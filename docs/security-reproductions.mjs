// Local security-review reproductions. All records and Stripe calls are mocked.
// These assertions CONFIRM unsafe current behavior; they are not passing security gates.
// Run from the project root: node docs/security-reproductions.mjs
import assert from 'node:assert/strict'
import { sameOrigin } from '../server/src/middleware/guards.js'
import { createOneTimeCheckout, getGuestOrder } from '../server/src/services/checkoutService.js'
import { fingerprint } from '../server/src/services/pricing.js'
import { connectController } from '../server/src/controllers/connectController.js'
import { getStripe, resetStripeClient } from '../server/src/services/stripeClient.js'
import { processEvent } from '../server/src/services/webhookService.js'
import { createSeparateHoldCheckout } from '../server/src/services/holdCheckoutService.js'
import { releaseOrderTransfers } from '../server/src/services/connectService.js'
import { productsController } from '../server/src/controllers/productsController.js'
import { createApp } from '../server/src/app.js'

const cfg = { clientUrl: 'https://shop.example.test', stripeSecretKey: 'sk_test_security_review_placeholder' }
const row = (data) => Object.assign(data, { async update(patch) { Object.assign(this, patch); return this } })
const sequelize = { transaction: async (fn) => fn({ LOCK: { UPDATE: 'UPDATE' } }) }
const readyAccount = { configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { status: 'active' } } } } } }
const results = []
const record = (id, evidence) => results.push({ id, reproduced: true, evidence })
const response = () => ({ statusCode: 200, body: null, status(n) { this.statusCode = n; return this }, json(body) { this.body = body; return this } })
const next = (err) => { if (err) throw err }
const variant = () => ({
  id: 'review-item', label: 'Standard', priceCents: 10000, stock: 100,
  active: true, billingType: 'one_time', trackInventory: false,
  Product: { title: 'Review Item', publication: 'published', availability: 'available', fulfilment: 'manual' },
})
const contact = { firstName: 'Review', lastName: 'Customer', email: 'buyer@example.test', country: 'SG' }

// Guest requests from unrelated browsers have no independent ownership secret.
{
  const sessionId = 'cs_test_review_guest_only'
  const order = row({ id: 'GV-GUEST', userId: null, payStatus: 'pending', fulfilStatus: 'pending',
    contactName: 'Original Guest', contactEmail: contact.email, stripeSessionId: sessionId, OrderItems: [] })
  const fp = fingerprint('payment', [{ variantId: 'review-item', qty: 1 }], null, contact.email)
  const attempt = row({ id: 'attempt-guest', userId: null, fingerprint: fp, status: 'open', stripeSessionId: sessionId, version: 1 })
  const models = {
    Variant: { findByPk: async () => variant() },
    InventoryCode: { update: async () => [0] },
    CheckoutAttempt: { findOne: async ({ where }) => {
      assert.equal(where.userId, null); assert.equal(where.fingerprint, fp); return attempt
    } },
    Order: { findByPk: async () => order, findOne: async () => order },
  }
  const stripe = { checkout: { sessions: { retrieve: async () => ({
    id: sessionId, status: 'open', amount_total: 10000, currency: 'sgd',
    url: `https://checkout.example.test/c/pay/${sessionId}`,
  }) } } }
  const output = await createOneTimeCheckout({ user: null, body: {
    contact: { ...contact, firstName: 'Unrelated', lastName: 'Browser' }, items: [{ variantId: 'review-item', qty: 1 }],
  } }, { models, sequelize, stripe, cfg })
  assert.equal(output.reused, true)
  assert.equal(output.orderId, order.id)
  const leaked = await getGuestOrder(models, output.orderId, sessionId)
  assert.equal(leaked.contact.name, 'Original Guest')
  record('S01', 'Unrelated guest request with the same email/cart receives the existing checkout URL and order ID. Its session token authorizes order details.')
}

// Exercise the actual destination controller with a normal customer.
let destinationParams
{
  resetStripeClient()
  const stripe = getStripe(cfg)
  stripe.v2.core.accounts.retrieve = async () => readyAccount
  stripe.checkout.sessions.create = async (params) => {
    destinationParams = params
    return { id: 'cs_test_review_destination', url: 'https://checkout.example.test/review' }
  }
  const models = {
    User: { findByPk: async () => ({ id: 'buyer', role: 'customer', stripeCustomerId: 'cus_review_buyer' }) },
    ConnectedAccount: { findOne: async () => ({ chargePattern: 'destination' }) },
  }
  const res = response()
  await connectController({ models, cfg, sequelize }).destinationCheckout({ userId: 'buyer', body: {
    sellerAccountId: 'acct_review_selected', orderId: 'GV-UNBOUND', platformFeeCents: 0,
    lines: [{ productTitle: 'Buyer supplied', variantLabel: 'Any', unitCents: 100, qty: 1 }],
  } }, res, next)
  assert.equal(res.statusCode, 201)
  assert.equal(destinationParams.line_items[0].price_data.unit_amount, 100)
  assert.equal(destinationParams.payment_intent_data.application_fee_amount, 0)
  assert.equal(destinationParams.metadata.gamevaultOrderId, 'GV-UNBOUND')
  record('S02a', 'Ordinary customer controls destination price, platform fee, seller, and order metadata without a catalogue/order lookup.')
}

function eventModels(order) {
  const events = new Map()
  return {
    StripeEvent: {
      findOrCreate: async ({ where, defaults }) => {
        if (events.has(where.eventId)) return [events.get(where.eventId), false]
        const eventRow = row({ ...defaults, eventId: where.eventId, attempts: 0 })
        events.set(where.eventId, eventRow)
        return [eventRow, true]
      },
      findByPk: async (id) => events.get(id),
    },
    Order: { findByPk: async () => order, findOne: async () => order },
    CheckoutAttempt: { findOne: async () => row({ status: 'open' }) },
    OrderItem: { findAll: async () => [{ id: 1, orderId: order.id, variantId: 'review-item', qty: 1 }] },
    Variant: { findByPk: async () => variant() },
    SupplierOrder: { findOrCreate: async () => [row({ status: 'pending' }), true] },
  }
}

// Represents a provider event after signature verification, not a signature bypass.
{
  const order = row({ id: 'GV-UNBOUND', userId: 'different-owner', mode: 'payment',
    stripeSessionId: null, totalCents: 10000, currency: 'SGD', payStatus: 'pending', fulfilStatus: 'pending' })
  const models = eventModels(order)
  await processEvent(models, sequelize, {}, { id: 'evt_review_underpaid', type: 'checkout.session.completed', data: { object: {
    id: 'cs_test_review_destination', mode: 'payment', payment_status: 'paid', amount_total: 100,
    currency: 'sgd', customer: 'cus_review_buyer', payment_intent: 'pi_review', metadata: destinationParams.metadata,
  } } }, { live: true })
  assert.equal(order.payStatus, 'paid')
  assert.equal(order.totalCents, 10000)
  record('S02b', 'A session-less S$100 order becomes paid from an unrelated customer session reporting S$1. Prerequisite: pending order with no bound session ID.')
}

// Separate checkout accepts buyer-controlled fees/payouts and omits the demo/live gate.
{
  let savedOrder
  let savedSplits
  let checkoutCreated = false
  const models = {
    Variant: { findByPk: async () => ({ ...variant(), Product: { ...variant().Product, fulfilment: 'demo_test' } }) },
    InventoryCode: { update: async () => [0] },
    ConnectedAccount: { findOne: async () => ({ chargePattern: 'destination' }) },
    CheckoutAttempt: { findOne: async () => null, create: async (values) => row({ id: 'attempt-separate', version: 1, ...values }) },
    Order: { findByPk: async () => null, create: async (values) => { savedOrder = row(values); return savedOrder } },
    OrderItem: { bulkCreate: async () => [] },
    OrderTransfer: { bulkCreate: async (values) => { savedSplits = values; return values } },
  }
  const stripe = {
    v2: { core: { accounts: { retrieve: async () => readyAccount } } },
    checkout: { sessions: { create: async () => { checkoutCreated = true; return { id: 'cs_review_mock', url: 'https://checkout.example.test/mock' } } } },
  }
  await createSeparateHoldCheckout({ user: { id: 'buyer', stripeCustomerId: 'cus_review' }, body: {
    contact, items: [{ variantId: 'review-item', qty: 1 }], percentBps: 0,
    sellerAccountId: 'acct_buyer_selected', stripeFeeEstimateCents: 0,
  } }, { models, sequelize, stripe, cfg: { ...cfg, stripeSecretKey: 'sk_live_mock_never_sent' } })
  assert.equal(savedOrder.platformFeeCents, 0)
  assert.equal(savedSplits[0].amountCents, 10000)
  assert.equal(savedSplits[0].stripeAccountId, 'acct_buyer_selected')
  assert.equal(checkoutCreated, true)
  record('S03', 'Buyer chooses recipient and zero platform fee; the full S$100 seller allocation is persisted. Actual transfer still requires admin release.')
  record('S04', 'Separate checkout reaches the mocked payment-session call for a demo product under synthetic live-mode configuration.')
}

// Release has no atomic claim or provider idempotency key.
{
  const order = row({ id: 'GV-RELEASE', connectPattern: 'separate', payStatus: 'paid', fulfilStatus: 'fulfilled', stripePaymentIntentId: 'pi_review' })
  const transfer = row({ id: 1, orderId: order.id, status: 'pending', amountCents: 5000, stripeAccountId: 'acct_review', currency: 'SGD' })
  let queuedReads = 0
  let releaseReads
  const bothRead = new Promise((resolve) => { releaseReads = resolve })
  const calls = []
  const models = {
    Order: { findByPk: async () => order },
    OrderTransfer: { findAll: async () => {
      const pending = transfer.status === 'pending' ? [transfer] : []
      queuedReads += 1
      if (queuedReads === 2) releaseReads()
      await bothRead
      return pending
    }, count: async () => transfer.status === 'pending' ? 1 : 0 },
    ConnectedAccount: { findOne: async () => ({ chargePattern: 'destination' }) },
  }
  const stripe = {
    paymentIntents: { retrieve: async () => ({ latest_charge: 'ch_review' }) },
    v2: { core: { accounts: { retrieve: async () => readyAccount } } },
    transfers: { create: async (...args) => { calls.push(args); return { id: `tr_review_${calls.length}` } } },
  }
  await Promise.all([releaseOrderTransfers({ models, stripe }, order.id), releaseOrderTransfers({ models, stripe }, order.id)])
  assert.equal(calls.length, 2)
  assert.ok(calls.every((args) => args[1]?.idempotencyKey === undefined))
  record('S05', 'Two concurrent authorized release calls submit the same transfer twice without provider idempotency keys. Provider balance/charge limits were not tested.')
}

{
  const order = row({ id: 'GV-DISPUTED', connectPattern: 'separate', connectTransferStatus: 'pending', payStatus: 'paid', fulfilStatus: 'fulfilled' })
  const outcome = await processEvent(eventModels(order), sequelize, {}, {
    id: 'evt_review_dispute', type: 'charge.dispute.created', data: { object: { payment_intent: 'pi_review' } },
  })
  assert.equal(outcome.flagged, true)
  assert.equal(order.connectTransferStatus, 'pending')
  assert.equal(order.payStatus, 'paid')
  record('S06', 'Dispute handler reports flagged=true without persisting a review state or blocking transfer release.')
}

{
  let accepted = false
  sameOrigin(cfg)({ method: 'POST', get: (name) => name === 'origin' ? `${cfg.clientUrl}.attacker.test` : undefined }, {}, () => { accepted = true })
  assert.equal(accepted, true)
  record('S07', 'Origin middleware accepts a lookalike hostname. This is a middleware bypass; browser CSRF exploitability is limited by JSON/CORS/SameSite protections.')
}

{
  const app = createApp({ cfg, models: {}, sequelize, stripe: {} })
  assert.equal(app.get('trust proxy'), false)
  record('S08', 'Express trusts no proxies although the deployment places Caddy in front of it; IP rate limiting uses the proxy peer address.')
}

{
  const models = {
    Product: { findAll: async (options) => {
      assert.equal(options.where, undefined)
      return [{ id: 'draft-review', slug: 'draft-review', title: 'Unpublished review product', publication: 'draft' }]
    } },
    Variant: { findAll: async () => [] },
  }
  const res = response()
  await productsController({ models }).list({}, res, next)
  assert.equal(res.body.products[0].id, 'draft-review')
  record('S09', 'Unauthenticated catalogue listing returns an unpublished product; no publication filter is applied.')
}

resetStripeClient()
console.log(JSON.stringify({ mode: 'offline mocks only; no database or provider writes', observations: results }, null, 2))

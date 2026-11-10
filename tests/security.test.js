import test from 'node:test'
import assert from 'node:assert/strict'
import coderHandler from '../api/coder/execute.js'
import promoHandler from '../api/promos/validate.js'
import { createCheckoutHandler } from '../api/checkout/sessions.js'
import { createOrderHandler } from '../api/orders/[id].js'

function response() {
  return {
    code: 200, headers: {}, data: null,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.code = code; return this },
    json(data) { this.data = data; return this },
  }
}

const environment = { STRIPE_SECRET_KEY: 'sk_test_local_stub', CHECKOUT_PUBLIC_URL: 'https://store.example.invalid', NODE_ENV: 'production' }
const contact = { firstName: 'Local', lastName: 'Test', email: 'local@example.invalid' }
const cheapCart = [{ variantId: 'xbox-game-pass-ultimate-1mo', qty: 1 }]
const eligibleCart = [{ variantId: 'elden-ring-standard', qty: 1 }]
const sessionId = 'cs_test_local_private_session'
const orderId = 'GV-LOCAL123'

function stripeFixture(overrides = {}) {
  const calls = []
  const session = { id: sessionId, client_reference_id: orderId, metadata: { orderId, customerName: 'Local Test' },
    mode: 'payment', status: 'complete', payment_status: 'paid', amount_total: 5999, currency: 'sgd',
    customer_email: contact.email, ...overrides }
  const stripe = {
    coupons: { async create(params) { calls.push(['coupon', params]); return { id: 'coupon_local' } } },
    checkout: { sessions: {
      async create(params) { calls.push(['create', params]); return { id: sessionId, url: 'https://checkout.stripe.com/local' } },
      async retrieve(id) { calls.push(['retrieve', id]); return session },
      async listLineItems(id) {
        calls.push(['lines', id])
        return { data: [{ id: 'li_local', quantity: 1, description: 'Local verified product',
          price: { product: { metadata: { variantId: 'elden-ring-standard' } } } }], has_more: false }
      },
    } },
  }
  return { stripe, calls }
}

test('public coder execution is disabled before any provider call', async () => {
  const previousFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => { calls++; throw new Error('Unexpected provider call') }
  try {
    const res = response()
    await coderHandler({ method: 'POST', body: { task: 'Attempt to spend server quota', model: 'agent' } }, res)
    assert.equal(res.code, 404)
    assert.equal(res.data.ok, false)
    assert.equal(calls, 0)
    assert.equal(res.headers['Cache-Control'], 'no-store')
  } finally { globalThis.fetch = previousFetch }
})

test('direct checkout rejects an ineligible promo before any Stripe call', async () => {
  const { stripe, calls } = stripeFixture()
  const handler = createCheckoutHandler({ createStripe: () => stripe, environment })
  const res = response()
  await handler({ method: 'POST', body: { items: cheapCart, contact, promoCode: 'GAMER10' } }, res)
  assert.equal(res.code, 400)
  assert.equal(res.data.error.code, 'PROMO_INELIGIBLE')
  assert.deepEqual(calls, [])
  const preview = response()
  promoHandler({ method: 'POST', body: { items: cheapCart, promoCode: 'GAMER10' } }, preview)
  assert.equal(preview.data.ok, false)
  assert.equal(preview.data.discountCents, 0)
})

test('eligible promo is priced on the server and redirects only to configured origin', async () => {
  const { stripe, calls } = stripeFixture()
  const handler = createCheckoutHandler({ createStripe: () => stripe, environment })
  const res = response()
  await handler({ method: 'POST', headers: { origin: 'https://attacker.invalid', host: 'attacker.invalid' },
    body: { items: [{ ...eligibleCart[0], unitAmount: 1 }], contact, promoCode: 'gamer10' } }, res)
  assert.equal(res.code, 200)
  const coupon = calls.find(([name]) => name === 'coupon')[1]
  const params = calls.find(([name]) => name === 'create')[1]
  assert.equal(coupon.amount_off, 1000)
  assert.equal(params.line_items[0].price_data.unit_amount, 5999)
  assert.equal(new URL(params.success_url).origin, 'https://store.example.invalid')
  assert.equal(new URL(params.cancel_url).origin, 'https://store.example.invalid')
  assert.equal(params.client_reference_id, res.data.orderId)
  assert.equal(params.metadata.orderId, res.data.orderId)
})

test('coupon failure does not silently open an undiscounted checkout', async () => {
  const { stripe, calls } = stripeFixture()
  stripe.coupons.create = async () => { throw new Error('Provider error containing sensitive diagnostics') }
  const handler = createCheckoutHandler({ createStripe: () => stripe, environment })
  const res = response()
  await handler({ method: 'POST', body: { items: eligibleCart, contact, promoCode: 'GAMER10' } }, res)
  assert.equal(res.code, 503)
  assert.equal(calls.some(([name]) => name === 'create'), false)
  assert.doesNotMatch(JSON.stringify(res.data), /sensitive diagnostics/)
})

test('invalid quantities, unknown products, and invalid configured return origins fail closed', async () => {
  const { stripe, calls } = stripeFixture()
  const handler = createCheckoutHandler({ createStripe: () => stripe, environment })
  for (const items of [[{ variantId: 'unknown', qty: 1 }], [{ ...eligibleCart[0], qty: 1.5 }],
    [{ ...eligibleCart[0], qty: 0 }], [{ ...eligibleCart[0], qty: 11 }], null]) {
    const res = response()
    await handler({ method: 'POST', body: { items, contact } }, res)
    assert.equal(res.code, 400)
  }
  const badOrigin = createCheckoutHandler({ createStripe: () => stripe,
    environment: { ...environment, CHECKOUT_PUBLIC_URL: 'https://user:password@store.example.invalid/path' } })
  const res = response()
  await badOrigin({ method: 'POST', body: { items: eligibleCart, contact } }, res)
  assert.equal(res.code, 503)
  assert.deepEqual(calls, [])
})

test('unknown or unbound orders never produce a paid response', async () => {
  for (const query of [{ id: orderId }, { id: orderId, session_id: 'not-a-session' }, { id: [orderId], session_id: sessionId }]) {
    const { stripe, calls } = stripeFixture()
    const handler = createOrderHandler({ createStripe: () => stripe, environment })
    const res = response()
    await handler({ method: 'GET', query }, res)
    assert.equal(res.code, 404)
    assert.equal(res.data.order, undefined)
    assert.deepEqual(calls, [])
  }
  for (const mismatch of [{ client_reference_id: 'GV-SOMEONEELSE' }, { metadata: { orderId: 'GV-SOMEONEELSE' } },
    { mode: 'subscription' }, { id: 'cs_test_different_session' }]) {
    const { stripe } = stripeFixture(mismatch)
    const handler = createOrderHandler({ createStripe: () => stripe, environment })
    const res = response()
    await handler({ method: 'GET', query: { id: orderId, session_id: sessionId } }, res)
    assert.equal(res.code, 404)
    assert.equal(res.data.order, undefined)
  }
})

test('missing or unavailable payment verification never becomes payment success', async () => {
  const noKey = createOrderHandler({ environment: {} })
  const res = response()
  await noKey({ method: 'GET', query: { id: orderId, session_id: sessionId } }, res)
  assert.equal(res.code, 503)
  for (const code of ['resource_missing', 'api_connection_error']) {
    const { stripe } = stripeFixture()
    stripe.checkout.sessions.retrieve = async () => { throw Object.assign(new Error('private diagnostic'), { code }) }
    const handler = createOrderHandler({ createStripe: () => stripe, environment })
    const result = response()
    await handler({ method: 'GET', query: { id: orderId, session_id: sessionId } }, result)
    assert.equal(result.code, code === 'resource_missing' ? 404 : 503)
    assert.equal(result.data.order, undefined)
    assert.doesNotMatch(JSON.stringify(result.data), /private diagnostic/)
  }
})

test('only a bound, complete and paid Stripe session is shown as paid', async () => {
  for (const [overrides, expected] of [[{}, 'paid'], [{ payment_status: 'unpaid' }, 'pending'],
    [{ status: 'open' }, 'pending'], [{ status: 'expired', payment_status: 'unpaid' }, 'expired']]) {
    const { stripe } = stripeFixture(overrides)
    const handler = createOrderHandler({ createStripe: () => stripe, environment })
    const res = response()
    await handler({ method: 'GET', query: { id: orderId, session_id: sessionId } }, res)
    assert.equal(res.code, 200)
    assert.equal(res.data.order.payStatus, expected)
    assert.equal(res.data.order.totalCents, 5999)
    assert.equal(res.data.order.paidAt, null)
    assert.equal(res.data.order.items[0].productTitle, 'Local verified product')
    assert.equal(res.data.order.items[0].variantId, 'elden-ring-standard')
  }
})

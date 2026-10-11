import crypto from 'node:crypto'
import { badRequest, conflict, serviceUnavailable } from '../errors.js'
import { stripeLiveMode } from '../config.js'
import { priceOneTimeCart, priceSubscriptionVariant, fingerprint } from './pricing.js'
import { reserveForAttempt, releaseAttempt, releaseExpired } from './inventory.js'
import { codesForItem } from './fulfilment.js'

// Checkout orchestration: pending-order snapshot FIRST (one DB transaction),
// Stripe network calls AFTER (never hold a transaction open across the network).
// Rapid clicks / retries reuse the same attempt + open session via the
// fingerprint; Stripe idempotency keys make session creation safe to retry.

const ORDER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function newOrderId() {
  let s = ''
  for (let i = 0; i < 6; i += 1) s += ORDER_ALPHABET[crypto.randomInt(ORDER_ALPHABET.length)]
  return `GV-${s}`
}

async function uniqueOrderId(models) {
  for (let i = 0; i < 5; i += 1) {
    const id = newOrderId()
    if (!(await models.Order.findByPk(id))) return id
  }
  throw new Error('Could not allocate an order id.')
}

function validateContact(contact) {
  const c = contact || {}
  const first = (c.firstName || '').trim()
  const last = (c.lastName || '').trim()
  const email = (c.email || '').trim()
  const country = (c.country || '').trim() || 'Singapore'
  if (first.length + last.length + 1 > 120 || email.length > 190 || country.length > 80) throw badRequest('BAD_CONTACT', 'Contact details are too long.')
  if (!first || !last) throw badRequest('BAD_CONTACT', 'First and last name are required.')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest('BAD_CONTACT', 'A valid email is required.')
  return { name: `${first} ${last}`, email, country }
}

export function dbLoaders(models) {
  return {
    findVariant: async (id) => {
      const row = await models.Variant.findByPk(id, { include: [{ model: models.Product }] })
      if (!row) return null
      const p = row.Product
      let availableCount = null
      const trackInventory = p?.fulfilment !== 'manual' && (row.trackInventory || p?.fulfilment === 'code_inventory')
      if (trackInventory) {
        availableCount = await models.InventoryCode.count({ where: { variantId: row.id, status: 'available' } })
      }
      return {
        id: row.id, label: row.label, priceCents: row.priceCents, stock: row.stock,
        billingType: row.billingType, billingInterval: row.billingInterval,
        stripePriceId: row.stripePriceId, active: row.active,
        productTitle: p ? p.title : id, productType: p ? p.productType : 'gift_card',
        publication: p ? p.publication : 'archived', availability: p ? p.availability : 'out_of_stock',
        fulfilment: p ? p.fulfilment : 'demo_test',
        trackInventory, availableCount,
        imagePath: p ? (p.artworkPath || null) : null, region: p ? p.region : '',
      }
    },
    findPromo: async (code) => models.PromoCode.findByPk(code),
  }
}

// LIVE SAFETY: only real, stocked code-inventory products can be sold for
// real money. Demo, supplier, and manual rows have no live fulfillment path.
// This throws before any order row or Stripe call when the server runs live.
function assertSellableInLiveMode(lines, cfg) {
  if (!stripeLiveMode(cfg)) return
  const demo = lines.filter((line) => (line.fulfilment || 'demo_test') === 'demo_test')
  if (demo.length) {
    throw badRequest(
      'DEMO_NOT_FOR_SALE',
      `Not available for purchase: ${demo.map((line) => line.productTitle).join(', ')}. Demo listings can't be sold for real money.`,
    )
  }
  const unsupported = lines.filter((l) => !['code_inventory', 'manual'].includes(l.fulfilment))
  if (unsupported.length) {
    throw badRequest(
      'LIVE_FULFILMENT_UNAVAILABLE',
      `Not available for live purchase: ${unsupported.map((l) => l.productTitle).join(', ')}. Choose an email-delivered offer or a stocked activation code.`,
    )
  }
}

// Reuse-or-create the (order + attempt) pair inside ONE transaction.

async function ensureCustomer(stripe, user, contact) {
  // Logged-in: reuse the server-owned customer id. Guest (user == null):
  // create a one-off Stripe customer from the checkout contact — nothing is
  // saved locally since there is no user row.
  if (user) {
    if (user.stripeCustomerId) return user.stripeCustomerId
    const customer = await stripe.customers.create({
      email: user.email, name: user.name,
      metadata: { gamevaultUserId: user.id },
    })
    await user.update({ stripeCustomerId: customer.id })
    return customer.id
  }
  const guest = await stripe.customers.create({
    email: contact.email, name: contact.name,
    metadata: { gamevaultGuest: '1' },
  })
  return guest.id
}

// Create the Stripe Coupon for a promo exactly once; the id is cached on the row.
async function ensureCoupon(stripe, promoRow) {
  if (promoRow.stripeCouponId) return promoRow.stripeCouponId
  const coupon = await stripe.coupons.create(
    {
      amount_off: promoRow.discountCents, currency: 'sgd', duration: 'once',
      name: `${promoRow.code} — ${promoRow.description}`.slice(0, 40),
      metadata: { gamevaultPromo: promoRow.code },
    },
    { idempotencyKey: `gv-coupon-${promoRow.code}` },
  )
  await promoRow.update({ stripeCouponId: coupon.id })
  return coupon.id
}

function sessionUrls(cfg, orderId) {
  return {
    success_url: `${cfg.clientUrl}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cfg.clientUrl}/checkout/cancel?order_id=${orderId}`,
  }
}

async function tryReuseOpenSession(stripe, attempt, totalCents) {
  if (!attempt?.stripeSessionId || attempt.status !== 'open') return null
  try {
    const session = await stripe.checkout.sessions.retrieve(attempt.stripeSessionId)
    if (session.status === 'open' && session.amount_total === totalCents && session.currency === 'sgd') {
      return session
    }
  } catch {
    // Fall through and create a fresh session (e.g. key rotation).
  }
  return null
}

export async function createOneTimeCheckout({ user, body }, { models, sequelize, stripe, cfg }) {
  const contact = validateContact(body?.contact)
  const priced = await priceOneTimeCart(
    { items: body?.items, promoCode: body?.promoCode }, dbLoaders(models),
  )
  assertSellableInLiveMode(priced.lines, cfg)
  if (stripeLiveMode(cfg) && !cfg.stripeWebhookSecret?.startsWith('whsec_')) {
    throw serviceUnavailable('Payments are temporarily unavailable. Please try again later.')
  }
  const fp = crypto.createHash('sha256')
    .update(fingerprint('payment', priced.lines, priced.promoCode, contact.email))
    .update(JSON.stringify({ lines: [...priced.lines].sort((a, b) => a.variantId.localeCompare(b.variantId)), totalCents: priced.totalCents, contact }))
    .digest('hex')

  // 1) Pending snapshot (transaction, no network). Inventory-backed lines
  // reserve stock for this attempt here; the hold releases on cancel/expiry.
  // Guests (user == null) dedupe by fingerprint alone — the fingerprint
  // already embeds the contact email, so different guests never collide.
  const attemptWhere = user?.id ? { userId: user.id, fingerprint: fp } : { userId: null, fingerprint: fp }
  const { attempt, order, created } = await sequelize.transaction(async (t) => {
    await releaseExpired(models)
    const existing = await models.CheckoutAttempt.findOne({
      where: attemptWhere, transaction: t, lock: t.LOCK.UPDATE,
    })
    if (existing) {
      const ord = await models.Order.findByPk(existing.orderId, { transaction: t, lock: t.LOCK.UPDATE })
      if (!ord) throw conflict('STALE_ATTEMPT', 'This checkout expired. Please try again.')
      // A guest fingerprint must never claim another account's order (and
      // vice versa): the owner side has to match.
      const ownerMatches = user?.id ? ord.userId === user.id : !ord.userId
      if (!ownerMatches) {
        // Same fingerprint hash but different owner — treat as a fresh guest
        // checkout below instead of hijacking the existing attempt.
      } else {
        if (ord.payStatus === 'paid') throw conflict('ALREADY_PAID', 'This order is already paid.')
        // Reset a stale terminal state so the same cart can be retried.
        await ord.update({ payStatus: 'pending', fulfilStatus: 'pending' }, { transaction: t })
        await releaseAttempt(models, existing.id, t)
        for (const l of priced.lines) {
          if (l.trackInventory) await reserveForAttempt(models, l.variantId, l.qty, existing.id, t)
        }
        return { attempt: existing, order: ord, created: false }
      }
    }
    const orderId = await uniqueOrderId(models)
    const ord = await models.Order.create({
      id: orderId, userId: user?.id || null, mode: 'payment',
      payStatus: 'pending', fulfilStatus: 'pending',
      subtotalCents: priced.subtotalCents, discountCents: priced.discountCents,
      totalCents: priced.totalCents, currency: priced.currency, promoCode: priced.promoCode,
      contactName: contact.name, contactEmail: contact.email, contactCountry: contact.country,
    }, { transaction: t })
    await models.OrderItem.bulkCreate(priced.lines.map((l) => ({
      orderId, variantId: l.variantId, productTitle: l.productTitle, variantLabel: l.variantLabel,
      unitCents: l.unitCents, qty: l.qty, lineTotalCents: l.lineTotalCents,
      imagePath: l.imagePath, productType: l.productType, playerRef: l.playerRef,
      fulfilment: l.fulfilment, region: l.region, deliveryWindowMinutes: l.deliveryWindowMinutes,
    })), { transaction: t })
    const att = await models.CheckoutAttempt.create({
      userId: user?.id || null, orderId, fingerprint: fp, status: 'open',
    }, { transaction: t })
    for (const l of priced.lines) {
      if (l.trackInventory) await reserveForAttempt(models, l.variantId, l.qty, att.id, t)
    }
    return { attempt: att, order: ord, created: true }
  })

  // 2) Reuse an open session for the unchanged attempt (rapid double-clicks land here).
  const reused = await tryReuseOpenSession(stripe, attempt, priced.totalCents)
  if (reused?.url) return { url: reused.url, orderId: order.id, reused: true }

  // 3) Stripe calls (outside the transaction).
  const customerId = await ensureCustomer(stripe, user, contact)
  let discounts = []
  if (priced.promoCode) {
    const promoRow = await models.PromoCode.findByPk(priced.promoCode)
    discounts = [{ coupon: await ensureCoupon(stripe, promoRow) }]
  }
  const version = created ? 1 : attempt.version + 1
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      // NOTE: customer XOR customer_email — Stripe rejects both together.
      // We always have a real customer (guest ones are created from this
      // same contact email in ensureCustomer), so customer wins.
      customer: customerId,
      client_reference_id: order.id,
      line_items: priced.lines.map((l) => ({
        quantity: l.qty,
        price_data: {
          currency: 'sgd',
          unit_amount: l.unitCents,
          product_data: {
            name: `${l.productTitle} — ${l.variantLabel}`.slice(0, 200),
            metadata: { gamevaultVariantId: l.variantId },
          },
        },
      })),
      discounts,
      metadata: { gamevaultOrderId: order.id, gamevaultAttemptId: attempt.id, gamevaultUserId: user?.id || '', guestEmail: user ? '' : contact.email, mode: 'payment' },
      ...sessionUrls(cfg, order.id),
    },
    { idempotencyKey: `gv-${attempt.id}-v${version}` },
  )

  // 4) Persist the session link (separate short update — recovery: the success
  // page + webhooks key off the order, and a retry reuses this session).
  await attempt.update({ stripeSessionId: session.id, version, status: 'open' })
  await order.update({ stripeSessionId: session.id, stripeCustomerId: customerId })
  return { url: session.url, orderId: order.id, reused: false }
}

export async function createSubscriptionCheckout({ user, body }, { models, sequelize, stripe, cfg }) {
  if (stripeLiveMode(cfg)) {
    throw badRequest('LIVE_RECURRING_DISABLED', 'Memberships use a one-time payment for a fixed term. Choose a one-time offer instead.')
  }
  const contact = validateContact(body?.contact)
  if ((body?.promoCode || '').trim()) {
    throw badRequest('PROMO_NOT_SUPPORTED', 'Promo codes apply to one-time orders only, not recurring plans.')
  }
  const priced = await priceSubscriptionVariant(body?.variantId, dbLoaders(models))
  assertSellableInLiveMode([priced], cfg)

  // One active entitlement per service: block accidental duplicates (logged-in
  // users only — guests have no account to dedupe against).
  if (user?.id) {
    const existing = await models.Subscription.findOne({
      where: { userId: user.id, variantId: priced.variantId, status: ['active', 'trialing', 'past_due'] },
    })
    if (existing) {
      throw conflict('ALREADY_SUBSCRIBED', `You already have an active ${priced.productTitle} plan. Manage it from Account → Subscriptions.`)
    }
  }

  const fp = fingerprint('subscription', [{ variantId: priced.variantId, qty: 1 }], '', contact.email)
  const subAttemptWhere = user?.id ? { userId: user.id, fingerprint: fp } : { userId: null, fingerprint: fp }
  const { attempt, order } = await sequelize.transaction(async (t) => {
    const prev = await models.CheckoutAttempt.findOne({
      where: subAttemptWhere, transaction: t, lock: t.LOCK.UPDATE,
    })
    if (prev) {
      const ord = await models.Order.findByPk(prev.orderId, { transaction: t, lock: t.LOCK.UPDATE })
      if (!ord) throw conflict('STALE_ATTEMPT', 'This checkout expired. Please try again.')
      const ownerMatches = user?.id ? ord.userId === user.id : !ord.userId
      if (ownerMatches) {
        if (ord.payStatus === 'paid') throw conflict('ALREADY_PAID', 'This order is already paid.')
        await ord.update({ payStatus: 'pending', fulfilStatus: 'pending' }, { transaction: t })
        return { attempt: prev, order: ord }
      }
    }
    const orderId = await uniqueOrderId(models)
    const ord = await models.Order.create({
      id: orderId, userId: user?.id || null, mode: 'subscription',
      payStatus: 'pending', fulfilStatus: 'pending',
      subtotalCents: priced.totalCents, discountCents: 0, totalCents: priced.totalCents,
      currency: priced.currency, promoCode: null,
      contactName: contact.name, contactEmail: contact.email, contactCountry: contact.country,
    }, { transaction: t })
    await models.OrderItem.create({
      orderId, variantId: priced.variantId, productTitle: priced.productTitle,
      variantLabel: priced.variantLabel, unitCents: priced.unitCents, qty: 1,
      lineTotalCents: priced.totalCents,
      imagePath: priced.imagePath, productType: priced.productType, playerRef: null,
    }, { transaction: t })
    const att = await models.CheckoutAttempt.create({
      userId: user?.id || null, orderId, fingerprint: fp, status: 'open',
    }, { transaction: t })
    return { attempt: att, order: ord }
  })

  const reused = await tryReuseOpenSession(stripe, attempt, priced.totalCents)
  if (reused?.url) return { url: reused.url, orderId: order.id, reused: true }

  const customerId = await ensureCustomer(stripe, user, contact)
  const lineItem = priced.stripePriceId
    ? { price: priced.stripePriceId, quantity: 1 } // pre-configured dashboard Price wins
    : {
        quantity: 1,
        price_data: {
          currency: 'sgd',
          unit_amount: priced.unitCents,
          recurring: { interval: priced.interval },
          product_data: { name: `${priced.productTitle} — ${priced.variantLabel}`.slice(0, 200) },
        },
      }
  const version = attempt.version + (attempt.stripeSessionId ? 1 : 0)
  const session = await stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      // NOTE: customer XOR customer_email — Stripe rejects both together.
      customer: customerId,
      client_reference_id: order.id,
      line_items: [lineItem],
      subscription_data: {
        metadata: { gamevaultOrderId: order.id, gamevaultAttemptId: attempt.id, gamevaultUserId: user?.id || '', guestEmail: user ? '' : contact.email, variantId: priced.variantId },
      },
      metadata: { gamevaultOrderId: order.id, gamevaultAttemptId: attempt.id, gamevaultUserId: user?.id || '', guestEmail: user ? '' : contact.email, mode: 'subscription' },
      ...sessionUrls(cfg, order.id),
    },
    { idempotencyKey: `gv-${attempt.id}-v${Math.max(version, 1)}` },
  )
  await attempt.update({ stripeSessionId: session.id, version: Math.max(version, 1), status: 'open' })
  await order.update({ stripeSessionId: session.id, stripeCustomerId: customerId })
  return { url: session.url, orderId: order.id, reused: false }
}

// Owner-scoped order view for the success page + account (codes only surface
// once fulfilled; the browser never learns unallocated inventory).
export async function getOrderForUser(models, userId, orderId) {
  if (!userId) return null
  const order = await models.Order.findOne({
    where: { id: orderId, userId },
    include: [{ model: models.OrderItem, include: [models.CodeAllocation] }],
  })
  if (!order) return null
  return serializeOrder(order, models)
}

// Guest order view: the Stripe checkout session id acts as the access token.
// It is unguessable (cs_test_...), delivered only via the success_url to the
// browser that just paid, and stored server-side at session-creation time.
// No session id (or a mismatch) → null, so order ids cannot be enumerated.
export async function getGuestOrder(models, orderId, sessionId) {
  if (!orderId || !sessionId) return null
  const order = await models.Order.findOne({
    where: { id: orderId },
    include: [{ model: models.OrderItem, include: [models.CodeAllocation] }],
  })
  if (!order) return null
  if (!order.stripeSessionId || order.stripeSessionId !== sessionId) return null
  return serializeOrder(order, models)
}

async function serializeOrder(order, models) {
  const items = await Promise.all((order.OrderItems || []).map(async (it) => ({
    id: it.id, variantId: it.variantId, productTitle: it.productTitle,
    variantLabel: it.variantLabel, unitCents: it.unitCents, qty: it.qty,
    lineTotalCents: it.lineTotalCents, fulfilment: it.fulfilment, region: it.region,
    deliveryWindowMinutes: it.deliveryWindowMinutes, deliveredAt: it.deliveredAt,
    codes: order.payStatus === 'paid'
      ? (await Promise.all((it.CodeAllocations || []).map(c => codesForItem(models, c)))).filter(Boolean)
      : [],
  })))
  return {
    id: order.id, mode: order.mode, payStatus: order.payStatus, fulfilStatus: order.fulfilStatus,
    subtotalCents: order.subtotalCents, discountCents: order.discountCents,
    totalCents: order.totalCents, currency: order.currency, promoCode: order.promoCode,
    contact: { name: order.contactName, email: order.contactEmail, country: order.contactCountry },
    date: order.createdAt, paidAt: order.paidAt, stripeSubscriptionId: order.stripeSubscriptionId, items,
    guest: !order.userId,
  }
}

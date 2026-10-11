import crypto from 'node:crypto'
import { badRequest, conflict } from '../errors.js'
import { priceOneTimeCart, fingerprint } from './pricing.js'
import { reserveForAttempt, releaseAttempt, releaseExpired } from './inventory.js'
import {
  platformFeeForSeparate,
  splitSellerPool,
  separateCheckoutParams,
  isReadyForDestination,
} from './connectService.js'

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
  if (!first || !last) throw badRequest('BAD_CONTACT', 'First and last name are required.')
  if (!/^\S+@\S+\.\S+$/.test(email)) throw badRequest('BAD_CONTACT', 'A valid email is required.')
  return { name: `${first} ${last}`, email, country }
}

function dbLoaders(models) {
  return {
    findVariant: async (id) => {
      const row = await models.Variant.findByPk(id, { include: [{ model: models.Product }] })
      if (!row) return null
      const p = row.Product
      let availableCount = null
      if (row.trackInventory) {
        availableCount = await models.InventoryCode.count({ where: { variantId: row.id, status: 'available' } })
      }
      return {
        id: row.id, label: row.label, priceCents: row.priceCents, stock: row.stock,
        billingType: row.billingType, billingInterval: row.billingInterval,
        stripePriceId: row.stripePriceId, active: row.active,
        productTitle: p ? p.title : id, productType: p ? p.productType : 'gift_card',
        publication: p ? p.publication : 'archived', availability: p ? p.availability : 'out_of_stock',
        trackInventory: row.trackInventory, availableCount,
        imagePath: p ? (p.artworkPath || null) : null, region: p ? p.region : '',
      }
    },
    findPromo: async (code) => models.PromoCode.findByPk(code),
  }
}

async function ensureCustomer(stripe, user) {
  if (user.stripeCustomerId) return user.stripeCustomerId
  const customer = await stripe.customers.create({
    email: user.email, name: user.name,
    metadata: { gamevaultUserId: user.id },
  })
  await user.update({ stripeCustomerId: customer.id })
  return customer.id
}

function sessionUrls(cfg, orderId) {
  return {
    success_url: `${cfg.clientUrl}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${cfg.clientUrl}/checkout/cancel?order_id=${orderId}`,
  }
}

// Hold-and-release checkout (separate charges + transfers).
// Body: { contact, items, promoCode?, splits: [{ stripeAccountId, amountCents? }]|sellerAccountId?, percentBps?, stripeFeeEstimateCents? }
// - If splits omit amountCents and there is ONE seller, they get the full seller pool.
// - If multiple sellers omit amounts, pool splits evenly (remainder to platform).
export async function createSeparateHoldCheckout({ user, body }, { models, sequelize, stripe, cfg }) {
  const contact = validateContact(body?.contact)
  const priced = await priceOneTimeCart(
    { items: body?.items, promoCode: body?.promoCode }, dbLoaders(models),
  )
  if (priced.promoCode) throw badRequest('PROMO_NOT_SUPPORTED', 'Promos are not supported on marketplace hold orders in this milestone.')

  const percentBps = body?.percentBps ?? 1000 // 10% default
  const stripeFeeEstimateCents = body?.stripeFeeEstimateCents ?? 0
  const { platformFeeCents, sellerPoolCents } = platformFeeForSeparate({
    totalCents: priced.totalCents, percentBps, stripeFeeEstimateCents,
  })

  // Normalise splits input.
  let reqSplits = body?.splits
  if (!reqSplits && body?.sellerAccountId) reqSplits = [{ stripeAccountId: body.sellerAccountId }]
  if (!Array.isArray(reqSplits) || !reqSplits.length) throw badRequest('BAD_SELLER', 'Provide sellerAccountId or splits[].')
  if (reqSplits.length === 1 && !reqSplits[0].amountCents) {
    reqSplits = [{ stripeAccountId: reqSplits[0].stripeAccountId, amountCents: sellerPoolCents }]
  } else if (reqSplits.some((s) => !s.amountCents)) {
    // Even split fallback for multi-seller without explicit amounts.
    const even = Math.floor(sellerPoolCents / reqSplits.length)
    reqSplits = reqSplits.map((s) => ({ stripeAccountId: s.stripeAccountId, amountCents: s.amountCents || even }))
  }
  const { allocated } = splitSellerPool({ sellerPoolCents, splits: reqSplits })
  void allocated

  // Validate sellers are recipient-capable (destination/separate share config).
  for (const s of reqSplits) {
    const row = await models.ConnectedAccount.findOne({ where: { stripeAccountId: s.stripeAccountId } })
    if (!row || !['destination', 'separate'].includes(row.chargePattern)) {
      throw badRequest('BAD_SELLER', `Seller ${s.stripeAccountId} is not a marketplace (destination/separate) account.`)
    }
    const live = await stripe.v2.core.accounts.retrieve(s.stripeAccountId)
    if (!isReadyForDestination(live)) {
      throw badRequest('SELLER_NOT_READY', `Seller ${s.stripeAccountId} capabilities not active yet. Complete onboarding first.`)
    }
  }

  const fp = fingerprint('separate', priced.lines, '', contact.email)

  const { attempt, order } = await sequelize.transaction(async (t) => {
    await releaseExpired(models)
    const existing = await models.CheckoutAttempt.findOne({
      where: { userId: user.id, fingerprint: fp }, transaction: t, lock: t.LOCK.UPDATE,
    })
    if (existing) {
      const ord = await models.Order.findByPk(existing.orderId, { transaction: t, lock: t.LOCK.UPDATE })
      if (ord.payStatus === 'paid') throw conflict('ALREADY_PAID', 'This order is already paid.')
      await ord.update({
        payStatus: 'pending', fulfilStatus: 'pending',
        connectPattern: 'separate', connectTransferStatus: 'pending', platformFeeCents,
      }, { transaction: t })
      await models.OrderTransfer.destroy({ where: { orderId: ord.id }, transaction: t })
      await models.OrderTransfer.bulkCreate(reqSplits.map((s) => ({
        orderId: ord.id, stripeAccountId: s.stripeAccountId, amountCents: s.amountCents, currency: priced.currency,
        status: 'pending',
      })), { transaction: t })
      await releaseAttempt(models, existing.id, t)
      for (const l of priced.lines) {
        if (l.trackInventory) await reserveForAttempt(models, l.variantId, l.qty, existing.id, t)
      }
      return { attempt: existing, order: ord }
    }
    const orderId = await uniqueOrderId(models)
    const ord = await models.Order.create({
      id: orderId, userId: user.id, mode: 'payment',
      payStatus: 'pending', fulfilStatus: 'pending',
      subtotalCents: priced.subtotalCents, discountCents: 0, totalCents: priced.totalCents,
      currency: priced.currency, promoCode: null,
      contactName: contact.name, contactEmail: contact.email, contactCountry: contact.country,
      connectPattern: 'separate', connectTransferStatus: 'pending', platformFeeCents,
    }, { transaction: t })
    await models.OrderItem.bulkCreate(priced.lines.map((l) => ({
      orderId, variantId: l.variantId, productTitle: l.productTitle, variantLabel: l.variantLabel,
      unitCents: l.unitCents, qty: l.qty, lineTotalCents: l.lineTotalCents,
      imagePath: l.imagePath, productType: l.productType, playerRef: l.playerRef,
    })), { transaction: t })
    const att = await models.CheckoutAttempt.create({
      userId: user.id, orderId, fingerprint: fp, status: 'open',
    }, { transaction: t })
    await models.OrderTransfer.bulkCreate(reqSplits.map((s) => ({
      orderId, stripeAccountId: s.stripeAccountId, amountCents: s.amountCents, currency: priced.currency,
      status: 'pending',
    })), { transaction: t })
    for (const l of priced.lines) {
      if (l.trackInventory) await reserveForAttempt(models, l.variantId, l.qty, att.id, t)
    }
    return { attempt: att, order: ord }
  })

  const customerId = await ensureCustomer(stripe, user)
  const params = separateCheckoutParams({
    orderId: order.id, userId: user.id, lines: priced.lines, customerId, platformFeeCents,
    currency: priced.currency.toLowerCase(),
    ...sessionUrls(cfg, order.id),
  })
  const version = attempt.version + (attempt.stripeSessionId ? 1 : 0)
  const session = await stripe.checkout.sessions.create(
    params,
    { idempotencyKey: `gv-sep-${attempt.id}-v${Math.max(version, 1)}` },
  )
  await attempt.update({ stripeSessionId: session.id, version: Math.max(version, 1), status: 'open' })
  await order.update({ stripeSessionId: session.id, stripeCustomerId: customerId })
  return {
    url: session.url, orderId: order.id,
    totalCents: priced.totalCents, platformFeeCents, sellerPoolCents,
    splits: reqSplits, pattern: 'separate',
  }
}

import { fulfilOrder } from './fulfilment.js'
import { syncSubscriptionFromStripe, handleInvoicePaid, handleInvoiceFailed } from './subscriptionService.js'

// Verified Stripe webhooks. Safety rules:
// - Raw body + signature check happen in the route, before any JSON parsing.
// - Every event is ledgered in stripe_events (PK = Stripe event id).
// - Business changes + "processed" marking commit in ONE transaction, so a
//   stored event is never called processed before its effects commit.
// - Duplicate deliveries: PK hit → already processed → 200, no double fulfil.
// - Crash between receive and commit: row stays "received"/"failed" → next
//   delivery reprocesses (all business writes are idempotent).
// - Only id + type + short errors are logged. Never payloads or secrets.

export function verifySignature(stripe, rawBody, signature, webhookSecret) {
  // Throws StripeSignatureVerificationError on mismatch (tests cover this offline).
  return stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
}

const HANDLED = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'checkout.session.expired',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  // Connect platform: capability transitions + fund safety.
  'account.updated',
  'capability.updated',
  'v2.core.account.updated',
  'transfer.reversed',
  'charge.refunded',
  'charge.dispute.created',
])

export async function processEvent(models, sequelize, stripe, event, opts = {}) {
  // Claim the event row first: concurrent duplicates collide on the PK and the
  // loser sees the winner's final status.
  // opts.live (boolean): set by the webhook route from server config. In live
  // mode fulfilment refuses demo_test products (see fulfilment.js).
  const [row, created] = await models.StripeEvent.findOrCreate({
    where: { eventId: event.id },
    defaults: { type: event.type, status: 'received' },
  })
  if (!created && row.status === 'processed') return { duplicate: true }

  if (!HANDLED.has(event.type)) {
    await row.update({ status: 'processed', processedAt: new Date() })
    return { ignored: true, type: event.type }
  }

  try {
    const outcome = await sequelize.transaction(async (t) => {
      const locked = await models.StripeEvent.findByPk(event.id, { transaction: t, lock: t.LOCK.UPDATE })
      const result = await routeEvent(models, stripe, event, t, opts)
      await locked.update(
        { status: 'processed', processedAt: new Date(), attempts: locked.attempts + 1, lastError: null },
        { transaction: t },
      )
      return result
    })
    return { processed: true, ...outcome }
  } catch (err) {
    // Persist the failure WITHOUT marking processed, so Stripe's retry
    // redelivers and we try again. 500 tells Stripe to retry.
    await row.update({
      status: 'failed', attempts: row.attempts + 1,
      lastError: String(err?.message || err).slice(0, 500),
    })
    throw err
  }
}

async function routeEvent(models, stripe, event, t, opts = {}) {
  const obj = event.data.object
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.async_payment_succeeded':
      return applyPaidSession(models, stripe, obj, t, opts)
    case 'checkout.session.async_payment_failed':
      return applyFailedSession(models, obj, t, 'failed')
    case 'checkout.session.expired':
      return applyFailedSession(models, obj, t, 'expired')
    case 'invoice.paid':
      return handleInvoicePaid(models, stripe, obj, t)
    case 'invoice.payment_failed':
      return handleInvoiceFailed(models, obj, t)
    case 'customer.subscription.updated': {
      const sub = await stripe.subscriptions.retrieve(obj.id)
      await syncSubscriptionFromStripe(models, sub, {}, t)
      return { subscription: sub.id }
    }
    case 'customer.subscription.deleted': {
      const existing = await models.Subscription.findOne({ where: { stripeSubscriptionId: obj.id }, transaction: t })
      if (existing) await existing.update({ status: 'canceled', cancelAtPeriodEnd: false }, { transaction: t })
      return { subscription: obj.id }
    }
    case 'account.updated':
    case 'v2.core.account.updated':
    case 'capability.updated': {
      return syncConnectedAccount(models, stripe, obj, t)
    }
    case 'transfer.reversed': {
      return handleTransferReversed(models, obj, t)
    }
    case 'charge.refunded':
    case 'charge.dispute.created': {
      return flagHoldForReview(models, obj, event.type, t)
    }
    default:
      return { ignored: true }
  }
}

async function handleTransferReversed(models, transfer, t) {
  if (!models.OrderTransfer) return { ignored: true, reason: 'no-transfer-table' }
  const tx = t ? { transaction: t } : {}
  const existing = await models.OrderTransfer.findOne({ where: { stripeTransferId: transfer.id }, ...tx })
  if (!existing) return { ignored: true, reason: 'unknown-transfer' }
  await existing.update({ status: 'reversed' }, tx)
  return { reversed: transfer.id }
}

async function flagHoldForReview(models, obj, type, t) {
  // Do NOT auto-reverse — surface for admin to call POST /api/connect/orders/:id/reverse.
  // We ledger the event (processed) and leave funds untouched to avoid double-reversal races.
  if (!models.Order) return { ignored: true }
  const tx = t ? { transaction: t } : {}
  const piId = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id
  if (!piId) return { ignored: true, reason: 'no-pi' }
  const order = await models.Order.findOne({ where: { stripePaymentIntentId: piId }, ...tx })
  if (!order || order.connectPattern !== 'separate') return { ignored: true, reason: 'not-hold-order' }
  return { flagged: true, orderId: order.id, type }
}

async function syncConnectedAccount(models, stripe, obj, t) {
  if (!models.ConnectedAccount) return { ignored: true, reason: 'no-connect-table' }
  const accountId = obj?.id || obj?.account || null
  if (!accountId) return { ignored: true, reason: 'no-account-id' }
  const existing = await models.ConnectedAccount.findOne({ where: { stripeAccountId: accountId }, transaction: t })
  if (!existing) return { ignored: true, reason: 'unknown-account' }
  // Authoritative read: capability status lives on the live v2 account object.
  let live = obj
  try {
    if (stripe?.v2?.core?.accounts?.retrieve) live = await stripe.v2.core.accounts.retrieve(accountId)
  } catch {
    // Fall through with webhook payload if retrieve fails (transient).
  }
  const transfers = live?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status
  const cardPay = live?.configuration?.merchant?.capabilities?.card_payments?.status
  const ready = existing.chargePattern === 'direct' ? cardPay === 'active' : transfers === 'active'
  // Stripe may send charges_enabled/payouts_enabled (v1) — ignore, use v2 paths above.
  await existing.update({ status: ready ? 'active' : 'restricted' }, { transaction: t })
  return { accountId, ready }
}

function orderMeta(session) {
  return {
    orderId: session?.metadata?.gamevaultOrderId || session?.client_reference_id || null,
    userId: session?.metadata?.gamevaultUserId || null,
    mode: session?.metadata?.mode || session?.mode || null,
  }
}

async function loadOrderLocked(models, session, t) {
  const { orderId } = orderMeta(session)
  if (!orderId) return null
  const order = await models.Order.findByPk(orderId, { transaction: t, lock: t.LOCK.UPDATE })
  if (!order) return null
  // Session fixation guard: ignore events for a session id we never issued.
  if (order.stripeSessionId && order.stripeSessionId !== session.id) return 'mismatch'
  return order
}

// Shared by checkout.session.completed (paid) + async_payment_succeeded.
// A session counts as PAID only when payment_status === 'paid' — completed
// alone (e.g. delayed methods still pending) must NOT fulfil.
async function applyPaidSession(models, stripe, session, t, opts = {}) {
  if (session.payment_status !== 'paid') return { pending: true, status: session.payment_status }
  const order = await loadOrderLocked(models, session, t)
  if (!order) return { ignored: true, reason: 'unknown-order' }
  if (order === 'mismatch') return { ignored: true, reason: 'session-mismatch' }

  const patch = {
    payStatus: 'paid',
    paidAt: order.paidAt || new Date(),
    stripePaymentIntentId: typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || order.stripePaymentIntentId,
    stripeCustomerId: typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id || order.stripeCustomerId,
  }
  const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id
  if (subId) patch.stripeSubscriptionId = subId
  await order.update(patch, { transaction: t })

  if (order.mode === 'subscription' && subId) {
    // Authoritative subscription read; link plan from our attempt metadata.
    const stripeSub = await stripe.subscriptions.retrieve(subId)
    const attempt = await models.CheckoutAttempt.findOne({ where: { orderId: order.id }, transaction: t })
    const item = await models.OrderItem.findOne({ where: { orderId: order.id }, transaction: t })
    await syncSubscriptionFromStripe(models, stripeSub, {
      userId: order.userId,
      planName: item ? `${item.productTitle} — ${item.variantLabel}` : 'GameVault plan',
      variantId: stripeSub.metadata?.variantId || item?.variantId || 'unknown',
    }, t)
    if (attempt && attempt.status !== 'completed') await attempt.update({ status: 'completed' }, { transaction: t })
  } else {
    const attempt = await models.CheckoutAttempt.findOne({ where: { orderId: order.id }, transaction: t })
    if (attempt && attempt.status !== 'completed') await attempt.update({ status: 'completed' }, { transaction: t })
  }

  // Inside the same tx: duplicate paid events converge here safely.
  const fulfil = await fulfilOrder(models, order, t, opts)
  return { orderId: order.id, alreadyFulfilled: fulfil.alreadyFulfilled }
}

// Terminal negatives only apply while still pending — never overwrite 'paid'.
async function applyFailedSession(models, session, t, status) {
  const order = await loadOrderLocked(models, session, t)
  if (!order) return { ignored: true, reason: 'unknown-order' }
  if (order === 'mismatch') return { ignored: true, reason: 'session-mismatch' }
  if (order.payStatus !== 'pending') return { unchanged: true, payStatus: order.payStatus }
  await order.update({ payStatus: status }, { transaction: t })
  return { orderId: order.id, payStatus: status }
}

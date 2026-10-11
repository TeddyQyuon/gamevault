// Connect platform service — Accounts v2 ONLY.
// GameVault default: marketplace (platform owns checkout) → destination charges.
// Alternative: SaaS (seller owns checkout) → direct charges.
//
// Blessed paths (see .agents/skills/stripe-best-practices/references/connect.md):
// - Marketplace: dashboard express + fees application + losses application + recipient(stripe_transfers)
// - SaaS: dashboard full + fees stripe + losses stripe + merchant(card_payments)
//
// NEVER use legacy `type: 'express'|'custom'|'standard'`, `charges_enabled`,
// `payouts_enabled`, or `application_fee_amount` with separate charges+transfers.

import crypto from 'node:crypto'
import { badRequest } from '../errors.js'

export const CONNECT_CONFIGS = {
  marketplace: {
    dashboard: 'express',
    feesCollector: 'application',
    lossesCollector: 'application',
    chargePattern: 'destination',
  },
  saas: {
    dashboard: 'full',
    feesCollector: 'stripe',
    lossesCollector: 'stripe',
    chargePattern: 'direct',
  },
}

// ---- validation (pure, unit-tested) ----

export function assertAllowedCombo({ dashboard, feesCollector, lossesCollector, chargePattern }) {
  // Express requires platform-owned pricing + losses (hard API constraint).
  if (dashboard === 'express' && (feesCollector !== 'application' || lossesCollector !== 'application')) {
    throw badRequest(
      'CONNECT_BLOCKED_COMBO',
      'Express dashboard requires fees_collector=application + losses_collector=application.',
    )
  }
  // Stripe-owned losses only safe with direct charges.
  if (lossesCollector === 'stripe' && chargePattern !== 'direct') {
    throw badRequest(
      'CONNECT_BLOCKED_COMBO',
      'losses_collector=stripe is only allowed with direct charges. Use application for destination/separate.',
    )
  }
  // application_fee_amount incompatible with separate charges+transfers.
  if (chargePattern === 'separate' && dashboard === 'full' && feesCollector === 'application') {
    // Sales-gated path — surface early rather than failing at payment time.
    throw badRequest(
      'CONNECT_SALES_GATED',
      'full + application-owned pricing needs Stripe sales review. Prefer express + application/application for separate flows.',
    )
  }
  return true
}

export function feeForDestination({ totalCents, platformFeeCents, stripeFeeEstimateCents = 0 }) {
  // Option A (margin-preserving): application_fee_amount = platform fee + Stripe estimate.
  // Platform NET = platformFeeCents. Connected account gets total - application_fee.
  // Option B (absorb fees) is just stripeFeeEstimateCents = 0.
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw badRequest('BAD_AMOUNT', 'totalCents must be a positive integer.')
  if (!Number.isInteger(platformFeeCents) || platformFeeCents < 0) throw badRequest('BAD_FEE', 'platformFeeCents must be >= 0.')
  const applicationFee = platformFeeCents + stripeFeeEstimateCents
  if (applicationFee >= totalCents) throw badRequest('BAD_FEE', 'Application fee must be less than total.')
  return { applicationFeeAmount: applicationFee, sellerReceives: totalCents - applicationFee }
}

export function transferForSeparate({ totalCents, sellerAmountsCents }) {
  // Separate charges+transfers: platform keeps total - sum(transfers) - Stripe fees.
  // NEVER use application_fee_amount here.
  const sum = sellerAmountsCents.reduce((a, b) => a + b, 0)
  if (sum >= totalCents) throw badRequest('BAD_SPLIT', 'Sum of transfers must be less than total (platform keeps margin + covers Stripe fees).')
  return { totalCents, transfers: sellerAmountsCents, platformRetains: totalCents - sum }
}

// 10% + Stripe estimate (margin-preserving) for hold-and-release.
// percentBps: 1000 = 10%. stripeFeeEstimateCents: pass estimate for your region
// (see stripe.com/pricing) — platform NET = percent cut, Stripe fee covered on top.
export function platformFeeForSeparate({ totalCents, percentBps = 1000, stripeFeeEstimateCents = 0 }) {
  if (!Number.isInteger(totalCents) || totalCents <= 0) throw badRequest('BAD_AMOUNT', 'totalCents must be a positive integer.')
  const cut = Math.round((totalCents * percentBps) / 10000)
  if (!Number.isInteger(stripeFeeEstimateCents) || stripeFeeEstimateCents < 0) {
    throw badRequest('BAD_FEE', 'stripeFeeEstimateCents must be >= 0.')
  }
  const platformFee = cut + stripeFeeEstimateCents
  if (platformFee >= totalCents) throw badRequest('BAD_FEE', 'Platform fee must be less than total.')
  return { platformFeeCents: platformFee, sellerPoolCents: totalCents - platformFee }
}

// Split seller pool across 1..n sellers. Amounts must sum <= sellerPool.
export function splitSellerPool({ sellerPoolCents, splits }) {
  // splits: [{ stripeAccountId, amountCents }]
  if (!Array.isArray(splits) || !splits.length) throw badRequest('BAD_SPLIT', 'At least one seller split is required.')
  let sum = 0
  for (const s of splits) {
    if (!s?.stripeAccountId) throw badRequest('BAD_SELLER', 'Each split needs stripeAccountId.')
    if (!Number.isInteger(s.amountCents) || s.amountCents <= 0) throw badRequest('BAD_SPLIT', 'Each split amount must be a positive integer.')
    sum += s.amountCents
  }
  if (sum > sellerPoolCents) throw badRequest('BAD_SPLIT', `Splits sum ${sum} exceeds seller pool ${sellerPoolCents}. Reduce splits or fee.`)
  return { sellerPoolCents, allocated: sum, remainderToPlatform: sellerPoolCents - sum }
}

// ---- capability checks (pure, unit-tested) ----

export function isReadyForDestination(account) {
  // v2 path: configuration.recipient.capabilities.stripe_balance.stripe_transfers.status === 'active'
  const s = account?.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status
  return s === 'active'
}

export function isReadyForDirect(account) {
  // v2 path: configuration.merchant.capabilities.card_payments.status === 'active'
  const s = account?.configuration?.merchant?.capabilities?.card_payments?.status
  return s === 'active'
}

// ---- Stripe calls (need network / test keys) ----

function randomSuffix() {
  return crypto.randomBytes(4).toString('hex')
}

export async function createMarketplaceAccount(stripe, { email, displayName, country = 'SG', currency = 'sgd' }) {
  assertAllowedCombo({
    dashboard: 'express', feesCollector: 'application', lossesCollector: 'application', chargePattern: 'destination',
  })
  return stripe.v2.core.accounts.create({
    contact_email: email,
    display_name: displayName,
    dashboard: 'express',
    identity: { country: country.toLowerCase(), entity_type: 'individual' },
    configuration: {
      recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } },
    },
    defaults: {
      currency: currency.toLowerCase(),
      responsibilities: { fees_collector: 'application', losses_collector: 'application' },
    },
    metadata: { gamevaultRole: 'seller', gamevaultChargePattern: 'destination' },
  })
}

export async function createSaaSAccount(stripe, { email, displayName, country = 'SG', currency = 'sgd' }) {
  assertAllowedCombo({
    dashboard: 'full', feesCollector: 'stripe', lossesCollector: 'stripe', chargePattern: 'direct',
  })
  return stripe.v2.core.accounts.create({
    contact_email: email,
    display_name: displayName,
    dashboard: 'full',
    identity: { country: country.toLowerCase(), entity_type: 'individual' },
    configuration: {
      merchant: { capabilities: { card_payments: { requested: true } } },
    },
    defaults: {
      currency: currency.toLowerCase(),
      responsibilities: { fees_collector: 'stripe', losses_collector: 'stripe' },
    },
    metadata: { gamevaultRole: 'merchant', gamevaultChargePattern: 'direct' },
  })
}

export async function createOnboardingLink(stripe, { accountId, refreshUrl, returnUrl, type = 'account_onboarding' }) {
  // Embedded onboarding: frontend mounts <stripe-connect-account-onboarding>.
  // For hosted fallback, use accountLinks with refresh/return URLs.
  // v2 accountLinks.create signature: { account, ... } — keep wrapper thin so
  // SDK upgrades only touch this file.
  return stripe.v2.core.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type,
  })
}

export function destinationCheckoutParams({ orderId, userId, lines, customerId, sellerAccountId, platformFeeCents, currency = 'sgd', successUrl, cancelUrl, stripeFeeEstimateCents = 0 }) {
  const totalCents = lines.reduce((a, l) => a + l.unitCents * l.qty, 0)
  const { applicationFeeAmount } = feeForDestination({ totalCents, platformFeeCents, stripeFeeEstimateCents })
  return {
    mode: 'payment',
    customer: customerId,
    client_reference_id: orderId,
    line_items: lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency,
        unit_amount: l.unitCents,
        product_data: { name: `${l.productTitle} — ${l.variantLabel}`.slice(0, 200) },
      },
    })),
    payment_intent_data: {
      application_fee_amount: applicationFeeAmount,
      transfer_data: { destination: sellerAccountId },
    },
    metadata: {
      gamevaultOrderId: orderId, gamevaultUserId: userId, mode: 'payment',
      gamevaultChargePattern: 'destination', gamevaultSeller: sellerAccountId,
    },
    integration_identifier: `gamevault-dest-${randomSuffix()}`,
    success_url: successUrl,
    cancel_url: cancelUrl,
  }
}

export function directCheckoutOptions({ sellerAccountId }) {
  // Direct charges: session is created ON the connected account via header.
  // Call: stripe.checkout.sessions.create(params, { stripeAccount: sellerAccountId })
  return { stripeAccount: sellerAccountId }
}

// Hold-and-release Checkout: platform collects, NO transfer at charge time.
// Transfers happen later via releaseOrderTransfers() after fulfilment.
export function separateCheckoutParams({ orderId, userId, lines, customerId, platformFeeCents, currency = 'sgd', successUrl, cancelUrl }) {
  const totalCents = lines.reduce((a, l) => a + l.unitCents * l.qty, 0)
  if (!(platformFeeCents < totalCents)) throw badRequest('BAD_FEE', 'Platform fee must be less than total.')
  return {
    mode: 'payment',
    customer: customerId,
    client_reference_id: orderId,
    line_items: lines.map((l) => ({
      quantity: l.qty,
      price_data: {
        currency,
        unit_amount: l.unitCents,
        product_data: { name: `${l.productTitle} — ${l.variantLabel}`.slice(0, 200) },
      },
    })),
    // Intentionally NO payment_intent_data.transfer_data and NO application_fee_amount.
    metadata: {
      gamevaultOrderId: orderId, gamevaultUserId: userId, mode: 'payment',
      gamevaultChargePattern: 'separate',
    },
    integration_identifier: `gamevault-sep-${randomSuffix()}`,
    success_url: successUrl,
    cancel_url: cancelUrl,
  }
}

export async function createSeparateTransfers(stripe, { chargeId, splits, currency = 'sgd', orderId }) {
  // Call ONLY after payment_intent.succeeded webhook (latest_charge populated).
  // splits: [{ destination, amount }]
  const out = []
  for (const s of splits) {
    const tr = await stripe.transfers.create({
      amount: s.amount,
      currency,
      destination: s.destination,
      source_transaction: chargeId,
      metadata: { gamevaultOrderId: orderId || '', gamevaultChargePattern: 'separate' },
    })
    out.push(tr)
  }
  return out
}

// Release pending OrderTransfers after order is paid + fulfilled.
// Idempotent: already-released rows are skipped. Returns { released, skipped }.
export async function releaseOrderTransfers({ models, stripe }, orderId) {
  const order = await models.Order.findByPk(orderId)
  if (!order) throw badRequest('ORDER_NOT_FOUND', 'Order not found.')
  if (order.connectPattern !== 'separate') throw badRequest('NOT_HOLD_ORDER', 'Order is not a hold-and-release order.')
  if (order.payStatus !== 'paid') throw badRequest('NOT_PAID', 'Order must be paid before release.')
  if (order.fulfilStatus !== 'fulfilled') throw badRequest('NOT_FULFILLED', 'Release after fulfilment — deliver codes/entitlement first.')
  if (!order.stripePaymentIntentId) throw badRequest('NO_PAYMENT_INTENT', 'Missing payment intent — webhook has not synced yet.')

  const pi = await stripe.paymentIntents.retrieve(order.stripePaymentIntentId)
  const chargeId = typeof pi.latest_charge === 'string' ? pi.latest_charge : pi.latest_charge?.id
  if (!chargeId) throw badRequest('NO_CHARGE', 'Payment has no charge yet — try again shortly.')

  const pendings = await models.OrderTransfer.findAll({ where: { orderId, status: 'pending' } })
  if (!pendings.length) return { released: [], skipped: true }

  const released = []
  for (const row of pendings) {
    const seller = await models.ConnectedAccount.findOne({ where: { stripeAccountId: row.stripeAccountId } })
    if (!seller) {
      await row.update({ status: 'failed', lastError: 'Unknown connected account.' })
      continue
    }
    const live = await stripe.v2.core.accounts.retrieve(row.stripeAccountId)
    if (!isReadyForDestination(live) && seller.chargePattern !== 'direct') {
      await row.update({ status: 'failed', lastError: 'Seller stripe_transfers not active.' })
      continue
    }
    try {
      const tr = await stripe.transfers.create({
        amount: row.amountCents,
        currency: (row.currency || 'SGD').toLowerCase(),
        destination: row.stripeAccountId,
        source_transaction: chargeId,
        metadata: { gamevaultOrderId: orderId, gamevaultChargePattern: 'separate' },
      })
      await row.update({ status: 'released', stripeTransferId: tr.id, lastError: null })
      released.push({ transferRowId: row.id, stripeTransferId: tr.id })
    } catch (err) {
      await row.update({ status: 'failed', lastError: String(err?.message || err).slice(0, 500) })
    }
  }
  const remaining = await models.OrderTransfer.count({ where: { orderId, status: 'pending' } })
  if (remaining === 0) await order.update({ connectTransferStatus: 'released' })
  else await order.update({ connectTransferStatus: 'pending' })
  return { released, chargeId }
}

export async function reverseOrderTransfers({ models, stripe }, orderId) {
  const released = await models.OrderTransfer.findAll({ where: { orderId, status: 'released' } })
  const out = []
  for (const row of released) {
    if (!row.stripeTransferId) continue
    try {
      await stripe.transfers.createReversal(row.stripeTransferId, { metadata: { gamevaultOrderId: orderId } })
      await row.update({ status: 'reversed' })
      out.push(row.stripeTransferId)
    } catch (err) {
      await row.update({ lastError: String(err?.message || err).slice(0, 500) })
    }
  }
  if (out.length) {
    const order = await models.Order.findByPk(orderId)
    if (order) await order.update({ connectTransferStatus: 'reversed' })
  }
  return { reversed: out }
}

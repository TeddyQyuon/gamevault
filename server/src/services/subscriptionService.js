// Subscription state is a mirror of Stripe, updated ONLY by verified webhooks.
// Paid access follows PAID INVOICE PERIODS: invoice.paid extends
// currentPeriodEnd; there is intentionally NO extra grace period — if you need
// one, add it here and document it, don't invent it silently.

const KNOWN = new Set(['active', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled'])

function toDate(unix) {
  return unix ? new Date(unix * 1000) : null
}

function planNameFrom(item) {
  return item?.variantLabel || item?.productTitle || 'GameVault plan'
}

// Upsert from an authoritative Stripe subscription object (retrieved by id,
// never trusted from metadata alone). Pass the webhook transaction so the
// upsert commits atomically with the event ledger. Returns the row.
export async function syncSubscriptionFromStripe(models, stripeSub, fallback = {}, t) {
  const tx = t ? { transaction: t } : {}
  const status = KNOWN.has(stripeSub.status) ? stripeSub.status : 'incomplete'
  const item = stripeSub.items?.data?.[0]
  const values = {
    userId: fallback.userId,
    planName: fallback.planName || 'GameVault plan',
    variantId: fallback.variantId || 'unknown',
    stripeCustomerId: typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id,
    stripePriceId: item?.price?.id || null,
    interval: item?.price?.recurring?.interval === 'year' ? 'year' : 'month',
    status,
    currentPeriodStart: toDate(stripeSub.current_period_start) || toDate(item?.current_period_start),
    currentPeriodEnd: toDate(stripeSub.current_period_end) || toDate(item?.current_period_end),
    cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
  }
  const existing = await models.Subscription.findOne({ where: { stripeSubscriptionId: stripeSub.id }, ...tx })
  if (existing) {
    // Never resurrect a canceled row from a stale event: only move forward
    // using the live object (callers pass freshly retrieved objects).
    await existing.update(values, tx)
    return existing
  }
  return models.Subscription.create({ stripeSubscriptionId: stripeSub.id, ...values }, tx)
}

export async function handleInvoicePaid(models, stripe, invoice, t) {
  const tx = t ? { transaction: t } : {}
  const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
  if (!subId) return { ignored: true, reason: 'no-subscription' }
  // Authoritative read: the invoice alone doesn't carry the full period state.
  const stripeSub = await stripe.subscriptions.retrieve(subId)
  const existing = await models.Subscription.findOne({ where: { stripeSubscriptionId: subId }, ...tx })
  if (!existing) {
    // Checkout completed but our row is missing (out-of-order delivery):
    // rebuild it from Stripe rather than dropping the payment. Owner is
    // resolved via OUR users table (never from browser input).
    const customerId = typeof stripeSub.customer === 'string' ? stripeSub.customer : stripeSub.customer?.id
    const owner = customerId
      ? await models.User.findOne({ where: { stripeCustomerId: customerId }, ...tx })
      : null
    await syncSubscriptionFromStripe(models, stripeSub, {
      userId: owner ? owner.id : null,
      planName: planNameFrom(null),
    }, t)
    return { recovered: true }
  }
  await existing.update({
    status: KNOWN.has(stripeSub.status) ? stripeSub.status : existing.status,
    currentPeriodStart: toDate(stripeSub.current_period_start) || existing.currentPeriodStart,
    currentPeriodEnd: toDate(stripeSub.current_period_end) || existing.currentPeriodEnd,
    cancelAtPeriodEnd: Boolean(stripeSub.cancel_at_period_end),
    lastInvoiceId: invoice.id,
  }, tx)
  return { updated: true }
}

export async function handleInvoiceFailed(models, invoice, t) {
  const tx = t ? { transaction: t } : {}
  const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id
  if (!subId) return { ignored: true, reason: 'no-subscription' }
  const existing = await models.Subscription.findOne({ where: { stripeSubscriptionId: subId }, ...tx })
  if (!existing) return { ignored: true, reason: 'unknown-subscription' }
  // past_due keeps access until Stripe cancels (per dashboard retry settings).
  await existing.update({ status: 'past_due', lastInvoiceId: invoice.id }, tx)
  return { updated: true }
}

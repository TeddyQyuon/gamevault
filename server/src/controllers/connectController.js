import { ah, badRequest } from '../errors.js'
import { stripeLiveMode } from '../config.js'
import { getStripe } from '../services/stripeClient.js'
import {
  createMarketplaceAccount,
  createSaaSAccount,
  createOnboardingLink,
  isReadyForDestination,
  isReadyForDirect,
  destinationCheckoutParams,
  directCheckoutOptions,
  releaseOrderTransfers,
  reverseOrderTransfers,
} from '../services/connectService.js'
import { createSeparateHoldCheckout } from '../services/holdCheckoutService.js'

// Seller onboarding + Connect checkout examples.
// All money routes sit behind [login + sameOrigin + rate-limit] in app.js.
// Admin-only for account creation in this milestone (sellers are onboarded by staff).

function requireAdmin(user) {
  if (user?.role !== 'admin') throw badRequest('FORBIDDEN', 'Seller onboarding is admin-only in this milestone.')
}

function requireTestModeConnectCheckout(cfg) {
  if (stripeLiveMode(cfg)) {
    throw badRequest('CONNECT_LIVE_CHECKOUT_DISABLED', 'Marketplace Connect checkout is still a test-mode example and cannot take live payments.')
  }
}

export function connectController(deps) {
  const { models, cfg, sequelize } = deps
  return {
    // POST /api/connect/accounts — { type: 'marketplace'|'saas', email, displayName, sellerUserId? }
    createAccount: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const me = await models.User.findByPk(req.userId)
      requireAdmin(me)
      const { type = 'marketplace', email, displayName, sellerUserId, country, currency } = req.body || {}
      if (!email || !displayName) throw badRequest('BAD_ACCOUNT', 'email and displayName are required.')
      const acct = type === 'saas'
        ? await createSaaSAccount(stripe, { email, displayName, country, currency })
        : await createMarketplaceAccount(stripe, { email, displayName, country, currency })
      await models.ConnectedAccount.create({
        sellerUserId: sellerUserId || null,
        stripeAccountId: acct.id,
        dashboard: type === 'saas' ? 'full' : 'express',
        feesCollector: type === 'saas' ? 'stripe' : 'application',
        lossesCollector: type === 'saas' ? 'stripe' : 'application',
        chargePattern: type === 'saas' ? 'direct' : 'destination',
        status: 'onboarding',
      })
      res.status(201).json({ accountId: acct.id, type })
    }),

    // GET /api/connect/accounts/:id/status — capability gate before charging
    accountStatus: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const row = await models.ConnectedAccount.findOne({ where: { stripeAccountId: req.params.id } })
      if (!row) throw badRequest('UNKNOWN_ACCOUNT', 'No such connected account.')
      const acct = await stripe.v2.core.accounts.retrieve(req.params.id)
      const ready = row.chargePattern === 'direct' ? isReadyForDirect(acct) : isReadyForDestination(acct)
      if (ready && row.status !== 'active') await row.update({ status: 'active' })
      res.json({
        accountId: acct.id,
        chargePattern: row.chargePattern,
        ready,
        dashboard: row.dashboard,
      })
    }),

    // POST /api/connect/accounts/:id/onboarding-link — { refreshUrl, returnUrl }
    onboardingLink: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const me = await models.User.findByPk(req.userId)
      requireAdmin(me)
      const { refreshUrl, returnUrl } = req.body || {}
      if (!refreshUrl || !returnUrl) throw badRequest('BAD_URLS', 'refreshUrl and returnUrl are required.')
      // Always embed notification_banner alongside account_onboarding in frontend.
      const link = await createOnboardingLink(stripe, {
        accountId: req.params.id, refreshUrl, returnUrl,
      })
      res.json({ url: link.url })
    }),

    // POST /api/connect/checkout/destination — marketplace example (platform MoR)
    // Body: { sellerAccountId, lines: [{productTitle, variantLabel, unitCents, qty}], platformFeeCents, orderId }
    destinationCheckout: ah(async (req, res) => {
      requireTestModeConnectCheckout(cfg)
      const stripe = getStripe(cfg)
      const me = await models.User.findByPk(req.userId)
      const { sellerAccountId, lines, platformFeeCents, orderId } = req.body || {}
      if (!sellerAccountId || !Array.isArray(lines) || !lines.length) {
        throw badRequest('BAD_CHECKOUT', 'sellerAccountId and lines[] are required.')
      }
      const row = await models.ConnectedAccount.findOne({ where: { stripeAccountId: sellerAccountId } })
      if (!row || row.chargePattern !== 'destination') throw badRequest('BAD_SELLER', 'Seller is not a destination-charges account.')
      const live = await stripe.v2.core.accounts.retrieve(sellerAccountId)
      if (!isReadyForDestination(live)) throw badRequest('SELLER_NOT_READY', 'Seller capabilities are not active yet (stripe_transfers). Complete onboarding first.')
      if (!me.stripeCustomerId) throw badRequest('NO_STRIPE_CUSTOMER', 'Complete a test checkout first to create your customer record.')
      const params = destinationCheckoutParams({
        orderId: orderId || `GV-CONNECT-${Date.now()}`,
        userId: me.id,
        lines,
        customerId: me.stripeCustomerId,
        sellerAccountId,
        platformFeeCents: platformFeeCents ?? 150,
        currency: 'sgd',
        successUrl: `${cfg.clientUrl}/orders/${orderId || ''}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${cfg.clientUrl}/checkout/cancel?order_id=${orderId || ''}`,
      })
      const session = await stripe.checkout.sessions.create(params)
      res.status(201).json({ url: session.url, accountId: sellerAccountId, pattern: 'destination' })
    }),

    // POST /api/connect/checkout/direct-preview — returns header needed for direct (no charge made)
    directPreview: ah(async (req, res) => {
      const { sellerAccountId } = req.body || {}
      if (!sellerAccountId) throw badRequest('BAD_SELLER', 'sellerAccountId is required.')
      const row = await models.ConnectedAccount.findOne({ where: { stripeAccountId: sellerAccountId } })
      if (!row || row.chargePattern !== 'direct') throw badRequest('BAD_SELLER', 'Seller is not a direct-charges account.')
      // Frontend creates PaymentElement with platform key + this stripeAccount;
      // backend creates PI/Session with: stripe.checkout.sessions.create(params, directCheckoutOptions({sellerAccountId}))
      res.json({ options: directCheckoutOptions({ sellerAccountId }), pattern: 'direct' })
    }),

    // POST /api/connect/checkout/separate — hold-and-release (platform collects, manual release)
    // Body: { contact, items, sellerAccountId | splits[{stripeAccountId, amountCents?}], percentBps=1000, stripeFeeEstimateCents=0 }
    separateCheckout: ah(async (req, res) => {
      requireTestModeConnectCheckout(cfg)
      const stripe = getStripe(cfg)
      const user = await models.User.findByPk(req.userId)
      const result = await createSeparateHoldCheckout(
        { user, body: req.body },
        { models, sequelize, stripe, cfg },
      )
      res.status(201).json(result)
    }),

    // POST /api/connect/orders/:id/release — admin releases after paid + fulfilled
    releaseOrder: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const me = await models.User.findByPk(req.userId)
      requireAdmin(me)
      const out = await releaseOrderTransfers({ models, stripe }, req.params.id)
      res.json({ orderId: req.params.id, ...out })
    }),

    // POST /api/connect/orders/:id/reverse — admin claws back on refund/dispute
    reverseOrder: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const me = await models.User.findByPk(req.userId)
      requireAdmin(me)
      const out = await reverseOrderTransfers({ models, stripe }, req.params.id)
      res.json({ orderId: req.params.id, ...out })
    }),

    // GET /api/connect/orders/:id/transfers — buyer/admin view of hold status
    orderTransfers: ah(async (req, res) => {
      const order = await models.Order.findOne({ where: { id: req.params.id, userId: req.userId } })
      const admin = await models.User.findByPk(req.userId)
      const ord = order || (admin?.role === 'admin' ? await models.Order.findByPk(req.params.id) : null)
      if (!ord) throw badRequest('ORDER_NOT_FOUND', 'Order not found.')
      if (!ord.connectPattern) throw badRequest('NOT_HOLD_ORDER', 'Order is not a hold-and-release order.')
      const rows = await models.OrderTransfer.findAll({ where: { orderId: ord.id } })
      res.json({
        orderId: ord.id, payStatus: ord.payStatus, fulfilStatus: ord.fulfilStatus,
        connectPattern: ord.connectPattern, connectTransferStatus: ord.connectTransferStatus,
        platformFeeCents: ord.platformFeeCents, totalCents: ord.totalCents,
        transfers: rows.map((r) => ({
          stripeAccountId: r.stripeAccountId, amountCents: r.amountCents,
          status: r.status, stripeTransferId: r.stripeTransferId,
        })),
      })
    }),
  }
}

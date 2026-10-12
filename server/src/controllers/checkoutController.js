import { ah, notFound, badRequest } from '../errors.js'
import { getStripe } from '../services/stripeClient.js'
import { createOneTimeCheckout, createSubscriptionCheckout, getGuestOrder, getOrderForUser, dbLoaders } from '../services/checkoutService.js'
import { priceOneTimeCart } from '../services/pricing.js'
import { codesForItem } from '../services/fulfilment.js'


export function checkoutController(deps) {
  const { models, sequelize, cfg } = deps
  return {
    // POST /api/checkout/sessions — one-time cart → Stripe Checkout.
    // Guest-friendly: req.userId is null when logged out (optionalAuth).
    createSession: ah(async (req, res) => {
      const stripe = getStripe(cfg) // 503 when test keys are missing
      const user = req.userId ? await models.User.findByPk(req.userId) : null
      const result = await createOneTimeCheckout(
        { user, body: req.body },
        { models, sequelize, stripe, cfg },
      )
      res.status(result.reused ? 200 : 201).json(result)
    }),

    // POST /api/checkout/subscriptions — exactly ONE recurring plan (guest OK).
    createSubscription: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const user = req.userId ? await models.User.findByPk(req.userId) : null
      const result = await createSubscriptionCheckout(
        { user, body: req.body },
        { models, sequelize, stripe, cfg },
      )
      res.status(result.reused ? 200 : 201).json(result)
    }),

    // POST /api/promos/validate — instant promo feedback (no order created)
    validatePromo: ah(async (req, res) => {
      const priced = await priceOneTimeCart(
        { items: req.body?.items, promoCode: req.body?.promoCode }, dbLoaders(models),
      ).catch((err) => {
        if (err?.code === 'UNKNOWN_PROMO' || err?.code === 'PROMO_MINIMUM') return { promoError: err.message }
        throw err
      })
      if (priced.promoError) return res.json({ ok: false, message: priced.promoError })
      res.json({
        ok: true, discountCents: priced.discountCents, subtotalCents: priced.subtotalCents,
        totalCents: priced.totalCents, message: `${priced.promoCode} applied — S$${(priced.discountCents / 100).toFixed(2)} off.`,
      })
    }),

    // GET /api/orders — own orders, newest first (codes only when fulfilled)
    listOrders: ah(async (req, res) => {
      const orders = await models.Order.findAll({
        where: { userId: req.userId }, order: [['createdAt', 'DESC']], limit: 50,
      })
      const out = []
      for (const o of orders) out.push(await getOrderForUser(models, req.userId, o.id))
      res.json({ orders: out })
    }),

    // GET /api/orders/:id — ownership enforced (never trust browser ids alone).
    // Logged-in: owner scoping via session. Guest (no session): the Stripe
    // session id from the success redirect (?session_id=cs_...) is the access
    // token and must match the order's stored stripeSessionId.
    getOrder: ah(async (req, res) => {
      const sessionId = req.query?.session_id || req.query?.sessionId || ''
      if (req.userId) {
        const order = await getOrderForUser(models, req.userId, req.params.id)
        if (order) return res.json({ order })
        // Fall through: a logged-in buyer may still open a guest order they
        // just paid for (same browser, now logged in) via the session token.
        if (sessionId) {
          const guest = await getGuestOrder(models, req.params.id, sessionId)
          if (guest) return res.json({ order: guest })
        }
        throw notFound('ORDER_NOT_FOUND', 'Order not found.')
      }
      const guest = await getGuestOrder(models, req.params.id, sessionId)
      if (!guest) throw notFound('ORDER_NOT_FOUND', 'Order not found.')
      res.json({ order: guest })
    }),

    // GET /api/subscriptions/me — own Stripe-synced subscriptions
    listSubscriptions: ah(async (req, res) => {
      const subs = await models.Subscription.findAll({
        where: { userId: req.userId }, order: [['createdAt', 'DESC']],
      })
      res.json({
        subscriptions: subs.map((s) => ({
          id: s.id, planName: s.planName, variantId: s.variantId, interval: s.interval,
          status: s.status, currentPeriodStart: s.currentPeriodStart,
          currentPeriodEnd: s.currentPeriodEnd, cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        })),
      })
    }),

    // POST /api/billing/portal — Stripe-hosted management for OUR customer id
    createPortal: ah(async (req, res) => {
      const stripe = getStripe(cfg)
      const user = await models.User.findByPk(req.userId)
      if (!user.stripeCustomerId) {
        throw badRequest('NO_STRIPE_CUSTOMER', 'No billing account yet — complete a test checkout first.')
      }
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${cfg.clientUrl}/account/subscriptions?portal=return`,
      })
      res.json({ url: session.url })
    }),

    // POST /api/orders/:orderId/items/:itemId/reveal/:allocationId — G2A statutory waiver key reveal
    revealKey: ah(async (req, res) => {
      const { orderId, itemId, allocationId } = req.params
      const sessionId = req.query?.session_id || req.query?.sessionId || req.body?.sessionId || ''

      const order = await models.Order.findOne({
        where: { id: orderId },
        include: [{ model: models.OrderItem, include: [models.CodeAllocation] }],
      })
      if (!order) throw notFound('ORDER_NOT_FOUND', 'Order not found.')

      if (order.userId) {
        if (!req.userId || req.userId !== order.userId) {
          if (!sessionId || order.stripeSessionId !== sessionId) {
            throw notFound('ORDER_NOT_FOUND', 'Order not found.')
          }
        }
      } else {
        if (!sessionId || order.stripeSessionId !== sessionId) {
          throw notFound('ORDER_NOT_FOUND', 'Order not found.')
        }
      }

      if (order.payStatus !== 'paid') {
        throw badRequest('ORDER_NOT_PAID', 'Order payment is not confirmed yet.')
      }

      let targetAllocation = null
      let targetItem = null
      for (const item of (order.OrderItems || [])) {
        if (itemId && String(item.id) !== String(itemId)) continue
        for (const alloc of (item.CodeAllocations || [])) {
          if (String(alloc.id) === String(allocationId)) {
            targetAllocation = alloc
            targetItem = item
            break
          }
        }
        if (targetAllocation) break
      }

      if (!targetAllocation) {
        throw notFound('ALLOCATION_NOT_FOUND', 'Code allocation not found.')
      }

      const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''
      const userAgent = req.headers['user-agent'] || ''
      if (!targetAllocation.isRevealed) {
        await targetAllocation.update({
          isRevealed: true,
          revealedAt: new Date(),
          revealIp: String(ip).slice(0, 45),
          revealUserAgent: String(userAgent).slice(0, 255),
        })
      }

      const code = await codesForItem(models, targetAllocation)
      res.json({
        ok: true,
        allocationId: targetAllocation.id,
        orderItemId: targetItem?.id,
        code,
        isRevealed: true,
        revealedAt: targetAllocation.revealedAt,
      })
    }),
  }
}

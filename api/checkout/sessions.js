import { randomUUID } from 'node:crypto'
import Stripe from 'stripe'
import { priceCheckout, checkoutOrigin } from '../../serverless/checkoutPolicy.js'
import { applyPromo, DEMO_PROMO } from '../../src/services/promoPolicy.js'

export function createCheckoutHandler({ createStripe = key => new Stripe(key), environment = process.env } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } })
    }
    if (!environment.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: { code: 'PAYMENTS_UNAVAILABLE', message: 'Secure payments are temporarily unavailable.' } })
    }
    let origin
    try { origin = checkoutOrigin(environment) } catch {
      return res.status(503).json({ error: { code: 'PAYMENTS_UNAVAILABLE', message: 'Secure payments are temporarily unavailable.' } })
    }
    const { items, promoCode = '', contact = {} } = req.body || {}
    const first = typeof contact?.firstName === 'string' ? contact.firstName.trim() : ''
    const last = typeof contact?.lastName === 'string' ? contact.lastName.trim() : ''
    const email = typeof contact?.email === 'string' ? contact.email.trim() : ''
    const country = typeof contact?.country === 'string' ? contact.country.trim() : 'Singapore'
    if (!first || !last || first.length > 120 || last.length > 120 || email.length > 254
        || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || country.length > 80) {
      return res.status(400).json({ error: { code: 'BAD_CONTACT', message: 'Provide a valid name and email.' } })
    }
    let pricedLines
    try { pricedLines = priceCheckout(items) } catch (error) {
      return res.status(400).json({ error: { code: 'BAD_CART', message: error.message } })
    }
    const subtotal = pricedLines.reduce((total, line) => total + line.unitAmount * line.qty, 0)
    const hasPromo = typeof promoCode === 'string' && Boolean(promoCode.trim())
    const promo = applyPromo(subtotal, promoCode)
    if ((promoCode && typeof promoCode !== 'string') || (hasPromo && !promo.ok)) {
      return res.status(400).json({ error: { code: 'PROMO_INELIGIBLE', message: promo.message } })
    }
    const orderId = 'GV-' + randomUUID().replaceAll('-', '').toUpperCase()
    try {
      const stripe = createStripe(environment.STRIPE_SECRET_KEY)
      const discounts = []
      if (hasPromo) {
        const coupon = await stripe.coupons.create({
          amount_off: promo.discountCents,
          currency: 'sgd',
          duration: 'once',
          name: `${DEMO_PROMO.code} — S$10 off`,
        }, { idempotencyKey: `coupon-gamer10-${orderId}` })
        discounts.push({ coupon: coupon.id })
      }
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: email,
        line_items: pricedLines.map(line => ({
          price_data: {
            currency: 'sgd',
            unit_amount: line.unitAmount,
            product_data: { name: line.name, metadata: { variantId: line.variantId } },
          },
          quantity: line.qty,
        })),
        discounts: discounts.length ? discounts : undefined,
        client_reference_id: orderId,
        metadata: { orderId, customerName: `${first} ${last}`, customerEmail: email,
          customerCountry: country, source: 'GameVault Storefront' },
        success_url: `${origin}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel?order_id=${orderId}`,
      })
      return res.status(200).json({ url: session.url, orderId })
    } catch {
      // Never return provider diagnostics, credentials, or claim a discount was
      // applied when coupon creation failed.
      return res.status(503).json({ error: { code: 'CHECKOUT_UNAVAILABLE', message: 'Secure payment could not open. Please try again.' } })
    }
  }
}

export default createCheckoutHandler()

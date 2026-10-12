import Stripe from 'stripe'
import { findVariant } from '../../src/data/products.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: { message: 'Method not allowed' } })

  const STRIPE_KEY = process.env.STRIPE_SECRET_KEY
  if (!STRIPE_KEY) {
    return res.status(503).json({ error: { code: 'CONFIG_ERROR', message: 'Stripe secret key not configured in environment variables.' } })
  }
  const stripe = new Stripe(STRIPE_KEY)

  try {
    const { items = [], promoCode = '', contact = {} } = req.body || {}
    const first = (contact.firstName || '').trim()
    const last = (contact.lastName || '').trim()
    const email = (contact.email || '').trim()
    const country = (contact.country || 'Singapore').trim()

    if (!email || !first || !last) {
      return res.status(400).json({ error: { code: 'BAD_CONTACT', message: 'Name and email are required.' } })
    }

    const pricedLines = []
    for (const item of items) {
      const found = findVariant(item.variantId)
      if (found) {
        pricedLines.push({
          name: `${found.product.title} — ${found.variant.label}`,
          unitAmount: found.variant.priceCents,
          qty: Math.max(1, Math.min(Number(item.qty) || 1, 10)),
          variantId: found.variant.id,
        })
      }
    }

    if (pricedLines.length === 0) {
      return res.status(400).json({ error: { code: 'EMPTY_CART', message: 'No valid items in cart.' } })
    }

    const orderId = 'GV-' + Math.random().toString(36).substring(2, 8).toUpperCase()
    const origin = req.headers.origin || (req.headers.host ? `https://${req.headers.host}` : 'https://gamevault-alpha-ten.vercel.app')

    const discounts = []
    if (String(promoCode).trim().toUpperCase() === 'GAMER10') {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: 1000,
          currency: 'sgd',
          duration: 'once',
          name: 'GAMER10 — S$10 off',
        }, { idempotencyKey: `coupon-gamer10-${orderId}` })
        discounts.push({ coupon: coupon.id })
      } catch (couponErr) {
        console.warn('Coupon create skipped:', couponErr.message)
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: pricedLines.map((line) => ({
        price_data: {
          currency: 'sgd',
          unit_amount: line.unitAmount,
          product_data: {
            name: line.name,
            metadata: { variantId: line.variantId },
          },
        },
        quantity: line.qty,
      })),
      discounts: discounts.length > 0 ? discounts : undefined,
      client_reference_id: orderId,
      metadata: {
        orderId,
        customerName: `${first} ${last}`,
        customerEmail: email,
        customerCountry: country,
        source: 'GameVault Storefront',
      },
      success_url: `${origin}/orders/${orderId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel?order_id=${orderId}`,
    })

    return res.status(200).json({ url: session.url, orderId })
  } catch (err) {
    console.error('Checkout creation error:', err)
    return res.status(500).json({ error: { code: 'CHECKOUT_FAILED', message: err.message || 'Payment creation failed.' } })
  }
}

import { priceCheckout } from '../../serverless/checkoutPolicy.js'
import { applyPromo, DEMO_PROMO } from '../../src/services/promoPolicy.js'

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } })
  }
  try {
    const lines = priceCheckout(req.body?.items)
    const subtotal = lines.reduce((sum, line) => sum + line.unitAmount * line.qty, 0)
    const promo = applyPromo(subtotal, req.body?.promoCode)
    return res.status(200).json({ ...promo, ...(promo.ok ? { promoCode: DEMO_PROMO.code } : {}) })
  } catch (error) {
    return res.status(400).json({ error: { code: 'BAD_CART', message: error.message } })
  }
}

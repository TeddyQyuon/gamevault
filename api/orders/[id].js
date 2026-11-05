import Stripe from 'stripe'

export function createOrderHandler({ createStripe = key => new Stripe(key), environment = process.env } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    if (req.method !== 'GET') {
      res.setHeader('Allow', 'GET')
      return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed.' } })
    }
    const { id, session_id: snakeSession, sessionId: camelSession } = req.query || {}
    const sessionId = snakeSession || camelSession
    const notFound = () => res.status(404).json({ error: { code: 'ORDER_NOT_FOUND', message: 'Order not found for this private checkout link.' } })
    if (typeof id !== 'string' || !/^GV-[A-Z0-9-]{6,64}$/.test(id)
        || typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{8,256}$/.test(sessionId)) return notFound()
    if (!environment.STRIPE_SECRET_KEY) {
      return res.status(503).json({ error: { code: 'VERIFICATION_UNAVAILABLE', message: 'Payment verification is temporarily unavailable.' } })
    }
    try {
      const stripe = createStripe(environment.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      if (!session || session.id !== sessionId || session.client_reference_id !== id || session.metadata?.orderId !== id
          || session.mode !== 'payment' || !Number.isSafeInteger(session.amount_total) || session.amount_total < 0
          || session.currency !== 'sgd') return notFound()
      const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ['data.price.product'] })
      if (!Array.isArray(lineItems?.data) || !lineItems.data.length || lineItems.has_more) return notFound()
      const paid = session.payment_status === 'paid' && session.status === 'complete'
      const payStatus = paid ? 'paid' : session.status === 'expired' ? 'expired' : 'pending'
      const items = lineItems.data.map(line => ({
        id: line.id,
        variantId: line.price?.product?.metadata?.variantId || undefined,
        productTitle: line.description || line.price?.product?.name || 'Digital purchase',
        variantLabel: '',
        qty: line.quantity,
        fulfilment: 'manual',
        deliveryWindowMinutes: 60,
      }))
      return res.status(200).json({ order: {
        id, payStatus, fulfilStatus: 'pending', totalCents: session.amount_total,
        currency: session.currency.toUpperCase(),
        contact: { email: session.customer_details?.email || session.customer_email || '',
          name: session.customer_details?.name || session.metadata.customerName || '' },
        guest: true,
        // Stripe retrieval verifies payment, but does not provide an authoritative
        // paid timestamp or delivery status. Do not invent either value.
        paidAt: null,
        items,
      } })
    } catch (error) {
      if (error?.code === 'resource_missing') return notFound()
      return res.status(503).json({ error: { code: 'VERIFICATION_UNAVAILABLE', message: 'Payment verification is temporarily unavailable. Please retry before paying again.' } })
    }
  }
}

export default createOrderHandler()

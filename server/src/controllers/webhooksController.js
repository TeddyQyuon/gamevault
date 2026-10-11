import { verifySignature, processEvent } from '../services/webhookService.js'
import { stripeLiveMode } from '../config.js'

// Stripe-signed route (NO login cookie, NO JSON body parser — raw body only).
export function webhooksController(deps) {
  const { models, sequelize, stripe, cfg } = deps
  return async (req, res) => {
    const signature = req.get('stripe-signature')
    if (!signature) return res.status(400).json({ error: { code: 'NO_SIGNATURE', message: 'Missing Stripe signature.' } })
    let event
    try {
      event = verifySignature(stripe, req.body, signature, cfg.stripeWebhookSecret)
    } catch {
      // 400 (not 500): a bad signature will never succeed on retry.
      return res.status(400).json({ error: { code: 'BAD_SIGNATURE', message: 'Invalid webhook signature.' } })
    }
    // Minimal log: type + id only. Never payloads or secrets.
    console.log(`stripe event ${event.type} ${event.id}`)
    try {
      const outcome = await processEvent(models, sequelize, stripe, event, { live: stripeLiveMode(cfg) })
      return res.json({ received: true, ...('duplicate' in outcome ? { duplicate: true } : {}) })
    } catch (err) {
      console.error(`stripe event failed ${event.type} ${event.id}:`, err?.message || err)
      // 500 so Stripe retries transient failures.
      return res.status(500).json({ error: { code: 'PROCESSING_FAILED', message: 'Temporary error. Stripe will retry.' } })
    }
  }
}

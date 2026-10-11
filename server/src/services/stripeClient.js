import Stripe from 'stripe'
import { serviceUnavailable } from '../errors.js'
import { stripeConfigured, stripeLiveMode, stripeTestMode } from '../config.js'

// One Stripe client per process. Test keys (sk_test_) and live keys
// (sk_live_) are both accepted; anything else is refused. LIVE SAFETY: a live
// key alone never enables demo selling — checkout + fulfilment refuse
// demo_test products while in live mode (see guards there).
let client = null
let clientKeyPrefix = null

export function stripeMode(cfg) {
  if (stripeLiveMode(cfg)) return 'live'
  if (stripeTestMode(cfg)) return 'test'
  return null
}

export function getStripe(cfg) {
  if (!stripeConfigured(cfg)) {
    throw serviceUnavailable('Stripe keys are not configured. See server/.env.example.')
  }
  const mode = stripeMode(cfg)
  if (!mode) {
    throw serviceUnavailable('Unsupported Stripe key. Use a test (sk_test_) or live (sk_live_) secret key.')
  }
  // Never reuse a client across modes (e.g. test key swapped for live at runtime).
  const prefix = cfg.stripeSecretKey.slice(0, 7)
  if (!client || clientKeyPrefix !== prefix) {
    client = new Stripe(cfg.stripeSecretKey)
    clientKeyPrefix = prefix
  }
  return client
}

// Test helper: build a client without the mode guard.
export function buildStripeClient(secretKey) {
  return new Stripe(secretKey)
}

export function resetStripeClient() {
  client = null
  clientKeyPrefix = null
}

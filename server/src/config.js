// Central environment + configuration.
// Stripe SDK: stripe@22.6.1 (pinned Stripe API version 2026-08-26.dahlia).
// Secrets are NEVER logged, NEVER sent to the browser, NEVER stored in localStorage.

import 'dotenv/config'

function required(name, fallback = undefined) {
  const value = process.env[name] ?? fallback
  if (value === undefined || value === '') {
    throw new Error(`Missing required env var ${name}. Copy server/.env.example to server/.env and fill it in.`)
  }
  return value
}

export function loadConfig() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: Number(process.env.PORT || 3001),
    clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, ''),
    db: {
      host: process.env.DATABASE_HOST || '127.0.0.1',
      port: Number(process.env.DATABASE_PORT || 3306),
      name: process.env.DATABASE_NAME || 'gamevault',
      user: process.env.DATABASE_USER || 'root',
      password: process.env.DATABASE_PASSWORD ?? '',
    },
    sessionSecret: process.env.SESSION_SECRET || '',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    cookieSecure: process.env.COOKIE_SECURE === 'true',
  }
}

// Validated at server boot (not import time, so unit tests can import helpers).
export function loadConfigStrict() {
  const cfg = loadConfig()
  required('SESSION_SECRET')
  return cfg
}

export function stripeConfigured(cfg) {
  return Boolean(cfg.stripeSecretKey && cfg.stripeSecretKey.startsWith('sk_'))
}

export function stripeTestMode(cfg) {
  return cfg.stripeSecretKey.startsWith('sk_test_')
}

// Live mode: real secret key (sk_live_). Live charges are only safe when
// fulfilment is real — the demo-code paths refuse to back live orders
// (see checkoutService + fulfilment.js guards).
export function stripeLiveMode(cfg) {
  return cfg.stripeSecretKey.startsWith('sk_live_')
}

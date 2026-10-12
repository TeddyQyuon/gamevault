import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import { optionalAuth, requireAuth } from './middleware/auth.js'
import { sameOrigin, authLimiter, checkoutLimiter, supportLimiter } from './middleware/guards.js'
import { authController } from './controllers/authController.js'
import { productsController } from './controllers/productsController.js'
import { checkoutController } from './controllers/checkoutController.js'
import { adminController } from './controllers/adminController.js'
import { manualOrdersController } from './controllers/manualOrdersController.js'
import { supportController } from './controllers/supportController.js'
import { connectController } from './controllers/connectController.js'
import { webhooksController } from './controllers/webhooksController.js'
import { stripeConfigured } from './config.js'
import { stripeMode } from './services/stripeClient.js'
import { ah } from './errors.js'

// App factory (deps injected) so tests can boot the API without MySQL/Stripe.
export function createApp({ cfg, models, sequelize, stripe }) {
  const app = express()
  app.disable('x-powered-by')

  // Security headers (defensive baseline against clickjacking, MIME sniffing, data leakage)
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.setHeader('X-XSS-Protection', '1; mode=block')
    if (cfg.cookieSecure) {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    }
    next()
  })

  app.use(cookieParser())
  app.use(cors({ origin: cfg.clientUrl, credentials: true }))

  // ---- Stripe webhook FIRST: raw body, before express.json() ----
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    webhooksController({ models, sequelize, stripe, cfg }),
  )

  app.use(express.json({ limit: '100kb' }))

  app.get('/api/health', (_req, res) => {
    // Public mode flag so the storefront can swap test/live payment copy.
    // Values: 'test-mode' | 'live' | 'unconfigured'. Never leaks secrets.
    res.json({
      ok: true,
      stripe: stripeConfigured(cfg) ? (stripeMode(cfg) === 'live' ? 'live' : 'test-mode') : 'unconfigured',
      checkoutReady: stripeConfigured(cfg) && Boolean(cfg.stripeWebhookSecret?.startsWith('whsec_')),
    })
  })

  const auth = authController({ models, cfg })
  const products = productsController({ models, sequelize })
  const shop = checkoutController({ models, sequelize, cfg })
  const admin = adminController({ models, sequelize })
  const manual = manualOrdersController({ models, sequelize, cfg })
  const support = supportController({ models, sequelize })
  const connect = connectController({ models, sequelize, cfg })
  // NOTE: Express 4 does not catch async middleware throws — wrap with ah so
  // auth rejections become JSON errors instead of unhandled rejections.
  const guard = ah(requireAuth(models))
  const maybeGuest = ah(optionalAuth(models))

  // Public catalogue
  app.get('/api/products', products.list)
  app.get('/api/products/:slug', products.getBySlug)
  app.post('/api/support/requests', sameOrigin(cfg), supportLimiter, support.create)

  // Auth (rate-limited)
  app.post('/api/auth/register', authLimiter, auth.register)
  app.post('/api/auth/login', authLimiter, auth.login)
  app.post('/api/auth/logout', auth.logout)
  app.get('/api/me', guard, auth.me)

  // Customer APIs (login + same-origin + rate limits on money routes)
  const customer = [guard, sameOrigin(cfg)]
  app.patch('/api/me', ...customer, auth.updateMe)
  app.get('/api/orders', ...customer, shop.listOrders)
  app.get('/api/subscriptions/me', ...customer, shop.listSubscriptions)
  app.post('/api/billing/portal', ...customer, checkoutLimiter, shop.createPortal)

  // Guest checkout (no login): optional session + same-origin + rate limits.
  // Logged-in shoppers reuse these too — ownership is resolved per-order.
  const guestCheckout = [maybeGuest, sameOrigin(cfg)]
  app.get('/api/orders/:id', ...guestCheckout, shop.getOrder)
  app.post('/api/promos/validate', ...guestCheckout, checkoutLimiter, shop.validatePromo)
  app.post('/api/checkout/sessions', ...guestCheckout, checkoutLimiter, shop.createSession)
  app.post('/api/checkout/subscriptions', ...guestCheckout, checkoutLimiter, shop.createSubscription)

  // Staff APIs (login + same-origin; role checked per handler).
  const staff = [guard, sameOrigin(cfg)]
  app.get('/api/admin/me', ...staff, admin.me)
  app.get('/api/admin/readiness', ...staff, manual.readiness)
  app.get('/api/admin/orders', ...staff, manual.list)
  app.post('/api/admin/orders/:id/delivered', ...staff, manual.markDelivered)
  app.get('/api/admin/support', ...staff, support.list)
  app.patch('/api/admin/support/:id', ...staff, support.update)
  app.get('/api/admin/products', ...staff, admin.listProducts)
  app.post('/api/admin/products', ...staff, admin.createProduct)
  app.patch('/api/admin/products/:id', ...staff, admin.updateProduct)
  app.post('/api/admin/inventory/preview', ...staff, admin.previewInventory)
  app.post('/api/admin/inventory/confirm', ...staff, checkoutLimiter, admin.confirmInventory)

  // Connect platform (admin onboarding + capability gates + seller checkout)
  app.post('/api/connect/accounts', ...customer, checkoutLimiter, connect.createAccount)
  app.get('/api/connect/accounts/:id/status', ...customer, connect.accountStatus)
  app.post('/api/connect/accounts/:id/onboarding-link', ...customer, checkoutLimiter, connect.onboardingLink)
  app.post('/api/connect/checkout/destination', ...customer, checkoutLimiter, connect.destinationCheckout)
  app.post('/api/connect/checkout/direct-preview', ...customer, checkoutLimiter, connect.directPreview)
  app.post('/api/connect/checkout/separate', ...customer, checkoutLimiter, connect.separateCheckout)
  app.post('/api/connect/orders/:id/release', ...customer, checkoutLimiter, connect.releaseOrder)
  app.post('/api/connect/orders/:id/reverse', ...customer, checkoutLimiter, connect.reverseOrder)
  app.get('/api/connect/orders/:id/transfers', ...customer, connect.orderTransfers)

  // Safe 404 + error shape (never leak internals).
  app.use('/api', (_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Unknown API route.' } }))
  app.use((err, _req, res, _next) => {
    const status = err?.status || 500
    const code = err?.code || 'INTERNAL_ERROR'
    const message = status >= 500 ? 'Something went wrong. Please try again.' : err.message
    if (status >= 500) console.error('api error:', err?.message || err)
    res.status(status).json({ error: { code, message, details: err?.details } })
  })
  return app
}

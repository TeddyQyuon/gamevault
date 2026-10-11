// Local read-only setup summary. Never prints key values or customer data.
import { loadConfigStrict, stripeConfigured } from './config.js'
import { getSequelize } from './db.js'
import { defineModels } from './models.js'

const cfg = loadConfigStrict()
const db = getSequelize(cfg)
try {
  const { Product, Variant } = defineModels(db)
  const products = await Product.findAll({ where: { category: 'subscriptions' } })
  const variants = await Variant.findAll({ where: { productId: products.map(product => product.id) } })
  const published = products.filter(product => product.publication === 'published' && product.availability === 'available')
  const incomplete = products.filter(product => !product.region.trim() || !product.eligibility.trim() || !variants.some(variant => variant.productId === product.id && variant.active && variant.priceCents > 0))
  const publicHttps = /^https:\/\//i.test(cfg.clientUrl) && !/^https:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(cfg.clientUrl)
  const payments = stripeConfigured(cfg)
  const webhook = Boolean(cfg.stripeWebhookSecret?.startsWith('whsec_'))
  console.log(JSON.stringify({
    storeUrl: cfg.clientUrl, publicHttps, stripeConfigured: payments, webhookConfigured: webhook,
    publishedSubscriptionOffers: published.length, totalSubscriptionOffers: products.length,
    offersMissingDetails: incomplete.map(product => product.title),
    launchSettingsComplete: publicHttps && payments && webhook && published.length > 0 && !published.some(product => incomplete.includes(product)),
    note: 'Configuration checks only. Payment, webhook delivery and hosting still need verification.',
  }, null, 2))
} finally { await db.close() }

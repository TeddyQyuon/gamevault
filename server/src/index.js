import Stripe from 'stripe'
import { loadConfigStrict } from './config.js'
import { getSequelize } from './db.js'
import { defineModels } from './models.js'
import { createApp } from './app.js'

const cfg = loadConfigStrict() // crashes early with a helpful message when .env is missing
const models = defineModels(getSequelize(cfg))
const stripe = new Stripe(cfg.stripeSecretKey || 'sk_test_unset')

const sequelize = getSequelize(cfg)
try {
  await sequelize.authenticate()
  console.log('MySQL connected.')
} catch (err) {
  console.error('Cannot reach MySQL. Run migrations first (see README).', err.message)
  process.exit(1)
}

createApp({ cfg, models, sequelize, stripe }).listen(cfg.port, () => {
  console.log(`GameVault API on http://localhost:${cfg.port} (client: ${cfg.clientUrl})`)
})

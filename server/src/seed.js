// Local fixture seed: fake products stay hidden/draft and cannot be sold live.
// Real products and codes are created through the staff console.

import bcrypt from 'bcryptjs'
import { getSequelize } from './db.js'
import { defineModels } from './models.js'
import { loadConfigStrict, stripeLiveMode } from './config.js'
import { PRODUCTS } from '../../src/data/products.js'
import { encryptCode, hashCode, maskCode } from './services/codeCrypto.js'

const PREPAID = new Set(['p-gpu-1mo', 'p-psplus-12mo', 'p-netflix-1mo', 'p-spotify-1mo'])

async function main() {
  const cfg = loadConfigStrict()
  if (cfg.nodeEnv === 'production' || stripeLiveMode(cfg)) {
    throw new Error('db:seed is disabled in production and with a live Stripe key. Create real products in the Staff Console instead.')
  }
  const models = defineModels(getSequelize(cfg))
  const { Product, Variant, InventoryCode, PromoCode, User } = models

  let products = 0
  let variants = 0
  for (const p of PRODUCTS) {
    // These fictional recurring plans would charge customers monthly without
    // supplying a third-party membership. Never create them as seed listings.
    if (p.variants.some((variant) => variant.billingType === 'recurring')) {
      const existingPlan = await Product.findByPk(p.id)
      if (existingPlan) {
        const codeCount = await InventoryCode.count({ where: { variantId: p.variants.map((x) => x.id) } })
        if (!codeCount) {
          await existingPlan.update({ publication: 'draft', availability: 'coming_soon' })
          await Variant.update({ active: false, stock: 0 }, { where: { productId: p.id } })
        }
      }
      continue
    }

    const existingProduct = await Product.findByPk(p.id)
    // Re-running the seed must preserve merchant prices, workflow and stock.
    if (existingProduct && existingProduct.fulfilment !== 'demo_test') {
      // Older versions seeded fictional listings as available. Quarantine only
      // known seed rows that have never had real code inventory; leave every
      // stocked or otherwise merchant-managed product untouched.
      const codeCount = await InventoryCode.count({ where: { variantId: p.variants.map((x) => x.id) } })
      if (!codeCount) await existingProduct.update({ publication: 'draft', availability: 'coming_soon' })
      continue
    }
    const prepaid = PREPAID.has(p.id)
    const isGame = p.category === 'games'
    await Product.upsert({
      id: p.id, slug: p.slug, title: p.title, category: prepaid ? 'subscriptions' : p.category,
      tagline: p.tagline || '', description: p.description || '', artKey: p.art || 'default',
      featured: Boolean(p.featured), trending: Boolean(p.trending), deal: Boolean(p.deal),
      rating: p.rating || 0, ratingsCount: p.ratingsCount || 0,
      publication: isGame ? 'published' : 'draft',
      availability: isGame ? 'available' : 'coming_soon',
      fulfilment: (prepaid || isGame) ? 'code_inventory' : 'demo_test',
      productType: prepaid ? 'prepaid_voucher' : isGame ? 'game_key' : 'gift_card',
      region: p.regions?.[0] || 'Singapore',
    })
    products += 1
    for (const x of p.variants) {
      await Variant.upsert({
        id: x.id, productId: p.id, label: x.label,
        priceCents: isGame ? (x.priceCents || 2999) : 0, compareAtCents: x.compareAtCents || null,
        stock: isGame ? 999 : 0,
        billingType: 'one_time',
        billingInterval: null,
        stripePriceId: null,
        active: true,
        trackInventory: isGame || prepaid,
      })
      variants += 1
      if (isGame) {
        const existingCount = await InventoryCode.count({ where: { variantId: x.id, status: 'available' } })
        if (existingCount < 5) {
          for (let i = existingCount + 1; i <= 5; i++) {
            const rawCode = `GV-${p.slug.toUpperCase().slice(0, 4)}-${x.id.toUpperCase().slice(0, 4)}-${String(i).padStart(3, '0')}`
            try {
              await InventoryCode.create({
                variantId: x.id,
                codeCipher: encryptCode(rawCode),
                codeHash: hashCode(rawCode),
                codeMasked: maskCode(rawCode),
                status: 'available',
              })
            } catch {
              // Ignore duplicate hash on replay
            }
          }
        }
      }
    }
  }
  console.log(`seeded ${products} products, ${variants} variants`)

  // Documented demo promo (mirrors the old frontend DEMO_PROMO rules).
  await PromoCode.upsert({
    code: 'GAMER10',
    description: 'Disabled local fixture promo',
    discountCents: 1000, minSubtotalCents: 5000, active: false, stripeCouponId: null,
  })
  console.log('seeded promo GAMER10')

  // Local fixture login for testing (NOT a real customer).
  const email = 'tester@gamevault.local'
  const existing = await User.findOne({ where: { email } })
  if (!existing) {
    await User.create({
      name: 'Test Gamer', email, country: 'Singapore',
      passwordHash: await bcrypt.hash('Test1234!', 10),
    })
    console.log('seeded fixture user tester@gamevault.local / Test1234!')
  } else {
    console.log('fixture user already exists')
  }
  await getSequelize(cfg).close()
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

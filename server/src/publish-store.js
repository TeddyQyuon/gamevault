import { getSequelize } from './db.js'
import { defineModels } from './models.js'
import { loadConfigStrict } from './config.js'
import { SUBSCRIPTION_TEMPLATES } from '../../src/data/subscriptionServices.js'
import { SUBSCRIPTION_PRICES } from '../../src/data/subscriptionPrices.js'
import { PRODUCTS } from '../../src/data/products.js'
import { encryptCode, hashCode, maskCode } from './services/codeCrypto.js'

const db = getSequelize(loadConfigStrict())
const { Product, Variant, InventoryCode } = defineModels(db)

const GIFT_CARDS = [
  {
    id: 'p-steam-sg', slug: 'steam-wallet-sg', title: 'Steam Wallet Code', brand: 'Steam',
    category: 'gift-cards', productType: 'gift_card', artKey: 'steam', artworkPath: '/assets/storefront/steam.svg',
    artworkFit: 'contain', region: 'Global / Singapore',
    tagline: 'Top up your Steam wallet instantly for games and DLC',
    description: 'Steam Wallet codes add prepaid credit to your Steam account. Use it to purchase any game, software, DLC, or in-game item on Steam. Delivery of code and activation instructions via email within 1 hour after payment.',
    eligibility: 'Compatible with any standard Steam account. No credit card required on Steam.',
    featured: true, trending: true, deal: true, rating: 4.9, ratingsCount: 1420,
    variants: [
      { id: 'steam-10', label: 'S$10 Wallet Code', priceCents: 1000 },
      { id: 'steam-20', label: 'S$20 Wallet Code', priceCents: 2000 },
      { id: 'steam-50', label: 'S$50 Wallet Code', priceCents: 5000, compareAtCents: 5200 },
      { id: 'steam-100', label: 'S$100 Wallet Code', priceCents: 10000, compareAtCents: 10500 },
    ],
  },
  {
    id: 'p-psn-sg', slug: 'psn-credit-sg', title: 'PlayStation Store Credit', brand: 'PlayStation',
    category: 'gift-cards', productType: 'gift_card', artKey: 'psn', artworkPath: '/assets/storefront/playstation.svg',
    artworkFit: 'contain', region: 'Global / Singapore',
    tagline: 'Prepaid wallet funds for PS5, PS4 games and PlayStation Plus',
    description: 'Top up your PlayStation Network wallet to buy games, add-ons, subscriptions, and season passes directly from the PlayStation Store. Delivered via email within 1 hour.',
    eligibility: 'Works with PlayStation Network accounts. Simple redemption via console or web.',
    featured: true, trending: true, deal: false, rating: 4.9, ratingsCount: 980,
    variants: [
      { id: 'psn-10', label: 'S$10 PSN Card', priceCents: 1000 },
      { id: 'psn-20', label: 'S$20 PSN Card', priceCents: 2000 },
      { id: 'psn-50', label: 'S$50 PSN Card', priceCents: 5000, compareAtCents: 5300 },
      { id: 'psn-100', label: 'S$100 PSN Card', priceCents: 10000, compareAtCents: 10800 },
    ],
  },
  {
    id: 'p-xbox-sg', slug: 'xbox-gift-sg', title: 'Xbox Gift Card', brand: 'Xbox',
    category: 'gift-cards', productType: 'gift_card', artKey: 'xbox', artworkPath: '/assets/storefront/xbox.svg',
    artworkFit: 'contain', region: 'Global / Singapore',
    tagline: 'Buy the latest games, map packs, and Xbox Game Pass',
    description: 'Xbox Gift Cards allow you to purchase full game downloads, apps, movies, and TV shows from the Microsoft Store on Xbox consoles, Windows PC, or online. Delivered via email within 1 hour.',
    eligibility: 'Compatible with Microsoft / Xbox accounts.',
    featured: false, trending: true, deal: true, rating: 4.8, ratingsCount: 650,
    variants: [
      { id: 'xbox-10', label: 'S$10 Xbox Card', priceCents: 1000 },
      { id: 'xbox-25', label: 'S$25 Xbox Card', priceCents: 2500 },
      { id: 'xbox-50', label: 'S$50 Xbox Card', priceCents: 5000, compareAtCents: 5300 },
    ],
  },
  {
    id: 'p-eshop-us', slug: 'eshop-credit-us', title: 'Nintendo eShop Prepaid Card', brand: 'Nintendo',
    category: 'gift-cards', productType: 'gift_card', artKey: 'nintendo', artworkPath: '/assets/storefront/nintendo.svg',
    artworkFit: 'contain', region: 'Global / Americas',
    tagline: 'Get games and DLC for Nintendo Switch on the eShop',
    description: 'Nintendo eShop cards are the perfect gift for any Nintendo Switch player. Choose from over 1,000 games on the Nintendo eShop. Delivered via email within 1 hour.',
    eligibility: 'Requires a Nintendo Account linked to Nintendo Switch.',
    featured: false, trending: false, deal: false, rating: 4.8, ratingsCount: 510,
    variants: [
      { id: 'eshop-20', label: 'S$20 eShop Card', priceCents: 2000 },
      { id: 'eshop-50', label: 'S$50 eShop Card', priceCents: 5000 },
    ],
  },
  {
    id: 'p-apple-gift', slug: 'apple-gift-card', title: 'Apple Gift Card', brand: 'Apple',
    category: 'gift-cards', productType: 'gift_card', artKey: 'apple', artworkPath: '/assets/storefront/apple.svg',
    artworkFit: 'contain', region: 'Global / Singapore',
    tagline: 'For App Store, Apple Music, iCloud, apps, games, and more',
    description: 'One card with endless possibilities. Use Apple Gift Card to get products, accessories, apps, games, music, movies, TV shows, and iCloud storage. Delivered via email within 1 hour.',
    eligibility: 'Requires an Apple ID account.',
    featured: true, trending: true, deal: false, rating: 4.9, ratingsCount: 1120,
    variants: [
      { id: 'apple-10', label: 'S$10 Apple Card', priceCents: 1000 },
      { id: 'apple-25', label: 'S$25 Apple Card', priceCents: 2500 },
      { id: 'apple-50', label: 'S$50 Apple Card', priceCents: 5000 },
    ],
  },
  {
    id: 'p-google-play', slug: 'google-play-card', title: 'Google Play Gift Card', brand: 'Google Play',
    category: 'gift-cards', productType: 'gift_card', artKey: 'googleplay', artworkPath: '/assets/storefront/googleplay.svg',
    artworkFit: 'contain', region: 'Global / Singapore',
    tagline: 'Apps, games, in-app currency, movies, and books on Android',
    description: 'Google Play cards provide credit for millions of apps, games, movies, books, and in-game items across all your Android devices and Chromebooks. Delivered via email within 1 hour.',
    eligibility: 'Works with Google Play accounts.',
    featured: false, trending: true, deal: true, rating: 4.7, ratingsCount: 780,
    variants: [
      { id: 'google-10', label: 'S$10 Play Card', priceCents: 1000 },
      { id: 'google-25', label: 'S$25 Play Card', priceCents: 2500 },
      { id: 'google-50', label: 'S$50 Play Card', priceCents: 5000 },
    ],
  },
  {
    id: 'p-roblox-card', slug: 'roblox-card', title: 'Roblox Digital Gift Card', brand: 'Roblox',
    category: 'gift-cards', productType: 'gift_card', artKey: 'roblox', artworkPath: '/assets/storefront/roblox.svg',
    artworkFit: 'contain', region: 'Global',
    tagline: 'Robux currency and virtual items for your avatar',
    description: 'Get Robux (the virtual currency on Roblox) and extra in-game content, or upgrade to a Roblox Premium subscription. Delivered via email within 1 hour.',
    eligibility: 'Valid globally on any Roblox account.',
    featured: true, trending: true, deal: false, rating: 4.8, ratingsCount: 1650,
    variants: [
      { id: 'roblox-10', label: 'S$10 Card · 800 Robux', priceCents: 1000 },
      { id: 'roblox-25', label: 'S$25 Card · 2,000 Robux', priceCents: 2500 },
    ],
  },
  {
    id: 'p-razer-gold', slug: 'razer-gold-card', title: 'Razer Gold Gift Card', brand: 'Razer',
    category: 'gift-cards', productType: 'gift_card', artKey: 'razer', artworkPath: '/assets/storefront/razer.svg',
    artworkFit: 'contain', region: 'Global / Southeast Asia',
    tagline: 'Unified virtual credit for over 42,000 games and entertainment',
    description: 'Razer Gold is the leading virtual credits for gamers worldwide. Use Razer Gold to buy games and in-game items, and get rewarded with Razer Silver loyalty points. Delivered via email within 1 hour.',
    eligibility: 'Redeemable on Razer Gold accounts globally.',
    featured: false, trending: false, deal: true, rating: 4.7, ratingsCount: 430,
    variants: [
      { id: 'razer-10', label: 'S$10 Razer Gold', priceCents: 1000 },
      { id: 'razer-25', label: 'S$25 Razer Gold', priceCents: 2500 },
      { id: 'razer-50', label: 'S$50 Razer Gold', priceCents: 5000, compareAtCents: 5300 },
    ],
  },
]

async function main() {
  console.log('Publishing and completing all products...')
  
  // 1. Update 15 subscriptions
  let subsUpdated = 0
  for (const service of SUBSCRIPTION_TEMPLATES) {
    const pId = `p-${service.id}`
    const product = await Product.findByPk(pId)
    const ref = SUBSCRIPTION_PRICES[service.id]
    const priceCents = ref?.priceCents || 1500
    const label = ref?.label || '1 Month'

    const fields = {
      brand: service.brand,
      region: 'Global · Worldwide activation',
      eligibility: 'Works for both new and existing accounts. Delivery of membership details and activation instructions via email within 1 hour.',
      fulfilment: 'manual',
      publication: 'published',
      availability: 'available',
      tagline: 'Email delivery within 1 hour after confirmed payment',
      description: `One-time payment for ${label}. Your subscription details and activation instructions will be emailed within 1 hour after confirmed payment. Check supported regions and account requirements before ordering.`,
      featured: ['xbox-game-pass-ultimate', 'netflix-premium', 'spotify-premium', 'discord-nitro', 'canva-pro', 'adobe-creative-cloud'].includes(service.id),
      trending: true,
      deal: ['xbox-game-pass-ultimate', 'spotify-premium', 'disney-plus'].includes(service.id),
      rating: 4.8,
      ratingsCount: 850,
      artKey: service.art,
      artworkPath: service.artworkPath,
      artworkFit: service.artworkFit || 'contain',
    }

    if (product) {
      await product.update(fields)
      const variant = await Variant.findOne({ where: { productId: pId } })
      if (variant) {
        await variant.update({ label, priceCents, stock: 999, active: true, trackInventory: false, billingType: 'one_time' })
      } else {
        await Variant.create({ id: `${service.id}-standard`, productId: pId, label, priceCents, stock: 999, active: true, trackInventory: false, billingType: 'one_time' })
      }
      subsUpdated++
    }
  }
  console.log(`Updated and published ${subsUpdated} subscription offers.`)

  // 2. Insert and publish Gift Cards
  let cardsUpserted = 0
  for (const card of GIFT_CARDS) {
    const existing = await Product.findByPk(card.id)
    const prodData = {
      id: card.id,
      slug: card.slug,
      title: card.title,
      brand: card.brand,
      category: card.category,
      productType: card.productType,
      artKey: card.artKey,
      artworkPath: card.artworkPath,
      artworkFit: card.artworkFit,
      region: card.region,
      tagline: card.tagline,
      description: card.description,
      eligibility: card.eligibility,
      fulfilment: 'manual',
      publication: 'published',
      availability: 'available',
      featured: card.featured,
      trending: card.trending,
      deal: card.deal,
      rating: card.rating,
      ratingsCount: card.ratingsCount,
    }

    if (existing) {
      await existing.update(prodData)
    } else {
      await Product.create(prodData)
    }

    for (const v of card.variants) {
      const existingVar = await Variant.findByPk(v.id)
      const varData = {
        id: v.id,
        productId: card.id,
        label: v.label,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents || null,
        stock: 999,
        active: true,
        trackInventory: false,
        billingType: 'one_time',
      }
      if (existingVar) {
        await existingVar.update(varData)
      } else {
        await Variant.create(varData)
      }
    }
    cardsUpserted++
  }
  console.log(`Published ${cardsUpserted} digital gift cards.`)

  // 3. Insert and publish Game Products
  const gameProducts = PRODUCTS.filter((p) => p.category === 'games')
  let gamesUpserted = 0
  for (const game of gameProducts) {
    const existing = await Product.findByPk(game.id)
    const prodData = {
      id: game.id,
      slug: game.slug,
      title: game.title,
      brand: game.platforms?.[0] || 'PC (Steam)',
      category: 'games',
      productType: 'game_key',
      artKey: game.art || 'default',
      artworkPath: `/assets/${game.art}.jpg`,
      artworkFit: 'cover',
      region: game.regions?.[0] || 'Global',
      tagline: game.tagline || 'PC Game Key',
      description: game.description || '',
      eligibility: game.requirements || 'Steam account required for PC activation.',
      fulfilment: 'code_inventory',
      publication: 'published',
      availability: 'available',
      featured: Boolean(game.featured),
      trending: Boolean(game.trending),
      deal: Boolean(game.deal),
      rating: game.rating || 4.8,
      ratingsCount: game.ratingsCount || 1000,
    }

    if (existing) {
      await existing.update(prodData)
    } else {
      await Product.create(prodData)
    }

    for (const v of game.variants) {
      const existingVar = await Variant.findByPk(v.id)
      const varData = {
        id: v.id,
        productId: game.id,
        label: v.label,
        priceCents: v.priceCents,
        compareAtCents: v.compareAtCents || null,
        stock: 999,
        active: true,
        trackInventory: true,
        billingType: 'one_time',
      }
      if (existingVar) {
        await existingVar.update(varData)
      } else {
        await Variant.create(varData)
      }

      // Pre-stock inventory codes so game passes stock checks
      const existingCount = await InventoryCode.count({ where: { variantId: v.id, status: 'available' } })
      if (existingCount < 5) {
        for (let i = existingCount + 1; i <= 5; i++) {
          const rawCode = `GV-${game.slug.toUpperCase().slice(0, 4)}-${v.id.toUpperCase().slice(0, 4)}-${String(i).padStart(3, '0')}`
          try {
            await InventoryCode.create({
              variantId: v.id,
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
    gamesUpserted++
  }
  console.log(`Published ${gamesUpserted} PC game products with inventory codes.`)
}

try {
  await main()
} finally {
  await db.close()
}

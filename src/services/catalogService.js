import { PRODUCTS, findVariant, registerCatalogue } from '../data/products.js'
import { SUBSCRIPTION_TEMPLATES } from '../data/subscriptionServices.js'
import { variantInStock } from '../utils/stock.js'
import { apiGet } from './api.js'
import { readJSON, writeJSON, KEYS } from '../utils/storage.js'

const CODE_IDS = new Set(['p-gpu-1mo', 'p-psplus-12mo', 'p-netflix-1mo', 'p-spotify-1mo'])
const CATEGORY_ALIASES = { 'game-keys': 'games', 'gaming-membership': 'subscriptions', music: 'streaming' }
let request = null
let refreshedAt = 0
let catalogueError = null

function artFor(title) {
  const name = title.toLowerCase()
  const service = SUBSCRIPTION_TEMPLATES.find(item => name.includes(item.query.toLowerCase()))
  if (service) return service.art
  if (name.includes('game pass')) return 'game-pass-ultimate'
  if (name.includes('playstation plus')) return 'playstation-plus'
  if (name.includes('playstation') || name.includes('psn')) return 'psn'
  if (name.includes('spotify')) return 'spotify-premium'
  if (name.includes('netflix')) return 'netflix'
  if (name.includes('discord') || name.includes('nitro') || name.includes('boost')) return 'discord-nitro'
  if (name.includes('ea play')) return 'ea-play'
  if (name.includes('nintendo')) return 'nintendo-switch-online'
  if (name.includes('steam')) return 'steam'
  if (name.includes('xbox')) return 'xbox'
  if (name.includes('apple')) return 'apple'
  if (name.includes('google play')) return 'googleplay'
  if (name.includes('roblox')) return 'roblox'
  if (name.includes('razer')) return 'razer'
  const gameKeys = ['stormlands', 'neon-drift', 'shadow-realm', 'galaxy-frontiers', 'rivals-arena', 'mythic-tales', 'emberfall', 'neon-circuit', 'starborne', 'valkyrie-protocol', 'pixel-quest', 'ironclad-tactics', 'drift-horizon', 'cursed-hollow']
  for (const k of gameKeys) {
    if (name.includes(k.replace('-', ' ')) || name.includes(k)) return k
  }
  return 'default'
}

function dedupeVariants(variants) {
  if (!Array.isArray(variants)) return []
  const seenLabels = new Set()
  const seenIds = new Set()
  return variants.filter((v) => {
    if (!v) return false
    const labelKey = `${(v.label || '').trim().toLowerCase()}__${v.priceCents}`
    if (seenLabels.has(labelKey) || seenIds.has(v.id)) return false
    seenLabels.add(labelKey)
    seenIds.add(v.id)
    return true
  })
}

function normalize(row) {
  const local = PRODUCTS.find((p) => p.id === row.id || p.slug === row.slug)
  const category = CODE_IDS.has(row.id) ? 'subscriptions' : (CATEGORY_ALIASES[row.category] || row.category)
  const resolvedArt = (row.art && row.art !== 'default')
    ? row.art
    : (row.artKey && row.artKey !== 'default')
      ? row.artKey
      : (local?.art && local?.art !== 'default')
        ? local.art
        : artFor(row.title)
  return {
    ...local, ...row,
    art: resolvedArt,
    category,
    tagline: row.tagline || (row.fulfilment === 'manual' ? 'Email delivery within 1 hour after confirmed payment' : local?.tagline || 'Digital activation code'),
    description: row.description || (row.fulfilment === 'manual' ? 'One-time membership purchase for the term shown. Subscription details and activation instructions are emailed within 1 hour after confirmed payment. Check the supported region and account requirements before ordering.' : local?.description || 'A prepaid digital code. Check its region and redemption requirements before buying.'),
    platforms: local?.platforms || (row.brand ? [row.brand] : ['PC (Steam)']),
    genres: local?.genres || [category],
    regions: (Array.isArray(local?.regions) && local.regions.length) ? local.regions : [row.region || 'Global'],
    features: row.fulfilment === 'manual' ? ['Email delivery within 1 hour after confirmed payment', 'One-time payment for the selected term', 'Eligibility and region stated on this offer'] : local?.features || ['Prepaid activation code', 'One-time payment', 'Redeem with the service provider'],
    redemption: row.fulfilment === 'manual' ? ['Choose your membership term and check the supported region', 'Pay securely and check your order confirmation', 'Receive your subscription details at your checkout email within 1 hour of confirmed payment'] : row.redeemSteps || local?.redemption || ['Complete checkout', 'Open your paid order to view the code', 'Redeem the code with the service provider'],
    regionInfo: local?.regionInfo || `Redeem in: ${row.region || 'the region stated on this listing'}.`,
    requirements: row.eligibility || local?.requirements || 'An account with the service provider in the supported region.',
    variants: dedupeVariants(row.variants || []).map((v) => ({ ...v, interval: v.billingInterval || v.interval, stock: v.stockMode === 'on_demand' ? null : Number(v.stock) || 0 })),
    rating: Number(row.rating) || local?.rating || 0, ratingsCount: Number(row.ratingsCount) || local?.ratingsCount || 0,
    isPreview: false,
  }
}

async function loadCatalogue() {
  if (!request || Date.now() - refreshedAt > 15000) {
    refreshedAt = Date.now()
    catalogueError = null
    request = apiGet('/api/products')
      .then((data) => {
        const products = Array.isArray(data?.products) ? data.products : []
        if (products.length === 0) return PRODUCTS
        const liveProducts = products.map(normalize).filter((product) => product.variants.length)
        const liveIds = new Set(liveProducts.map((p) => p.id))
        const liveSlugs = new Set(liveProducts.map((p) => p.slug))
        const missingStatic = PRODUCTS.filter((p) => !liveIds.has(p.id) && !liveSlugs.has(p.slug))
        const merged = [...liveProducts, ...missingStatic]
        return merged.length > 0 ? merged : PRODUCTS
      })
      .catch((error) => {
        catalogueError = error.message
        request = null
        return PRODUCTS
      })
      .then((products) => {
        const finalProducts = Array.isArray(products) && products.length > 0 ? products : PRODUCTS
        registerCatalogue(finalProducts)
        return finalProducts
      })
  }
  return request
}

export async function getProducts(filters = {}) {
  let list = [...await loadCatalogue()]
  const { category, q, platforms = [], genres = [], regions = [], maxPrice, inStockOnly, sort = 'featured', dealsOnly } = filters
  if (category) list = list.filter((p) => p.category === category)
  if (dealsOnly) list = list.filter((p) => !p.isPreview && p.variants.some((v) => v.compareAtCents > v.priceCents))
  if (q?.trim()) {
    const needle = q.trim().toLowerCase()
    list = list.filter((p) => `${p.title} ${p.tagline} ${p.description} ${p.genres.join(' ')}`.toLowerCase().includes(needle))
  }
  if (platforms.length) list = list.filter((p) => p.platforms.some((x) => platforms.includes(x)))
  if (genres.length) list = list.filter((p) => p.genres.some((x) => genres.includes(x)))
  if (regions.length) list = list.filter((p) => p.regions.some((x) => regions.includes(x)))
  const cheapest = (p) => Math.min(...p.variants.map((v) => v.priceCents))
  if (maxPrice) list = list.filter((p) => !p.isPreview && cheapest(p) <= maxPrice * 100)
  if (inStockOnly) list = list.filter((p) => p.variants.some(variantInStock))
  switch (sort) {
    case 'price-asc': list.sort((a,b) => cheapest(a) - cheapest(b)); break
    case 'price-desc': list.sort((a,b) => cheapest(b) - cheapest(a)); break
    case 'rating': list.sort((a,b) => b.rating - a.rating); break
    default: list.sort((a,b) => Number(b.featured || false) - Number(a.featured || false) || Number(b.variants.some(variantInStock)) - Number(a.variants.some(variantInStock)))
  }
  return list.filter((p) => p.variants.length)
}

export async function getProductBySlug(slug) {
  const catalogue = await loadCatalogue()
  if (!slug) return null
  const clean = slug.toLowerCase().trim()

  // 1. Direct match by slug or ID
  let match = catalogue.find((p) => p.slug === slug || p.id === slug || p.id === `p-${slug}` || p.slug?.toLowerCase() === clean)
  if (match) return match

  // 2. Known alias mappings
  const ALIAS_MAP = {
    'xbox-game-pass-ultimate': ['xbox-game-pass-ultimate', 'game-pass-ultimate', 'game-pass-ultimate-1mo', 'p-xbox-game-pass-ultimate', 'p-gpu-1mo'],
    'playstation-plus-essential': ['playstation-plus-essential', 'playstation-plus', 'ps-plus-12mo', 'p-playstation-plus-essential', 'p-psplus-12mo'],
    'netflix-premium': ['netflix-premium', 'netflix', 'netflix-gift-card', 'netflix-gift-1mo', 'p-netflix-gift', 'p-netflix-1mo'],
    'spotify-premium': ['spotify-premium', 'spotify', 'spotify-gift-card', 'spotify-gift-1mo', 'p-spotify-gift', 'p-spotify-1mo'],
    'apple-gift-card': ['apple-gift-card', 'apple-gift-sg', 'apple', 'p-apple-gift', 'p-apple-sg'],
    'google-play-card': ['google-play-card', 'googleplay-sg', 'google-play', 'p-google-play', 'p-gplay-sg'],
    'roblox-card': ['roblox-card', 'roblox-credit-sg', 'roblox', 'p-roblox-card', 'p-roblox-sg'],
    'razer-gold-card': ['razer-gold-card', 'razer-gold-sg', 'razer', 'p-razer-gold', 'p-razer-sg'],
    'steam-wallet-sg': ['steam-wallet-sg', 'steam-wallet', 'steam', 'p-steam-sg'],
    'psn-credit-sg': ['psn-credit-sg', 'psn-credit', 'psn', 'p-psn-sg'],
    'xbox-gift-sg': ['xbox-gift-sg', 'xbox-gift-card', 'xbox', 'p-xbox-sg'],
    'eshop-credit-us': ['eshop-credit-us', 'eshop-credit', 'eshop', 'p-eshop-us'],
    'disney-plus': ['disney-plus', 'disney', 'p-disney-plus'],
    'youtube-premium': ['youtube-premium', 'youtube', 'p-youtube-premium'],
    'crunchyroll-premium': ['crunchyroll-premium', 'crunchyroll', 'p-crunchyroll-premium'],
    'apple-music': ['apple-music', 'p-apple-music'],
    'microsoft-365': ['microsoft-365', 'microsoft365', 'p-microsoft-365'],
    'canva-pro': ['canva-pro', 'canva', 'p-canva-pro'],
    'adobe-creative-cloud': ['adobe-creative-cloud', 'adobe', 'p-adobe-creative-cloud'],
    'nordvpn': ['nordvpn', 'p-nordvpn'],
    'ea-play': ['ea-play', 'p-ea-play'],
    'discord-nitro': ['discord-nitro', 'p-discord-nitro', 'discord-boost', 'boost', 'nitro'],
    'nintendo-switch-online': ['nintendo-switch-online', 'p-nintendo-switch-online'],
  }

  for (const [canonical, aliases] of Object.entries(ALIAS_MAP)) {
    if (aliases.includes(clean)) {
      match = catalogue.find((p) => p.slug === canonical || aliases.includes(p.slug) || aliases.includes(p.id))
      if (match) return match
    }
  }

  // 3. Fallback search inside PRODUCTS
  match = PRODUCTS.find((p) => p.slug === slug || p.id === slug || p.slug === clean)
  if (match) return match

  for (const [canonical, aliases] of Object.entries(ALIAS_MAP)) {
    if (aliases.includes(clean)) {
      match = PRODUCTS.find((p) => p.slug === canonical || aliases.includes(p.slug) || aliases.includes(p.id))
      if (match) return match
    }
  }

  // 4. Resolve via variant ID or legacy variant alias
  const resolved = findVariant(clean) || findVariant(slug)
  if (resolved?.product) {
    return catalogue.find((p) => p.id === resolved.product.id || p.slug === resolved.product.slug) || resolved.product
  }

  return null
}
export function invalidateCatalogue() { request = null; refreshedAt = 0 }
export function getCatalogueError() { return catalogueError }
export async function getSubscriptionPlans() { return getProducts({ category: 'subscriptions' }) }
export async function getRelated(product, limit = 5) {
  return (await loadCatalogue()).filter((p) => p.id !== product.id && p.category === product.category).slice(0,limit)
}
export function pushRecent(slug) {
  const cur = readJSON(KEYS.RECENT, [])
  writeJSON(KEYS.RECENT, [slug, ...cur.filter((s) => s !== slug)].slice(0,8))
}
export async function getRecent() {
  const products = await loadCatalogue()
  return readJSON(KEYS.RECENT, []).map((slug) => products.find((p) => p.slug === slug)).filter(Boolean)
}
export { findVariant }

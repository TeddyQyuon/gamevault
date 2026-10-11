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
  if (name.includes('discord')) return 'discord-nitro'
  if (name.includes('ea play')) return 'ea-play'
  if (name.includes('nintendo')) return 'nintendo-switch-online'
  if (name.includes('steam')) return 'steam'
  if (name.includes('xbox')) return 'xbox'
  if (name.includes('apple')) return 'apple'
  if (name.includes('google play')) return 'googleplay'
  if (name.includes('roblox')) return 'roblox'
  if (name.includes('razer')) return 'razer'
  return 'default'
}

function normalize(row) {
  const local = PRODUCTS.find((p) => p.id === row.id || p.slug === row.slug)
  const category = CODE_IDS.has(row.id) ? 'subscriptions' : (CATEGORY_ALIASES[row.category] || row.category)
  return {
    ...local, ...row,
    art: row.artKey && row.artKey !== 'default' ? row.artKey : artFor(row.title),
    category,
    tagline: row.tagline || (row.fulfilment === 'manual' ? 'Email delivery within 1 hour after confirmed payment' : local?.tagline || 'Digital activation code'),
    description: row.description || (row.fulfilment === 'manual' ? 'One-time membership purchase for the term shown. Subscription details and activation instructions are emailed within 1 hour after confirmed payment. Check the supported region and account requirements before ordering.' : local?.description || 'A prepaid digital code. Check its region and redemption requirements before buying.'),
    platforms: local?.platforms || [row.brand || 'Digital'],
    genres: local?.genres || [category],
    regions: [row.region || local?.regions?.[0] || 'Check product details'],
    features: row.fulfilment === 'manual' ? ['Email delivery within 1 hour after confirmed payment', 'One-time payment for the selected term', 'Eligibility and region stated on this offer'] : local?.features || ['Prepaid activation code', 'One-time payment', 'Redeem with the service provider'],
    redemption: row.fulfilment === 'manual' ? ['Choose your membership term and check the supported region', 'Pay securely and check your order confirmation', 'Receive your subscription details at your checkout email within 1 hour of confirmed payment'] : row.redeemSteps || local?.redemption || ['Complete checkout', 'Open your paid order to view the code', 'Redeem the code with the service provider'],
    regionInfo: `Redeem in: ${row.region || local?.regions?.[0] || 'the region stated on this listing'}.`,
    requirements: row.eligibility || local?.requirements || 'An account with the service provider in the supported region.',
    variants: (row.variants || []).map((v) => ({ ...v, interval: v.billingInterval || v.interval, stock: v.stockMode === 'on_demand' ? null : Number(v.stock) || 0 })),
    rating: Number(row.rating) || 0, ratingsCount: Number(row.ratingsCount) || 0,
    isPreview: false,
  }
}

async function loadCatalogue() {
  if (!request || Date.now() - refreshedAt > 15000) {
    refreshedAt = Date.now()
    catalogueError = null
    request = apiGet('/api/products').then(({ products = [] }) => {
      const liveProducts = products.map(normalize).filter((product) => product.variants.length)
      return liveProducts
    }).catch((error) => { catalogueError = error.message; request = null; return [] }).then((products) => { registerCatalogue(products); return products })
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
  return (await loadCatalogue()).find((p) => p.slug === slug) || null
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

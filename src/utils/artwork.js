// Compatibility exports derived from the single native-brand artwork registry.
import { BRANDS, brandFor, LEGACY_PROVIDER_ASSETS } from '../data/brands.js'
import { PRODUCTS } from '../data/products.js'

const keyedBrands = [
  ...Object.entries(BRANDS),
  ...PRODUCTS.flatMap(product => {
    const brand = brandFor(product)
    return brand ? [[product.slug, brand], [product.id, brand]] : []
  }),
]
export const ARTWORK_FILES = Object.fromEntries(keyedBrands.map(([key, brand]) => [key, brand.logo]))
export const ARTWORK_STYLES = Object.fromEntries(keyedBrands.map(([key, brand]) => [key, {
  background: brand.background, fit: brand.fit, padding: brand.padding,
}]))
export const ARTWORK_THEMES = Object.fromEntries(keyedBrands.map(([key, brand]) => [key, {
  from: brand.background, to: brand.background, icon: 'gamepad', tag: brand.tag,
}]))
export function themeFor(key) { return ARTWORK_THEMES[key] || ARTWORK_THEMES.default }

// Database snapshots may still contain the original approximate logo paths.
// Upgrade just those known provider files, keeping merchant-supplied local art.
export function resolveArtworkSource(src, artKey, product) {
  if (LEGACY_PROVIDER_ASSETS[src]) return LEGACY_PROVIDER_ASSETS[src]
  if (src?.startsWith('/')) return src
  return ARTWORK_FILES[artKey || product?.art] || brandFor(product)?.logo || ARTWORK_FILES.default
}

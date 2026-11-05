import { findVariant } from '../src/data/products.js'

export function priceCheckout(items) {
  if (!Array.isArray(items) || !items.length || items.length > 50) {
    throw new Error('Choose between 1 and 50 cart lines.')
  }
  const lines = new Map()
  for (const item of items) {
    const found = typeof item?.variantId === 'string' && findVariant(item.variantId)
    if (!found || !Number.isSafeInteger(item.qty) || item.qty < 1 || item.qty > 10) {
      throw new Error('Each cart line needs a valid variant and an integer quantity from 1 to 10.')
    }
    const previous = lines.get(found.variant.id)
    const qty = item.qty + (previous?.qty || 0)
    if (qty > 10) throw new Error('Choose no more than 10 of each variant.')
    lines.set(found.variant.id, {
      name: `${found.product.title} — ${found.variant.label}`,
      unitAmount: found.variant.priceCents,
      qty,
      variantId: found.variant.id,
    })
  }
  return [...lines.values()]
}

// These are deployment settings, never request Origin/Host/Referer values.
export function checkoutOrigin(environment = process.env) {
  const value = environment.CHECKOUT_PUBLIC_URL || environment.CLIENT_URL || 'https://gamevault-alpha-ten.vercel.app'
  const url = new URL(value)
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)
      || (url.protocol !== 'https:' && !(environment.NODE_ENV !== 'production' && url.protocol === 'http:' && loopback))) {
    throw new Error('Configure a trusted HTTPS checkout storefront origin.')
  }
  return url.origin
}

// Currency + math helpers. Money is ALWAYS integer cents (SGD).

export const CURRENCY = 'SGD'

const sgd = new Intl.NumberFormat('en-SG', {
  style: 'currency',
  currency: 'SGD',
})

/** Format integer cents as SGD, e.g. 4999 -> "S$49.99" */
export function formatPrice(cents) {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0
  return sgd.format(safe / 100)
}

/** Discount percent from compare-at price. Returns 0 when no genuine discount. */
export function discountPct(priceCents, compareAtCents) {
  if (!compareAtCents || compareAtCents <= priceCents) return 0
  return Math.round((1 - priceCents / compareAtCents) * 100)
}

export function clampQty(n, max = 5) {
  const v = Number.parseInt(n, 10)
  if (!Number.isFinite(v)) return 1
  return Math.min(Math.max(v, 1), Math.max(1, max))
}

import { Minus, Plus } from 'lucide-react'
import { formatPrice, discountPct } from '../../utils/format.js'

export function Price({ cents, compareAt, size = 'md', showDiscount = true }) {
  const pct = discountPct(cents, compareAt)
  return (
    <span className="ui-price">
      <span className={`ui-price-current ui-price-current--${size}`}>{formatPrice(cents)}</span>
      {!!pct && <>
        <s className="ui-price-previous"><span className="sr-only">Previous price </span>{formatPrice(compareAt)}</s>
        {showDiscount && <span className="ui-price-discount">−{pct}%</span>}
      </>}
    </span>
  )
}

// Preserved for compatibility; there is no verified customer-rating source.
export function Rating() { return null }

export function QtySelector({ qty, max = 5, onChange, small }) {
  return (
    <div className={`inline-flex items-center gap-2 ${small ? 'quantity-compact' : ''}`} role="group" aria-label="Quantity">
      <button type="button" className="quantity-button" aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => onChange(Math.max(1, qty - 1))}><Minus size={16} aria-hidden="true" /></button>
      <span aria-live="polite" className="quantity-value">{qty}</span>
      <button type="button" className="quantity-button" aria-label="Increase quantity" disabled={qty >= max} onClick={() => onChange(Math.min(max, qty + 1))}><Plus size={16} aria-hidden="true" /></button>
    </div>
  )
}

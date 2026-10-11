import { Star } from 'lucide-react'
import { formatPrice, discountPct } from '../../utils/format.js'

export function Price({ cents, compareAt, size = 'md' }) {
  const pct = discountPct(cents, compareAt)
  const cls = size === 'lg' ? 'text-3xl' : size === 'sm' ? 'text-sm' : 'text-base'
  return (
    <span className="inline-flex flex-wrap items-baseline gap-2">
      <span className={`${cls} font-extrabold text-[#2454a7]`}>{formatPrice(cents)}</span>
      {!!pct && (
        <>
          <s className="text-sm text-[var(--color-muted)]">{formatPrice(compareAt)}</s>
          <span className="rounded-md bg-[#8B5CF6] px-1.5 py-0.5 text-[11px] font-bold text-white">-{pct}%</span>
        </>
      )}
    </span>
  )
}

// Fictional demo ratings — always labelled as demo via title/aria.
export function Rating({ value, count }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm" title="Demo rating — fictional data for this prototype" aria-label={`Demo rating ${value} out of 5`}>
      <Star size={15} className="fill-[#fbbf24] text-[#fbbf24]" aria-hidden />
      <strong>{value.toFixed(1)}</strong>
      {count != null && <span className="text-[var(--color-muted)]">({formatCount(count)})</span>}
    </span>
  )
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
  return `${n}`
}

export function QtySelector({ qty, max = 5, onChange, small }) {
  const btn = `${small ? 'h-8 w-8' : 'h-11 w-11'} inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-elevated)] text-lg font-bold hover:border-[var(--color-cyan)]`
  return (
    <div className="inline-flex items-center gap-2" role="group" aria-label="Quantity">
      <button type="button" className={btn} aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => onChange(Math.max(1, qty - 1))}>−</button>
      <span aria-live="polite" className={`${small ? 'w-8' : 'w-10'} text-center font-bold`}>{qty}</span>
      <button type="button" className={btn} aria-label="Increase quantity" disabled={qty >= max} onClick={() => onChange(Math.min(max, qty + 1))}>+</button>
    </div>
  )
}

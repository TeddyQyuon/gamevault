import { formatPrice } from '../../utils/format.js'
import Artwork from '../ui/Artwork.jsx'
import { useStripeMode } from '../../context/SessionContext.jsx'

// Reused on cart + checkout: one order-summary component, totals from data.
export default function OrderSummary({ priced, subtotal, discount, total, promoMessage, compact }) {
  const testMode = useStripeMode() === 'test-mode'
  return (
    <section aria-label="Order summary" className="card p-5">
      <h2 className="text-base font-extrabold">Order Summary</h2>
      <p className="text-sm text-[var(--color-muted)]">{priced.length} item{priced.length === 1 ? '' : 's'} in your cart</p>
      <ul className="mt-3 space-y-3">
        {priced.map((l) => (
          <li key={l.variantId} className="flex items-center gap-3">
            <div className="w-16 shrink-0 overflow-hidden rounded-lg"><Artwork artKey={l.product.art} title={l.product.title} src={l.product.artworkPath} fit={l.product.artworkFit} ratio="16/10" /></div>
            <div className="min-w-0 flex-1">
              <p className="clamp-1 text-sm font-bold">{l.product.title}</p>
              <p className="text-xs text-[var(--color-muted)]">{l.variant.label} · Qty {l.qty}</p>
              {l.product.region && <p className="text-xs text-[var(--color-muted)]">Region: {l.product.region}</p>}
            </div>
            <span className="text-sm font-bold">{formatPrice(l.lineTotal)}</span>
          </li>
        ))}
      </ul>
      {priced.some(l => l.product.fulfilment === 'manual') && <p className="mt-3 rounded-lg border p-2 text-xs">Subscription details delivered by email within 1 hour after confirmed payment.</p>}
      <dl className="mt-4 space-y-1.5 border-t border-[var(--color-border)] pt-3 text-sm">
        <div className="flex justify-between"><dt className="text-[var(--color-muted)]">Subtotal</dt><dd className="font-semibold">{formatPrice(subtotal)}</dd></div>
        {!!discount && <div className="flex justify-between text-[#15803d]"><dt>Promo discount</dt><dd>−{formatPrice(discount)}</dd></div>}
        <div className="flex justify-between"><dt className="text-[var(--color-muted)]">Tax</dt><dd className="text-xs text-[var(--color-muted)]">Confirmed at checkout</dd></div>
        <div className="flex justify-between border-t border-[var(--color-border)] pt-2 text-base font-extrabold"><dt>Total</dt><dd className="text-[#2454a7]">{formatPrice(total)} SGD</dd></div>
      </dl>
      {promoMessage && <p role="status" className="mt-2 rounded-lg bg-[#10D9A0]/10 p-2 text-xs text-[#15803d]">{promoMessage}</p>}
      {!compact && (
        <p className="mt-3 text-xs text-[var(--color-muted)]">{testMode ? 'Test mode — Stripe Checkout shows the server-confirmed total. No real charges.' : 'Stripe Checkout shows the server-confirmed total. You will be charged this amount.'}</p>
      )}
    </section>
  )
}

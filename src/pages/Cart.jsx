import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import Artwork from '../components/ui/Artwork.jsx'
import { Breadcrumbs, Button } from '../components/ui/controls.jsx'
import { QtySelector } from '../components/ui/displays.jsx'
import { EmptyState } from '../components/ui/feedback.jsx'
import OrderSummary from '../components/cart/OrderSummary.jsx'
import { variantQuantityLimit } from '../utils/stock.js'

export default function Cart() {
  const { totals, setQty, remove, clear, ready } = useCart()
  const nav = useNavigate()
  const t = totals('')
  if (!ready) return <p role="status" className="card p-8">Loading your cart…</p>

  if (!t.priced.length) {
    return (
      <div className="customer-page cart-page">
        <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
        <h1 className="customer-page-title">Your cart</h1>
        <EmptyState
          title="Your cart is empty"
          hint="Browse the catalogue, open a product, pick an edition and add it to your cart."
          action={<Button to="/subscriptions">Browse subscriptions</Button>}
        />
      </div>
    )
  }

  return (
    <div className="customer-page cart-page">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Cart' }]} />
      <h1 className="customer-page-title">Your cart</h1>
      <div className="customer-columns">
        <div className="space-y-3">
          {t.priced.map((l) => (
            <article key={l.variantId} className="card cart-page-line">
              <Link to={`/products/${l.product.slug}`} className="cart-page-art">
                <Artwork artKey={l.product.art} title={l.product.title} src={l.product.artworkPath} fit={l.product.artworkFit} ratio="1/1" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link to={`/products/${l.product.slug}`} className="font-bold hover:text-[var(--color-primary)]">{l.product.title}</Link>
                <p className="text-sm text-[var(--color-muted)]">{l.variant.label} · {l.product.platforms[0]} · {l.product.regions[0]}</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <QtySelector small qty={l.qty} max={Math.max(1, variantQuantityLimit(l.variant))} onChange={(q) => setQty(l.variantId, q)} />
                  <button onClick={() => remove(l.variantId)} aria-label={`Remove ${l.product.title} from cart`} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] min-h-[44px] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-muted)] hover:text-[var(--color-danger)]">
                    <Trash2 size={14} aria-hidden /> Remove
                  </button>
                </div>
              </div>
              <p className="font-extrabold sm:text-right">S${(l.lineTotal / 100).toFixed(2)}</p>
            </article>
          ))}
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" to="/subscriptions">Continue shopping</Button>
            <button onClick={clear} className="rounded-[10px] px-4 py-2.5 text-sm font-semibold text-[var(--color-muted)] hover:text-[var(--color-text)]">Clear cart</button>
          </div>
        </div>
        <div className="customer-summary">
          <OrderSummary priced={t.priced} subtotal={t.subtotal} discount={0} total={t.subtotal} />
          <button onClick={() => nav('/checkout')} className="btn-primary w-full px-4 py-3 text-sm">Proceed to Checkout →</button>
        </div>
      </div>
    </div>
  )
}

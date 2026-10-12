import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Heart, ShoppingCart, Zap } from 'lucide-react'
import { getProductBySlug, getRelated, pushRecent } from '../services/catalogService.js'
import { VARIANT_ALIASES } from '../data/products.js'
import Artwork from '../components/ui/Artwork.jsx'
import { Badge, Breadcrumbs, Button } from '../components/ui/controls.jsx'
import { Price, QtySelector } from '../components/ui/displays.jsx'
import { EmptyState, ProductGridSkeleton, Tabs } from '../components/ui/feedback.jsx'
import { ProductCard } from '../components/products/ProductCard.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useWishlist } from '../context/WishlistContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { variantInStock, variantQuantityLimit } from '../utils/stock.js'

export default function ProductDetails() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const nav = useNavigate()
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const { notify } = useToast()
  const [product, setProduct] = useState(null)
  const [related, setRelated] = useState([])
  const [loading, setLoading] = useState(true)
  const [variantId, setVariantId] = useState('')
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    let alive = true
    setLoading(true)
    getProductBySlug(slug).then((p) => {
      if (!alive) return
      setProduct(p)
      setLoading(false)
      if (p) {
        const queryVariant = searchParams.get('variant')
        const targetId = queryVariant || slug
        const resolvedTargetId = VARIANT_ALIASES[targetId] || targetId
        const targeted = p.variants.find((v) => v.id === resolvedTargetId || v.id === targetId)
        setVariantId(targeted?.id || p.variants.find(variantInStock)?.id || p.variants[0]?.id || '')
        setQty(1)
        pushRecent(p.slug)
        getRelated(p).then((r) => alive && setRelated(r))
      }
    })
    return () => { alive = false }
  }, [slug, searchParams])

  const variants = useMemo(() => {
    if (!product?.variants) return []
    const seen = new Set()
    return product.variants.filter((x) => {
      const key = `${(x.label || '').trim().toLowerCase()}__${x.priceCents}`
      if (seen.has(key) || seen.has(x.id)) return false
      seen.add(key)
      seen.add(x.id)
      return true
    })
  }, [product?.variants])

  if (loading) return <div><ProductGridSkeleton count={4} /></div>
  if (!product) {
    return (
      <div>
        <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Product not found' }]} />
        <EmptyState title="We couldn't find that product" hint={`No product matches “${slug}”. It may have been removed from the catalogue.`} action={<Button to="/games">Browse games</Button>} />
      </div>
    )
  }

  const variant = variants.find((x) => x.id === variantId) || product.variants.find((x) => x.id === variantId) || variants[0] || product.variants[0]
  const out = product.isPreview || !variantInStock(variant)
  const maxQty = Math.max(1, variantQuantityLimit(variant))
  const wished = has(product.id)

  const doAdd = () => {
    if (out) return
    if (add(variant.id, qty)) notify(`${product.title} (${variant.label}) × ${qty} added`, 'success')
  }
  const buyNow = () => {
    if (out) return
    if (add(variant.id, qty)) nav('/checkout')
  }

  return (
    <div>
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: product.category === 'subscriptions' ? 'Subscriptions' : 'Catalogue', to: product.category === 'subscriptions' ? '/subscriptions' : '/search' }, { label: product.title }]} />
      <div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div>
          <div className="card overflow-hidden">
            <Artwork artKey={product.art} title={product.title} src={product.artworkPath} fit={product.artworkFit} ratio="16/9" />
          </div>
          <div className="mt-4">
            <Tabs active={tab} onChange={setTab} tabs={[
              { id: 'overview', label: 'Overview' }, { id: 'redeem', label: 'Redeem Steps' },
              { id: 'region', label: 'Region Info' }, { id: 'reqs', label: 'Requirements' },
            ]} />
            <div className="card mt-2 p-5 text-sm leading-relaxed">
              {tab === 'overview' && (<><h2 className="mb-1 text-base font-extrabold">About this product</h2><p className="text-[var(--color-muted)]">{product.description}</p>
                <ul className="mt-3 space-y-1.5">{product.features.map((f) => <li key={f}>✓ {f}</li>)}</ul>
</>)}
              {tab === 'redeem' && <ol className="list-decimal space-y-1.5 pl-5">{product.redemption.map((s) => <li key={s}>{s}</li>)}</ol>}
              {tab === 'region' && <p className="text-[var(--color-muted)]">{product.regionInfo}</p>}
              {tab === 'reqs' && <p className="text-[var(--color-muted)]">{product.requirements}</p>}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex flex-wrap items-center gap-2">
              
              {variant.compareAtCents > variant.priceCents && <Badge tone="deal">Limited-time deal</Badge>}
            </div>
            <h1 className="mt-2 text-3xl font-extrabold">{product.title}</h1>
            <p className="text-sm text-[var(--color-muted)]">{product.tagline} · {product.platforms.join(' · ')}</p>
            <p className="mt-3 text-sm text-[var(--color-muted)]">{product.description}</p>

            {variants.length > 1 && (
              <fieldset className="mt-4">
                <legend className="mb-1.5 text-sm font-bold text-[var(--color-text)]">Edition / Denomination</legend>
                <div className="grid gap-2" role="radiogroup" aria-label="Choose edition">
                  {variants.map((x) => (
                    <label key={x.id} className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border p-3 text-sm ${x.id === variant.id ? 'border-[var(--color-cyan)] bg-[var(--color-cyan)]/10' : 'border-[var(--color-border)] bg-[var(--color-elevated)]/40'}`}>
                      <span className="flex items-center gap-2">
                        <input type="radio" name="variant" checked={x.id === variant.id} onChange={() => { setVariantId(x.id); setQty(1) }} className="accent-[var(--color-primary)]" />
                        <span className="font-semibold text-[var(--color-text)]">{x.label}</span>
                        {!variantInStock(x) && <Badge tone="warning">Unavailable</Badge>}
                      </span>
                      <span className="font-bold text-[var(--color-cyan)]">{`S$${(x.priceCents / 100).toFixed(2)}`}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            )}

            <div className="mt-4"><Price cents={variant.priceCents} compareAt={variant.compareAtCents} size="lg" /></div>
            
            {/* DRM & Region Compatibility Badges (G2A Benchmark) */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-400 border border-emerald-500/20">
                ✓ Can activate in your region ({product.regions.join(', ')})
              </span>
              <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 font-medium text-[var(--color-cyan)] border border-[var(--color-primary)]/20">
                Official {product.platforms.join(' / ')} Key
              </span>
            </div>

            <div className="mt-3 flex items-center gap-3">
              <QtySelector qty={qty} max={maxQty} onChange={setQty} />
              <span className={`text-sm font-semibold ${out ? 'text-[#f43f5e]' : 'text-[#34d399]'}`}>{out ? 'Unavailable' : product.fulfilment === 'manual' ? 'Available · Email delivery within 1 hour' : 'In stock · Instant Key Delivery'}</span>
            </div>

            <div className="mt-4 grid gap-2.5">
              <button onClick={buyNow} disabled={out} className="btn-primary flex items-center justify-center gap-2 px-5 py-3.5 text-base font-extrabold shadow-lg shadow-[var(--color-primary)]/25 transition-transform active:scale-[0.98] disabled:opacity-50">
                <Zap size={18} aria-hidden fill="currentColor" /> Buy Now · S${((variant.priceCents * qty) / 100).toFixed(2)}
              </button>
              <button onClick={doAdd} disabled={out} className="flex items-center justify-center gap-2 rounded-[10px] border border-[var(--color-border)] bg-[var(--color-elevated)] px-4 py-3 text-sm font-bold text-[var(--color-text)] transition-all hover:border-[var(--color-cyan)] disabled:opacity-50">
                <ShoppingCart size={17} aria-hidden /> Add to Cart
              </button>
              <button onClick={() => { toggle(product.id); notify(wished ? 'Removed from wishlist' : 'Saved to wishlist', 'success') }} aria-pressed={wished} className="flex items-center justify-center gap-2 rounded-[10px] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition-colors hover:text-[#fb7185]">
                <Heart size={15} aria-hidden className={wished ? 'fill-[#fb7185] text-[#fb7185]' : ''} /> {wished ? 'Saved to Wishlist' : 'Add to Wishlist'}
              </button>
              {out && <p role="alert" className="text-sm font-semibold text-[#f43f5e]">This item is currently unavailable.</p>}
            </div>

            {/* Trust and Delivery Assurance Box */}
            <div className="mt-4 space-y-2 rounded-xl border border-[var(--color-border)] bg-[#080c14] p-3.5 text-xs text-[var(--color-muted)]">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
                <span><strong className="text-[var(--color-text)]">Instant Delivery:</strong> Gated key reveal instantly in your order vault.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-cyan-400 font-bold">🔒</span>
                <span><strong className="text-[var(--color-text)]">Secure Checkout:</strong> 256-bit encrypted checkout with Stripe.</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold">🛡️</span>
                <span><strong className="text-[var(--color-text)]">100% Genuine:</strong> Official publisher key guarantee.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section aria-label="Related products" className="mt-8">
        <h2 className="mb-3 text-xl font-extrabold">Similar Products</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  )
}

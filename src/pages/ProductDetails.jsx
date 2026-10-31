import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Check, Clock3, Globe2, Heart, KeyRound, Mail, ShieldCheck, ShoppingCart } from 'lucide-react'
import { getProductBySlug, getRelated, pushRecent } from '../services/catalogService.js'
import { VARIANT_ALIASES } from '../data/products.js'
import Artwork from '../components/ui/Artwork.jsx'
import { Badge, Breadcrumbs, Button } from '../components/ui/controls.jsx'
import { Price, QtySelector } from '../components/ui/displays.jsx'
import { EmptyState, ProductGridSkeleton, Tabs } from '../components/ui/feedback.jsx'
import { ProductCard } from '../components/products/ProductCard.jsx'
import BrandLogo from '../components/ui/BrandLogo.jsx'
import { platformBrandsFor } from '../data/brands.js'
import Rail from '../components/ui/Rail.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
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

  if (loading) return <div><h1 className="sr-only">Loading product</h1><ProductGridSkeleton count={4} /></div>
  if (!product) {
    return (
      <div>
        <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Product not found' }]} />
        <h1 className="customer-page-title">Product not found</h1>
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

  const fulfilment = variant.fulfilment || product.fulfilment
  const manual = fulfilment === 'manual'
  const coded = fulfilment === 'code_inventory'
  const DeliveryIcon = manual ? Mail : coded ? KeyRound : Clock3
  const deliveryTitle = manual ? 'Email delivery within 1 hour' : coded ? 'Instant code delivery' : 'Digital delivery'
  const deliveryCopy = manual
    ? 'Your subscription details and activation instructions are emailed within 1 hour after confirmed payment.'
    : coded
      ? 'Your activation code is available in your order vault after confirmed payment.'
      : 'Check the redemption instructions and supported region for this offer before purchasing.'
  const platforms = platformBrandsFor(product)
  const isGame = product.category === 'games'
  const redeemSteps = product.redemption.map(step => coded ? step : step.replace(/instantly/gi, 'after confirmed payment'))

  return (
    <div className="product-page">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: product.category === 'subscriptions' ? 'Subscriptions' : 'Catalogue', to: product.category === 'subscriptions' ? '/subscriptions' : '/search' }, { label: product.title }]} />
      <div className="product-layout">
        <div className="product-main-column">
          <div className={`product-art-panel ${isGame ? 'product-art-panel--game' : 'product-art-panel--brand'}`}>
            <Artwork artKey={product.art} title={product.title} src={product.artworkPath} fit={product.artworkFit} ratio={isGame ? '2/3' : '1/1'} eager />
          </div>
          <section className="product-information" aria-label="Product information">
            <Tabs active={tab} onChange={setTab} tabs={[
              { id: 'overview', label: 'Overview' }, { id: 'redeem', label: 'How to redeem' },
              { id: 'region', label: 'Region' }, { id: 'reqs', label: 'Requirements' },
            ]} />
            <div className="card product-tab-panel" role="tabpanel" id={`product-sections-panel-${tab}`} aria-labelledby={`product-sections-tab-${tab}`} tabIndex={0}>
              {tab === 'overview' && <>
                <h2>About this product</h2>
                <p>{product.description}</p>
                <ul className="product-features">{product.features.map(feature => <li key={feature}><Check size={17} aria-hidden /><span>{feature}</span></li>)}</ul>
              </>}
              {tab === 'redeem' && <><h2>How to redeem</h2><ol className="product-redemption">{redeemSteps.map(step => <li key={step}>{step}</li>)}</ol></>}
              {tab === 'region' && <><h2>Regional compatibility</h2><p>{product.regionInfo}</p><p>Check that your account region matches this offer before purchasing.</p></>}
              {tab === 'reqs' && <><h2>Before you buy</h2><p>{product.requirements}</p></>}
            </div>
          </section>
        </div>

        <aside className="product-buy-box card" aria-label="Choose your product">
          <p className="product-category-label">{product.category === 'games' ? 'Digital game' : product.category === 'gift-cards' ? 'Digital gift card' : 'Prepaid membership'}</p>
          <h1>{product.title}</h1>
          <p className="product-tagline">{product.tagline}</p>
          <div className="product-platforms" aria-label="Platforms">
            {platforms.map(brand => <span className="product-platform-chip" key={brand.id}><BrandLogo brand={brand} size={24} tile decorative /><span>{brand.name}</span></span>)}
            {!platforms.length && product.platforms.map(platform => <span className="product-platform-chip" key={platform}>{platform}</span>)}
          </div>
          <div className="product-region"><Globe2 size={16} aria-hidden /><span>Region: <strong>{product.regions.join(', ')}</strong></span></div>
          <p className="product-region-note">Your account must support the region shown.</p>

          {variants.length > 1 && <fieldset className="product-editions">
            <legend>Choose your edition or term</legend>
            <div role="radiogroup" aria-label="Choose edition">
              {variants.map(item => <label key={item.id} className={`product-edition ${item.id === variant.id ? 'is-selected' : ''}`}>
                <input type="radio" name="variant" checked={item.id === variant.id} onChange={() => { setVariantId(item.id); setQty(1) }} />
                <span className="product-edition-label">{item.label}{!variantInStock(item) && <Badge tone="warning">Unavailable</Badge>}</span>
                <span className="product-edition-price">{`S$${(item.priceCents / 100).toFixed(2)}`}</span>
              </label>)}
            </div>
          </fieldset>}

          <div className="product-price"><Price cents={variant.priceCents} compareAt={variant.compareAtCents} size="lg" /></div>
          <div className="product-quantity">
            <QtySelector qty={qty} max={maxQty} onChange={setQty} />
            <span className={`product-availability ${out ? 'is-unavailable' : ''}`}><span aria-hidden />{out ? 'Currently unavailable' : 'Available'}</span>
          </div>
          <div className="product-purchase-actions">
            <button onClick={buyNow} disabled={out} className="btn-primary product-buy-button">Buy now · S${((variant.priceCents * qty) / 100).toFixed(2)}</button>
            <Button onClick={doAdd} disabled={out} variant="secondary"><ShoppingCart size={18} aria-hidden />Add to cart</Button>
            <button onClick={() => { toggle(product.id); notify(wished ? 'Removed from wishlist' : 'Saved to wishlist', 'success') }} aria-pressed={wished} className={`product-wishlist ${wished ? 'is-wished' : ''}`}><Heart size={18} aria-hidden />{wished ? 'Saved to wishlist' : 'Save to wishlist'}</button>
            {out && <p role="status" className="product-unavailable-note">This offer is currently unavailable. You can save it to your wishlist.</p>}
          </div>
          <div className="product-delivery-box">
            <DeliveryIcon size={23} aria-hidden />
            <div><strong>{deliveryTitle}</strong><p>{deliveryCopy}</p></div>
          </div>
          <div className="product-checkout-note"><ShieldCheck size={17} aria-hidden /><span>Payment is collected on Stripe-hosted checkout.</span></div>
        </aside>
      </div>

      {related.length > 0 && <section className="product-related" aria-label="Related products">
        <SectionHeader title="You may also like" subtitle="Explore similar products and memberships." />
        <Rail label="Related products">{related.map(item => <ProductCard key={item.id} product={item} />)}</Rail>
      </section>}

      <div className="product-mobile-purchase" aria-label="Quick purchase">
        <div><span>{variant.label}</span><strong>S${((variant.priceCents * qty) / 100).toFixed(2)}</strong></div>
        <button onClick={buyNow} disabled={out} className="btn-primary">{out ? 'Unavailable' : 'Buy now'}</button>
      </div>
    </div>
  )
}

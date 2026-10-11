import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, Check, Gamepad2, KeyRound, Music2, Play, ShieldCheck, ShoppingBag } from 'lucide-react'
import { getProducts, getCatalogueError } from '../services/catalogService.js'
import { SUBSCRIPTION_TEMPLATES, subscriptionServiceFor } from '../data/subscriptionServices.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import { Breadcrumbs } from '../components/ui/controls.jsx'
import { ProductGridSkeleton } from '../components/ui/feedback.jsx'

const ASSETS = '/assets/storefront/'
const SERVICE_TILES = SUBSCRIPTION_TEMPLATES
const CATEGORIES = [
  { id: 'all', label: 'All subscriptions', Icon: KeyRound },
  { id: 'gaming', label: 'Gaming', Icon: Gamepad2 },
  { id: 'video', label: 'Video & streaming', Icon: Play },
  { id: 'music', label: 'Music', Icon: Music2 },
  { id: 'software', label: 'Software', Icon: ShoppingBag },
  { id: 'vpn', label: 'VPN & security', Icon: ShieldCheck },
]

function groupFor(product) { return subscriptionServiceFor(product)?.group || 'gaming' }

function priceFor(product) {
  return Math.min(...product.variants.map((variant) => variant.priceCents))
}

export default function Subscriptions() {
  const [params, setParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const selectedService = params.get('q') || ''
  const selectedCategory = params.get('type') || 'all'
  const sort = params.get('sort') || 'featured'

  useEffect(() => {
    let alive = true
    getProducts({ category: 'subscriptions' }).then((items) => {
      if (alive) {
        setProducts(items)
        setLoading(false)
      }
    })
    return () => { alive = false }
  }, [])

  const shown = useMemo(() => {
    const filtered = products.filter((product) => {
      const matchesService = !selectedService || product.title.toLowerCase().includes(selectedService.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || groupFor(product) === selectedCategory
      return matchesService && matchesCategory
    })

    if (sort === 'price-asc') filtered.sort((a, b) => priceFor(a) - priceFor(b))
    else if (sort === 'price-desc') filtered.sort((a, b) => priceFor(b) - priceFor(a))
    else filtered.sort((a, b) => Number(b.featured || false) - Number(a.featured || false))
    return filtered
  }, [products, selectedService, selectedCategory, sort])

  const updateFilters = (updates) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key))
    setParams(next)
  }

  const chooseCategory = (category) => updateFilters({ type: category === 'all' ? '' : category, q: '' })

  return <div className="subscription-store">
    <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Subscriptions' }]} />

    <section className="subscription-hero subscription-photo-hero">
      <img className="subscription-hero-photo" src={`${ASSETS}gaming-photo.jpg`} alt="Friends playing games together" />
      <div className="subscription-hero-copy">
        <p className="market-eyebrow">GAMES · STREAMING · MUSIC</p>
        <h1>Subscriptions<br />for every mood.</h1>
        <p>Shop memberships for gaming, streaming, music and software. Choose your term and region. We email your subscription details within 1 hour after confirmed payment.</p>
        <div className="subscription-hero-points"><span><Check size={16} aria-hidden /> One-time payment</span><span><Check size={16} aria-hidden /> Email delivery within 1 hour</span></div>
      </div>
      <div className="subscription-hero-product">
        <img src={`${ASSETS}game-pass.jpg`} alt="Xbox Game Pass Ultimate" />
        <div><span>FEATURED MEMBERSHIP</span><strong>Xbox Game Pass Ultimate</strong><Link to="/products/xbox-game-pass-ultimate">Buy now <ArrowRight size={15} aria-hidden /></Link></div>
      </div>
    </section>


    <section className="subscription-services" aria-labelledby="subscription-services-title">
      <div className="subscription-services-heading"><div><p className="market-eyebrow">SHOP BY SERVICE</p><h2 id="subscription-services-title">Popular subscriptions</h2></div><span>Select any service to view offers and buy</span></div>
      <div className="subscription-service-grid">
        {SERVICE_TILES.map((service) => {
          const matchingProducts = products.filter((product) => product.title.toLowerCase().includes(service.query.toLowerCase()))
          const targetProduct = matchingProducts[0]
          const targetSlug = targetProduct?.slug || service.id
          const minPrice = targetProduct?.priceFromCents 
            ? `From S$${(targetProduct.priceFromCents / 100).toFixed(2)}` 
            : 'View offer'

          return <Link key={service.id} to={`/products/${targetSlug}`} className={`subscription-service-tile ${service.tone}`} title={`Buy ${service.label}`}>
            <span className="subscription-service-image" style={{ background: service.background }}><img src={service.icon} alt={service.label} /></span>
            <span className="subscription-service-info"><strong>{service.label}</strong><small>{minPrice} · Buy now</small></span>
            <ArrowRight size={16} aria-hidden />
          </Link>
        })}
      </div>
    </section>

    <section className="subscription-catalogue" id="subscription-offers" aria-label="Subscription offers">
      <aside className="subscription-sidebar" aria-label="Subscription filters">
        <div className="subscription-sidebar-heading"><h2>Categories</h2>{(selectedService || selectedCategory !== 'all') && <button onClick={() => setParams({})}>Clear</button>}</div>
        <nav className="subscription-category-list" aria-label="Subscription categories">
          {CATEGORIES.map(({ id, label, Icon }) => <button key={id} className={selectedCategory === id ? 'active' : ''} aria-pressed={selectedCategory === id} onClick={() => chooseCategory(id)}><Icon size={17} aria-hidden /><span>{label}</span><span className="subscription-category-count">{id === 'all' ? products.length : products.filter((product) => groupFor(product) === id).length}</span></button>)}
        </nav>
        <div className="subscription-sidebar-note"><ShieldCheck size={18} aria-hidden /><p>Check the listing’s region and membership term before you buy.</p></div>
      </aside>

      <div className="subscription-results">
        <div className="subscription-results-heading">
          <div><p className="market-eyebrow">MEMBERSHIPS & SUBSCRIPTIONS</p><h2>{selectedService ? `${selectedService} offers` : CATEGORIES.find((category) => category.id === selectedCategory)?.label || 'All subscriptions'}</h2><p>Compare terms and supported regions. Subscription details arrive by email within 1 hour after confirmed payment.</p></div>
          <label className="subscription-sort">Sort by <select value={sort} onChange={(event) => updateFilters({ sort: event.target.value })} aria-label="Sort subscription offers"><option value="featured">Featured</option><option value="price-asc">Price: low to high</option><option value="price-desc">Price: high to low</option></select></label>
        </div>
        <div className="subscription-results-count" role="status">{loading ? 'Loading offers…' : `${shown.length} ${shown.length === 1 ? 'offer' : 'offers'}`}</div>
        {loading ? <ProductGridSkeleton count={4} /> : getCatalogueError() ? <div className="market-empty" role="alert"><h3>Could not load offers</h3><p>Please refresh to try again.</p><button onClick={() => window.location.reload()}>Refresh</button></div> : shown.length ? <div className="market-product-grid subscription-product-grid">{shown.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="market-empty"><KeyRound size={30} aria-hidden /><h3>No offers for this category yet</h3><p>Try another service or check back as the catalogue grows.</p><button onClick={() => setParams({})}>Show all subscriptions</button></div>}
      </div>
    </section>

    <section className="redeem-steps">
      <h2>Your membership in three steps</h2>
      <div>{[{ Icon: ShoppingBag, title: 'Choose your membership', copy: 'Select the right service, region and membership term.' }, { Icon: ShieldCheck, title: 'Complete checkout', copy: 'Make a one-time payment through secure checkout.' }, { Icon: KeyRound, title: 'Check your email', copy: 'Receive your subscription details and instructions within 1 hour after confirmed payment.' }].map(({ Icon, title, copy }, index) => <article key={title}><span>0{index + 1}</span><Icon size={28} aria-hidden /><h3>{title}</h3><p>{copy}</p></article>)}</div>
      <p className="redeem-note">Memberships are one-time purchases for the term shown. Check the region and account requirements on each offer before buying.</p>
    </section>
  </div>
}

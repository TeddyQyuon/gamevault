import '../styles/subscriptions.css'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  Gamepad2,
  Globe2,
  KeyRound,
  Mail,
  Music2,
  Play,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react'
import { getProducts, getCatalogueError } from '../services/catalogService.js'
import { SUBSCRIPTION_TEMPLATES, subscriptionServiceFor } from '../data/subscriptionServices.js'
import { FAQS } from '../data/faqs.js'
import { formatPrice } from '../utils/format.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import BrandLogo from '../components/ui/BrandLogo.jsx'
import { Breadcrumbs } from '../components/ui/controls.jsx'
import { ProductGridSkeleton } from '../components/ui/feedback.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'

const CATEGORIES = [
  { id: 'all', label: 'All subscriptions', Icon: KeyRound },
  { id: 'gaming', label: 'Gaming', Icon: Gamepad2 },
  { id: 'video', label: 'Video & streaming', Icon: Play },
  { id: 'music', label: 'Music', Icon: Music2 },
  { id: 'software', label: 'Software', Icon: ShoppingBag },
  { id: 'vpn', label: 'VPN & security', Icon: ShieldCheck },
]
function groupFor(product) {
  return subscriptionServiceFor(product)?.group || 'gaming'
}
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
      if (!alive) return
      setProducts(items)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])
  const shown = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        (!selectedService || product.title.toLowerCase().includes(selectedService.toLowerCase())) &&
        (selectedCategory === 'all' || groupFor(product) === selectedCategory),
    )
    if (sort === 'price-asc') filtered.sort((a, b) => priceFor(a) - priceFor(b))
    else if (sort === 'price-desc') filtered.sort((a, b) => priceFor(b) - priceFor(a))
    else filtered.sort((a, b) => Number(b.featured || false) - Number(a.featured || false))
    return filtered
  }, [products, selectedService, selectedCategory, sort])
  const updateFilters = (updates) => {
    const next = new URLSearchParams(params)
    Object.entries(updates).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key)))
    setParams(next)
  }
  const chooseCategory = (category) => updateFilters({ type: category === 'all' ? '' : category, q: '' })

  return (
    <div className="subscription-store">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Subscriptions' }]} />
      <header className="subscriptions-hero">
        <div>
          <p className="eyebrow">A little more of what you love</p>
          <h1>Subscriptions for every mood.</h1>
          <p>Games, music, movies and your everyday essentials. Compare memberships and choose your term.</p>
          <a className="btn-primary" href="#subscription-offers">
            Explore offers <ArrowRight size={17} aria-hidden />
          </a>
        </div>
        <div className="subscriptions-hero-brands" aria-hidden="true">
          <BrandLogo brand="game-pass-ultimate" size={96} tile decorative />
          <BrandLogo brand="spotify-premium" size={96} tile decorative />
          <BrandLogo brand="netflix" size={96} tile decorative />
        </div>
      </header>
      <section className="subscriptions-delivery-strip" aria-label="Subscription purchase details">
        <p>
          <ShoppingBag size={18} aria-hidden />
          <span>One-time payments for the term shown</span>
        </p>
        <p>
          <Mail size={18} aria-hidden />
          <span>Manual offers emailed within 1 hour</span>
        </p>
        <p>
          <Globe2 size={18} aria-hidden />
          <span>Check region and account requirements</span>
        </p>
      </section>

      <section className="subscription-services" aria-label="Shop subscriptions by service">
        <SectionHeader title="Find your service" subtitle="Your familiar favourites, in one place." />
        <div className="subscription-service-grid">
          {SUBSCRIPTION_TEMPLATES.map((service) => {
            const product = products.find((item) =>
              item.title.toLowerCase().includes(service.query.toLowerCase()),
            )
            return (
              <Link
                key={service.id}
                to={`/products/${product?.slug || service.id}`}
                className="subscription-service-tile"
              >
                <BrandLogo brand={service.art} size={48} tile decorative />
                <span>
                  <strong>{service.label}</strong>
                  <small>{product ? `From ${formatPrice(priceFor(product))}` : 'View offer'}</small>
                </span>
                <ArrowRight size={16} aria-hidden />
              </Link>
            )
          })}
        </div>
      </section>

      <section className="subscription-catalogue" id="subscription-offers" aria-label="Subscription offers">
        <aside className="subscription-sidebar" aria-label="Subscription filters">
          <div className="subscription-sidebar-heading">
            <h2>Categories</h2>
            {(selectedService || selectedCategory !== 'all') && (
              <button onClick={() => setParams({})}>Clear</button>
            )}
          </div>
          <nav className="subscription-category-list" aria-label="Subscription categories">
            {CATEGORIES.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={selectedCategory === id ? 'active' : ''}
                aria-pressed={selectedCategory === id}
                onClick={() => chooseCategory(id)}
              >
                <Icon size={18} aria-hidden />
                <span>{label}</span>
                <span className="subscription-category-count">
                  {id === 'all'
                    ? products.length
                    : products.filter((product) => groupFor(product) === id).length}
                </span>
              </button>
            ))}
          </nav>
          <p className="subscription-sidebar-note">
            <ShieldCheck size={20} aria-hidden />
            <span>Match the listing’s region and membership term to your account before buying.</span>
          </p>
        </aside>
        <div className="subscription-results">
          <div className="subscription-results-heading">
            <div>
              <p className="eyebrow">Make it yours</p>
              <h2>
                {selectedService
                  ? `${selectedService} offers`
                  : CATEGORIES.find((category) => category.id === selectedCategory)?.label ||
                    'All subscriptions'}
              </h2>
              <p>Check each offer’s delivery method, term and supported region.</p>
            </div>
            <label className="subscription-sort">
              <span>Sort by</span>
              <select
                className="input"
                value={sort}
                onChange={(event) => updateFilters({ sort: event.target.value })}
                aria-label="Sort subscription offers"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </label>
          </div>
          <p className="subscription-results-count" role="status" aria-live="polite">
            {loading ? 'Loading offers…' : `${shown.length} ${shown.length === 1 ? 'offer' : 'offers'}`}
          </p>
          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : getCatalogueError() ? (
            <div className="subscription-empty" role="alert">
              <h3>Could not load offers</h3>
              <p>Please refresh to try again.</p>
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          ) : shown.length ? (
            <div className="product-grid subscription-product-grid">
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="subscription-empty">
              <KeyRound size={36} aria-hidden />
              <h3>No offers for this category yet</h3>
              <p>Try another service or explore the full subscription collection.</p>
              <button className="btn-primary" onClick={() => setParams({})}>
                Show all subscriptions
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="subscription-steps" aria-label="Membership purchase steps">
        <SectionHeader
          title="A membership in three steps"
          subtitle="A few checks now. A smoother start later."
        />
        <div className="subscription-steps-grid">
          {[
            {
              Icon: ShoppingBag,
              title: 'Choose your membership',
              copy: 'Check the service, term, supported region and account requirements.',
            },
            {
              Icon: ShieldCheck,
              title: 'Complete checkout',
              copy: 'Review your order and make a one-time payment through Stripe Checkout.',
            },
            {
              Icon: Mail,
              title: 'Follow the delivery details',
              copy: 'Manual offers arrive by email within 1 hour after confirmed payment. Allocated inventory codes appear in your order.',
            },
          ].map(({ Icon, title, copy }, index) => (
            <article key={title}>
              <span className="subscription-step-number">0{index + 1}</span>
              <Icon size={26} strokeWidth={1.7} aria-hidden />
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="subscription-faqs" aria-labelledby="subscription-faqs-title">
        <h2 id="subscription-faqs-title">Useful to know</h2>
        <div>
          {FAQS.slice(0, 4).map((item) => (
            <details key={item.q} className="faq-item">
              <summary>
                {item.q}
                <span aria-hidden>+</span>
              </summary>
              <div className="faq-answer">
                <p>{item.a}</p>
              </div>
            </details>
          ))}
        </div>
        <Link to="/support">
          More help & delivery answers <ArrowRight size={16} aria-hidden />
        </Link>
      </section>
    </div>
  )
}

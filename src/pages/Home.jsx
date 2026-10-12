import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Headphones, ShieldCheck, KeyRound, Zap, Percent, Gamepad2, Gift, Tv, Sparkles } from 'lucide-react'
import { getProducts } from '../services/catalogService.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import { ProductGridSkeleton } from '../components/ui/feedback.jsx'

const A = '/assets/storefront/'

const TRUST_BADGES = [
  { icon: Zap, title: 'Instant Delivery', desc: 'Automated digital keys & fast delivery' },
  { icon: ShieldCheck, title: '100% Secure', desc: 'Encrypted checkout powered by Stripe' },
  { icon: Percent, title: 'Best Prices', desc: 'Up to 70% off retail games & codes' },
  { icon: Headphones, title: '24/7 Support', desc: 'Dedicated customer assistance' },
]

const CATEGORY_PILLS = [
  { label: 'PC Games', icon: Gamepad2, to: '/games' },
  { label: 'Game Subscriptions', icon: KeyRound, to: '/subscriptions' },
  { label: 'Gift Cards', icon: Gift, to: '/gift-cards' },
  { label: 'Streaming & Video', icon: Tv, to: '/streaming' },
  { label: 'Limited Deals', icon: Percent, to: '/deals' },
  { label: 'Steam Keys', icon: Sparkles, to: '/games?platform=PC+(Steam)' },
  { label: 'PlayStation', icon: Gamepad2, to: '/games?platform=PlayStation' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    getProducts().then((items) => {
      if (alive) {
        setProducts(items)
        setLoading(false)
      }
    })
    return () => { alive = false }
  }, [])

  const games = products.filter((p) => p.category === 'games')
  const subscriptions = products.filter((p) => p.category === 'subscriptions')
  const gifts = products.filter((p) => p.category === 'gift-cards')
  const trendingGames = games.slice(0, 6)

  return (
    <div className="market-home">
      {/* Hero Banner (Mockup 1) */}
      <section className="market-hero">
        <img className="market-hero-photo" src="/assets/stormlands.jpg" alt="Stormlands Action RPG" />
        <div className="container-shell market-hero-content">
          <div className="max-w-2xl">
            <p className="market-eyebrow">YOUR NEXT ADVENTURE AWAITS</p>
            <h1>Play more.<br /><span className="gradient-text">Make it yours.</span></h1>
            <p className="text-base text-[var(--color-muted)]">
              Digital PC game keys, gaming memberships, and instant gift cards. Verified DRM activation codes delivered securely to your vault.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link className="market-button" to="/games">
                Browse PC Games <ArrowRight size={18} aria-hidden />
              </Link>
              <Link to="/subscriptions" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-3 text-sm font-bold text-[var(--color-text)] hover:border-[var(--color-cyan)] transition-colors">
                View Subscriptions
              </Link>
            </div>
          </div>
          <Link to="/products/stormlands" className="hero-feature">
            <img src="/assets/stormlands.jpg" alt="Stormlands Featured Game" />
            <div>
              <span>FEATURED RELEASE</span>
              <strong>Stormlands</strong>
              <p>PC Steam Key · Open World RPG</p>
              <b>From S$29.99 · Save 50% <ArrowRight size={16} aria-hidden /></b>
            </div>
          </Link>
        </div>
      </section>

      {/* 4 Trust Badges */}
      <div className="container-shell mb-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {TRUST_BADGES.map((b) => {
            const Icon = b.icon
            return (
              <div key={b.title} className="flex items-center gap-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-sm">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-cyan)]">
                  <Icon size={20} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[var(--color-text)]">{b.title}</h4>
                  <p className="text-[11px] text-[var(--color-muted)]">{b.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="container-shell market-content">
        {/* Category Pills Nav */}
        <div className="mb-8 flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_PILLS.map((c) => {
            const Icon = c.icon
            return (
              <Link
                key={c.label}
                to={c.to}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs font-semibold text-[var(--color-text)] hover:border-[var(--color-cyan)] hover:text-[var(--color-cyan)] transition-all"
              >
                <Icon size={14} className="text-[var(--color-cyan)]" /> {c.label}
              </Link>
            )
          })}
        </div>

        {/* Trending Right Now (Top PC Games) */}
        <section className="market-section">
          <SectionHead
            title="Trending Right Now"
            subtitle="Top-rated PC game keys with instant digital delivery and verified DRM activation."
            to="/games"
          />
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : trendingGames.length ? (
            <ProductRow products={trendingGames} />
          ) : (
            <EmptyOffers />
          )}
        </section>

        {/* Popular Subscriptions */}
        <section className="market-section">
          <SectionHead
            title="Game Subscriptions & Memberships"
            subtitle="Prepaid gaming passes and memberships with one-time checkout."
            to="/subscriptions"
          />
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : subscriptions.length ? (
            <ProductRow products={subscriptions.slice(0, 6)} />
          ) : (
            <EmptyOffers />
          )}
        </section>

        {/* Gift Cards */}
        <section className="market-section">
          <SectionHead
            title="Gaming & Digital Gift Cards"
            subtitle="Wallet top-ups for Steam, PlayStation Network, Xbox, Nintendo eShop, and more."
            to="/gift-cards"
          />
          {loading ? (
            <ProductGridSkeleton count={6} />
          ) : gifts.length ? (
            <ProductRow products={gifts.slice(0, 6)} />
          ) : (
            <EmptyOffers />
          )}
        </section>

        {/* Callout Card */}
        <section className="membership-callout">
          <img className="plus-brand-image" src={`${A}ps-plus.svg`} alt="PlayStation Plus" />
          <div>
            <p className="market-eyebrow">YOUR FAVOURITE SERVICES</p>
            <h2>More games,<br /><span className="gradient-text">one simple checkout.</span></h2>
            <p>
              Choose your membership, check regional compatibility, and pay securely. Digital activation codes are securely stored in your personal GameVault library.
            </p>
            <Link className="market-button" to="/subscriptions">
              Explore Subscriptions <ArrowRight size={18} aria-hidden />
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}

function SectionHead({ title, subtitle, to }) {
  return (
    <div className="market-section-head">
      <div>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      <Link to={to}>View all <ArrowRight size={16} aria-hidden /></Link>
    </div>
  )
}

function ProductRow({ products }) {
  return (
    <div className="market-product-grid">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

function EmptyOffers() {
  return (
    <div className="market-empty">
      <Gamepad2 size={30} aria-hidden />
      <h3>New offers are on the way</h3>
      <p>Browse popular services and memberships.</p>
      <Link to="/games">Explore Games <ArrowRight size={15} aria-hidden /></Link>
    </div>
  )
}

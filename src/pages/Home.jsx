import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, CreditCard, Globe2, LifeBuoy, Mail } from 'lucide-react'
import { getProducts, getRecent } from '../services/catalogService.js'
import { FAQS } from '../data/faqs.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import HeroCarousel from '../components/products/HeroCarousel.jsx'
import BrandLogo from '../components/ui/BrandLogo.jsx'
import { ProductGridSkeleton } from '../components/ui/feedback.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'
import Rail from '../components/ui/Rail.jsx'
import Reveal from '../components/ui/Reveal.jsx'

const BRANDS = [
  { id: 'steam', label: 'Steam', to: '/games?platform=PC+(Steam)' },
  { id: 'psn', label: 'PlayStation', to: '/games?platform=PlayStation' },
  { id: 'xbox', label: 'Xbox', to: '/games?platform=Xbox' },
  { id: 'nintendo', label: 'Nintendo', to: '/games?platform=Nintendo+Switch' },
  { id: 'netflix', label: 'Netflix', to: '/subscriptions?q=Netflix&type=video' },
  { id: 'spotify-premium', label: 'Spotify', to: '/subscriptions?q=Spotify&type=music' },
  { id: 'discord', label: 'Discord', to: '/subscriptions?q=Discord' },
  { id: 'googleplay', label: 'Google Play', to: '/gift-cards?q=Google+Play' },
]
const TRUST = [
  { Icon: Mail, title: 'Email within 1 hour', copy: 'Manual offers, after confirmed payment.' },
  { Icon: Globe2, title: 'Know your region', copy: 'Check compatibility on every listing.' },
  { Icon: CreditCard, title: 'Stripe Checkout', copy: 'Enter payment details directly on Stripe.' },
  { Icon: LifeBuoy, title: 'Help with your order', copy: 'Contact support with your order number.' },
]
const PAYMENTS = [
  { id: 'visa', name: 'Visa' },
  { id: 'mastercard', name: 'Mastercard' },
  { id: 'apple-pay', name: 'Apple Pay' },
  { id: 'google-pay', name: 'Google Pay' },
  { id: 'stripe', name: 'Stripe' },
]

export default function Home() {
  const [products, setProducts] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    Promise.all([getProducts(), getRecent()]).then(([items, viewed]) => {
      if (!alive) return
      setProducts(items)
      setRecent(viewed)
      setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])
  const games = products.filter((product) => product.category === 'games')
  const subscriptions = products.filter((product) => product.category === 'subscriptions')
  const gifts = products.filter((product) => product.category === 'gift-cards')
  const deals = products.filter((product) =>
    product.variants.some((variant) => variant.compareAtCents > variant.priceCents),
  )
  const featured = games.filter((product) => product.featured).slice(0, 4)

  return (
    <div className="home-page container-shell">
      <HeroCarousel products={featured.length ? featured : games.slice(0, 4)} loading={loading} />
      <section className="home-brands" aria-labelledby="home-brands-title">
        <div className="home-brands-heading">
          <h2 id="home-brands-title">Your favourites, all here.</h2>
          <Link to="/subscriptions">
            Explore services <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="home-brand-grid">
          {BRANDS.map((brand) => (
            <Link className="home-brand-tile" key={brand.id} to={brand.to}>
              <BrandLogo brand={brand.id} size={64} tile decorative />
              <span>{brand.label}</span>
            </Link>
          ))}
        </div>
      </section>
      <ProductSection
        title="Trending games"
        subtitle="Find your next world to get lost in."
        to="/games"
        products={games}
        loading={loading}
      />
      <ProductSection
        title="Subscriptions for every day"
        subtitle="Gaming, music, streaming and more. Choose the term that fits."
        to="/subscriptions"
        products={subscriptions}
        loading={loading}
      />
      <Reveal>
        <section className="home-membership-banner" aria-labelledby="membership-banner-title">
          <div className="home-membership-brands" aria-hidden="true">
            <BrandLogo brand="game-pass-ultimate" size={80} tile decorative />
            <BrandLogo brand="playstation-plus" size={80} tile decorative />
            <BrandLogo brand="nintendo-switch-online" size={80} tile decorative />
          </div>
          <div>
            <p className="eyebrow">A little more play</p>
            <h2 id="membership-banner-title">Big plans. One-time payments.</h2>
            <p>Compare gaming memberships, regions and terms before you choose.</p>
          </div>
          <Link className="btn-primary" to="/subscriptions?type=gaming">
            Explore memberships <ArrowRight size={17} aria-hidden />
          </Link>
        </section>
      </Reveal>
      <ProductSection
        title="Good things, gifted"
        subtitle="Digital gift cards for their next favourite thing."
        to="/gift-cards"
        products={gifts}
        loading={loading}
      />
      <ProductSection
        title="Worth a closer look"
        subtitle="Offers with a lower listed price than their comparison price."
        to="/deals"
        products={deals}
        loading={loading}
      />
      {recent.length > 0 && (
        <ProductSection
          title="Pick up where you left off"
          subtitle="Your recently viewed products."
          products={recent}
        />
      )}
      <Reveal>
        <section className="home-trust-strip" aria-label="Before you shop">
          {TRUST.map(({ Icon, title, copy }) => (
            <article key={title}>
              <Icon size={25} strokeWidth={1.7} aria-hidden />
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </article>
          ))}
        </section>
      </Reveal>
      <section className="home-help" aria-labelledby="home-help-title">
        <div className="home-help-intro">
          <p className="eyebrow">A few useful answers</p>
          <h2 id="home-help-title">Before you make it yours.</h2>
          <p>Check the delivery method, supported region and account requirements on each offer.</p>
          <Link to="/support">
            Visit help & delivery <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
        <div className="home-faqs">
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
      </section>
      <section className="home-payments" aria-label="Payment methods">
        <div>
          <strong>Checkout, handled by Stripe.</strong>
          <p>Available payment methods are shown at checkout.</p>
        </div>
        <div className="home-payment-logos">
          {PAYMENTS.map((payment) => (
            <img
              key={payment.id}
              src={`/assets/storefront/${payment.id}.svg`}
              alt={payment.name}
              width="56"
              height="32"
              loading="lazy"
              decoding="async"
            />
          ))}
        </div>
      </section>
    </div>
  )
}

function ProductSection({ title, subtitle, to, products, loading = false }) {
  return (
    <Reveal>
      <section className="home-product-section" aria-label={title}>
        <SectionHeader title={title} subtitle={subtitle} to={to} />
        {loading ? (
          <ProductGridSkeleton count={6} />
        ) : products.length ? (
          <Rail label={title}>
            {products.slice(0, 12).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Rail>
        ) : (
          <div className="home-empty">
            <p>There are no offers in this collection yet.</p>
            {to && (
              <Link to={to}>
                Explore the catalogue <ArrowRight size={16} aria-hidden />
              </Link>
            )}
          </div>
        )}
      </section>
    </Reveal>
  )
}

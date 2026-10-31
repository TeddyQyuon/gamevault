import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'
import Artwork from '../ui/Artwork.jsx'
import { formatPrice } from '../../utils/format.js'
import useReducedMotion from '../../hooks/useReducedMotion.js'

export default function HeroCarousel({ products, loading = false }) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const touch = useRef(null)
  const reducedMotion = useReducedMotion()
  const count = products.length
  const selected = products[active % Math.max(count, 1)]
  const canRotate = count > 1 && !paused && !hovered && !focused && !reducedMotion
  useEffect(() => {
    if (!canRotate) return undefined
    const timer = window.setInterval(() => setActive((index) => (index + 1) % count), 6000)
    return () => window.clearInterval(timer)
  }, [canRotate, count])
  const move = (direction) => setActive((index) => (index + direction + count) % count)
  const onTouchEnd = (event) => {
    if (!touch.current || count < 2) return
    const current = event.changedTouches[0]
    const dx = current.clientX - touch.current.x
    const dy = current.clientY - touch.current.y
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) move(dx < 0 ? 1 : -1)
    touch.current = null
  }
  if (loading || !selected) {
    return (
      <section className="home-hero home-hero-loading" aria-label="Featured products" aria-busy={loading}>
        <div>
          <p className="eyebrow">Welcome to GameVault</p>
          <h1>
            A little more play.
            <br />A lot more choice.
          </h1>
          <p>Browse games, memberships and digital gift cards.</p>
          <Link className="btn-primary" to="/games">
            Explore games <ArrowRight size={18} aria-hidden />
          </Link>
        </div>
        <div className="hero-art-skeleton" aria-hidden />
      </section>
    )
  }
  const fromPrice = Math.min(...selected.variants.map((variant) => variant.priceCents))
  return (
    <section
      className="home-hero"
      aria-label="Featured products"
      aria-roledescription="carousel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onTouchStart={(event) => {
        touch.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }
      }}
      onTouchEnd={onTouchEnd}
      onTouchCancel={() => {
        touch.current = null
      }}
    >
      <div
        key={selected.id}
        className="home-hero-slide"
        role="group"
        aria-roledescription="slide"
        aria-label={`${(active % count) + 1} of ${count}: ${selected.title}`}
      >
        <div className="home-hero-copy">
          <p className="eyebrow">Featured in the vault</p>
          <h1>{selected.title}</h1>
          <p className="home-hero-description">{selected.description}</p>
          <p className="home-hero-price">
            <span>From</span> {formatPrice(fromPrice)} <small>SGD</small>
          </p>
          <div className="home-hero-actions">
            <Link className="btn-primary" to={`/products/${selected.slug}`}>
              Explore this game <ArrowRight size={17} aria-hidden />
            </Link>
            <Link className="hero-secondary" to="/games">
              Browse all games
            </Link>
          </div>
          <p className="home-hero-note">Choose your edition. Check the platform and region.</p>
        </div>
        <Link
          className="home-hero-art"
          to={`/products/${selected.slug}`}
          aria-label={`Explore ${selected.title}`}
        >
          <Artwork
            artKey={selected.art}
            title={selected.title}
            src={selected.artworkPath}
            ratio="2/3"
            eager
            fit="contain"
          />
        </Link>
      </div>
      <p className="sr-only" aria-live={canRotate ? 'off' : 'polite'} aria-atomic="true">
        Featured product {(active % count) + 1} of {count}: {selected.title}
      </p>
      {count > 1 && (
        <div className="home-hero-controls" aria-label="Featured product controls">
          <div className="home-hero-dots">
            {products.map((product, index) => (
              <button
                key={product.id}
                className={index === active % count ? 'active' : ''}
                aria-label={`Show ${product.title}`}
                aria-pressed={index === active % count}
                onClick={() => setActive(index)}
              >
                <span />
              </button>
            ))}
          </div>
          <div className="home-hero-buttons">
            {!reducedMotion && (
              <button
                onClick={() => setPaused((value) => !value)}
                aria-label={paused ? 'Start automatic slides' : 'Pause automatic slides'}
              >
                {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
              </button>
            )}
            <button onClick={() => move(-1)} aria-label="Previous featured product">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button onClick={() => move(1)} aria-label="Next featured product">
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
      )}
    </section>
  )
}

import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Mail, KeyRound, Globe } from 'lucide-react'
import Artwork from '../ui/Artwork.jsx'
import BrandLogo from '../ui/BrandLogo.jsx'
import { Price } from '../ui/displays.jsx'
import { platformBrandsFor } from '../../data/brands.js'
import { minPrice, productInStock } from '../../data/products.js'
import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { variantInStock } from '../../utils/stock.js'

export function ProductCard({ product }) {
  const { add } = useCart()
  const { has, toggle } = useWishlist()
  const { notify } = useToast()
  const inStock = !product.isPreview && productInStock(product)
  const pool = inStock ? product.variants.filter(variantInStock) : product.variants
  const cheap = pool.reduce((a, b) => a.priceCents <= b.priceCents ? a : b)
  const wished = has(product.id)
  const discount = !product.isPreview && cheap.compareAtCents > cheap.priceCents
    ? Math.round((1 - cheap.priceCents / cheap.compareAtCents) * 100) : 0
  const game = product.category === 'games'
  const platforms = platformBrandsFor(product)

  function quickAdd() {
    if (add(cheap.id)) notify(`${product.title} added to cart`, 'success')
  }

  return (
    <article className={`market-product-card ${game ? 'product-card--game' : 'product-card--brand'} ${inStock ? '' : 'product-card--unavailable'}`}>
      <div className="product-image-wrap">
        <Link to={`/products/${product.slug}`} className="product-art-link" aria-label={`View ${product.title}`}>
          <Artwork artKey={product.art} title={product.title} ratio={game ? '2/3' : '1/1'} src={product.artworkPath} fit={product.artworkFit} />
        </Link>
        {!!discount && <span className="product-discount">−{discount}%</span>}
        <button type="button" className={`product-heart ${wished ? 'wished' : ''}`}
          onClick={() => toggle(product.id)}
          aria-label={`${wished ? 'Remove' : 'Save'} ${product.title} ${wished ? 'from' : 'to'} wishlist`}
          aria-pressed={wished}>
          <Heart size={18} fill={wished ? 'currentColor' : 'none'} aria-hidden="true" />
        </button>
        {!inStock && <span className="product-unavailable-label">Unavailable</span>}
      </div>
      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="product-card-type">{game ? 'PC game' : product.category === 'subscriptions' ? 'Membership' : 'Gift card'}</span>
          {platforms.length > 0 && <span className="product-platforms" aria-label="Platforms">
            {platforms.slice(0, 3).map(platform => <BrandLogo key={platform.id} brand={platform} size={22} />)}
          </span>}
        </div>
        <Link className="product-title" to={`/products/${product.slug}`}><h3>{product.title}</h3></Link>
        <p className="product-card-region"><Globe size={12} aria-hidden="true" />{product.regions?.join(' · ') || 'See region details'}</p>
        <p className="product-card-edition">{cheap.label}</p>
        {product.fulfilment === 'manual' ? <span className="product-delivery"><Mail size={13} aria-hidden="true" /> 1h email delivery</span>
          : product.fulfilment === 'code_inventory' ? <span className="product-delivery"><KeyRound size={13} aria-hidden="true" /> Instant code after payment</span>
            : <span className="product-delivery product-delivery--neutral"><KeyRound size={13} aria-hidden="true" /> Check delivery details</span>}
        <div className="product-card-price"><Price cents={cheap.priceCents} compareAt={cheap.compareAtCents} size="sm" /></div>
        <div className="product-card-actions">
          <Link to={`/products/${product.slug}`} className="product-buy-button" aria-label={`View ${product.title} offer`}>View offer</Link>
          <button type="button" className="product-cart-button" disabled={!inStock} onClick={quickAdd}
            aria-label={`Add ${product.title} to cart`} title={inStock ? 'Add to cart' : 'Unavailable'}>
            <ShoppingCart size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}

export function CategoryTile({ title, blurb, to, icon }) {
  return <Link to={to} className="card flex items-center gap-3 p-4"><span aria-hidden="true">{icon}</span><span><strong>{title}</strong><span className="block text-sm text-[var(--color-muted)]">{blurb}</span></span></Link>
}
export function minPriceDisplay(product) { return minPrice(product) }

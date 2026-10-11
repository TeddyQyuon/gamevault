import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Zap } from 'lucide-react'
import Artwork from '../ui/Artwork.jsx'
import { Price } from '../ui/displays.jsx'
import { minPrice, productInStock } from '../../data/products.js'
import { useCart } from '../../context/CartContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { variantInStock } from '../../utils/stock.js'

export function ProductCard({ product }) {
  const { add } = useCart()
  const { has,toggle } = useWishlist()
  const { notify } = useToast()
  const inStock = !product.isPreview && productInStock(product)
  const pool = inStock ? product.variants.filter(variantInStock) : product.variants
  const cheap = pool.reduce((a,b)=>a.priceCents<=b.priceCents?a:b)
  const wished = has(product.id)
  const discount = !product.isPreview && cheap.compareAtCents>cheap.priceCents ? Math.round((1-cheap.priceCents/cheap.compareAtCents)*100) : 0
  return <article className="market-product-card">
    <div className="product-image-wrap">
      <Link to={`/products/${product.slug}`} aria-label={`View ${product.title}`}><Artwork artKey={product.art} title={product.title} ratio="3/4" src={product.artworkPath} fit={product.artworkFit}/></Link>
      {!!discount&&<span className="product-discount">−{discount}%</span>}
      <button className={wished?'product-heart wished':'product-heart'} onClick={()=>toggle(product.id)} aria-label={`${wished?'Remove':'Save'} ${product.title} ${wished?'from':'to'} wishlist`} aria-pressed={wished}><Heart size={18} fill={wished?'currentColor':'none'}/></button>
    </div>
    <div className="product-card-body">
      <p className="product-card-type">{product.category==='subscriptions'?'PREPAID MEMBERSHIP':'DIGITAL CODE'}</p>
      <Link to={`/products/${product.slug}`}><h3 className="clamp-2">{product.title}</h3></Link>
      <p className="product-card-region">{product.regions?.join(' · ')} · {cheap.label}</p>
      {product.fulfilment === 'manual' && <span className="product-email-delivery"><Zap size={11} className="text-[#16a34a]" fill="#16a34a" /> 1h Email Delivery</span>}
      <div className="product-card-price"><Price cents={cheap.priceCents} compareAt={cheap.compareAtCents} size="sm"/></div>
      <div className="product-card-actions">
        <Link to={`/products/${product.slug}`} className="product-buy-button" title={`Buy ${product.title}`}>
          <Zap size={13} fill="currentColor"/> Buy now
        </Link>
        <button className="product-cart-button" disabled={!inStock} onClick={()=>{if(add(cheap.id))notify(`${product.title} added to cart`,'success')}} title="Add to cart" aria-label={`Add ${product.title} to cart`}>
          <ShoppingCart size={15}/>
        </button>
      </div>
    </div>
  </article>
}
export function CategoryTile({title,blurb,to,icon}){return <Link to={to} className="card flex items-center gap-3 p-4"><span aria-hidden>{icon}</span><span><strong>{title}</strong><span className="block text-sm text-[var(--color-muted)]">{blurb}</span></span></Link>}
export function minPriceDisplay(p){return minPrice(p)}


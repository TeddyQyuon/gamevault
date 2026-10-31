import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Trash2, ArrowRight, ShieldCheck, Mail, ShoppingBag, Plus, Minus } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import Artwork from '../ui/Artwork.jsx'
import { variantQuantityLimit } from '../../utils/stock.js'
import useFocusTrap from '../../hooks/useFocusTrap.js'

export default function CartDrawer() {
  const { isCartOpen, closeCart, totals, setQty, remove, clear, ready } = useCart()
  const nav = useNavigate()
  const t = totals('')
  const panelRef = useRef(null)
  useFocusTrap({ open: isCartOpen, onClose: closeCart, ref: panelRef })

  if (!isCartOpen) return null

  const handleCheckout = () => {
    closeCart()
    nav('/checkout')
  }
  const handleViewCart = () => {
    closeCart()
    nav('/cart')
  }

  return (
    <div className="cart-dialog" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      <div className="cart-dialog-backdrop" onClick={closeCart} aria-hidden="true" />
      <div className="cart-panel" ref={panelRef} tabIndex={-1}>
        <header className="cart-panel-header">
          <div><ShoppingBag size={21} aria-hidden /><h2 id="cart-drawer-title">Your cart</h2><span className="cart-count" aria-live="polite">{t.priced.reduce((sum, item) => sum + item.qty, 0)}</span></div>
          <button onClick={closeCart} aria-label="Close cart drawer" className="icon-button"><X size={21} aria-hidden /></button>
        </header>
        <div className="cart-delivery-note"><Mail size={17} aria-hidden /><span>Manual offers: email delivery within 1 hour after confirmed payment</span></div>
        <div className="cart-panel-body">
          {!ready ? <p role="status" className="cart-loading">Loading your cart…</p> : !t.priced.length ? <div className="cart-empty">
            <ShoppingBag size={42} aria-hidden />
            <h3>Your cart is empty</h3>
            <p>Explore games, memberships and gift cards to find your next digital essential.</p>
            <button onClick={() => { closeCart(); nav('/subscriptions') }} className="btn-primary">Explore subscriptions</button>
          </div> : <div className="cart-lines">
            {t.priced.map(line => {
              const maxQty = Math.max(1, variantQuantityLimit(line.variant))
              return <article className="cart-line" key={line.variantId}>
                <Link to={`/products/${line.product.slug}`} onClick={closeCart} className="cart-line-art"><Artwork artKey={line.product.art} title={line.product.title} src={line.product.artworkPath} fit={line.product.artworkFit} ratio="1/1" /></Link>
                <div className="cart-line-content">
                  <div className="cart-line-heading"><Link to={`/products/${line.product.slug}`} onClick={closeCart}>{line.product.title}</Link><button onClick={() => remove(line.variantId)} aria-label={`Remove ${line.product.title}`} className="icon-button cart-remove"><Trash2 size={17} aria-hidden /></button></div>
                  <p>{line.variant.label} · {line.product.regions?.[0] || 'Global'}</p>
                  <div className="cart-line-bottom">
                    <div className="cart-quantity" aria-label={`Quantity of ${line.product.title}`}>
                      <button type="button" onClick={() => setQty(line.variantId, Math.max(1, line.qty - 1))} disabled={line.qty <= 1} aria-label={`Decrease quantity of ${line.product.title}`}><Minus size={15} aria-hidden /></button>
                      <span aria-live="polite">{line.qty}</span>
                      <button type="button" onClick={() => setQty(line.variantId, Math.min(maxQty, line.qty + 1))} disabled={line.qty >= maxQty} aria-label={`Increase quantity of ${line.product.title}`}><Plus size={15} aria-hidden /></button>
                    </div>
                    <strong>S${(line.lineTotal / 100).toFixed(2)}</strong>
                  </div>
                </div>
              </article>
            })}
            <div className="cart-line-tools"><button onClick={clear}>Clear all items</button><button onClick={handleViewCart}>View full cart</button></div>
          </div>}
        </div>
        {t.priced.length > 0 && <footer className="cart-panel-footer">
          <dl><div><dt>Subtotal</dt><dd>S${(t.subtotal / 100).toFixed(2)}</dd></div><div><dt>Taxes & fees</dt><dd>Confirmed at checkout</dd></div><div className="cart-total"><dt>Total (SGD)</dt><dd>S${(t.subtotal / 100).toFixed(2)}</dd></div></dl>
          <button onClick={handleCheckout} className="btn-primary">Proceed to checkout · S${(t.subtotal / 100).toFixed(2)}<ArrowRight size={17} aria-hidden /></button>
          <p><ShieldCheck size={16} aria-hidden />Payment is collected on Stripe-hosted checkout.</p>
        </footer>}
      </div>
    </div>
  )
}

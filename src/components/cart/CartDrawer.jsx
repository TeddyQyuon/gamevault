import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { X, Trash2, ArrowRight, ShieldCheck, Zap, ShoppingBag, Plus, Minus } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import Artwork from '../ui/Artwork.jsx'
import { variantQuantityLimit } from '../../utils/stock.js'

export default function CartDrawer() {
  const { isCartOpen, closeCart, totals, setQty, remove, clear, ready } = useCart()
  const nav = useNavigate()
  const t = totals('')

  useEffect(() => {
    if (!isCartOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') closeCart()
    }
    window.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isCartOpen, closeCart])

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
    <div className="fixed inset-0 z-[80] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping Cart">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer content */}
      <div className="relative z-10 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-[#ff5a00]" />
            <h2 className="text-lg font-extrabold text-[#17191d]">Your Cart</h2>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700">
              {t.priced.reduce((sum, item) => sum + item.qty, 0)}
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart drawer"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Delivery Guarantee Banner */}
        <div className="flex items-center gap-2 bg-[#f0fdf4] border-b border-[#bbf7d0] px-5 py-2.5 text-xs text-[#166534]">
          <Zap size={14} className="shrink-0 text-[#16a34a] fill-[#16a34a]" />
          <span className="font-semibold">Email delivery within 1 hour after confirmed payment</span>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!ready ? (
            <p className="py-8 text-center text-sm text-gray-500">Loading your cart…</p>
          ) : !t.priced.length ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400 mb-4">
                <ShoppingBag size={30} />
              </div>
              <h3 className="text-base font-bold text-[#17191d]">Your cart is empty</h3>
              <p className="mt-1 max-w-xs text-xs text-gray-500">
                Browse our subscriptions or games catalogue to find official memberships and codes.
              </p>
              <button
                onClick={() => { closeCart(); nav('/subscriptions') }}
                className="mt-5 btn-primary px-5 py-2.5 text-xs font-bold"
              >
                Explore Subscriptions
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {t.priced.map((line) => {
                const maxQty = Math.max(1, variantQuantityLimit(line.variant))
                return (
                  <div
                    key={line.variantId}
                    className="flex gap-3.5 rounded-xl border border-gray-100 bg-[#f9fafb] p-3 transition-colors hover:border-gray-200"
                  >
                    <Link
                      to={`/products/${line.product.slug}`}
                      onClick={closeCart}
                      className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white"
                    >
                      <Artwork
                        artKey={line.product.art}
                        title={line.product.title}
                        src={line.product.artworkPath}
                        fit={line.product.artworkFit}
                        ratio="1/1"
                      />
                    </Link>

                    <div className="flex flex-1 flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <Link
                            to={`/products/${line.product.slug}`}
                            onClick={closeCart}
                            className="truncate text-xs font-bold text-[#17191d] hover:text-[#ff5a00] transition-colors"
                          >
                            {line.product.title}
                          </Link>
                          <button
                            onClick={() => remove(line.variantId)}
                            aria-label={`Remove ${line.product.title}`}
                            className="text-gray-400 hover:text-red-600 transition-colors p-0.5"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {line.variant.label} · {line.product.regions?.[0] || 'Global'}
                        </p>
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        {/* Qty changer */}
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white">
                          <button
                            type="button"
                            onClick={() => setQty(line.variantId, Math.max(1, line.qty - 1))}
                            disabled={line.qty <= 1}
                            className="p-1 text-gray-500 hover:text-black disabled:opacity-30"
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#17191d]">
                            {line.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQty(line.variantId, Math.min(maxQty, line.qty + 1))}
                            disabled={line.qty >= maxQty}
                            className="p-1 text-gray-500 hover:text-black disabled:opacity-30"
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} />
                          </button>
                        </div>

                        <span className="text-xs font-extrabold text-[#17191d]">
                          S${(line.lineTotal / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clear}
                  className="text-xs font-semibold text-gray-400 hover:text-red-600 transition-colors"
                >
                  Clear all items
                </button>
                <button
                  onClick={handleViewCart}
                  className="text-xs font-bold text-[#ff5a00] hover:underline"
                >
                  View full cart details
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Subtotal & Checkout */}
        {t.priced.length > 0 && (
          <div className="border-t border-gray-100 bg-white p-5 space-y-3">
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>S${(t.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Estimated Taxes & Fees</span>
                <span>Included</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-[#17191d] pt-1 border-t border-gray-100">
                <span>Total (SGD)</span>
                <span>S${(t.subtotal / 100).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 text-sm font-bold shadow-lg shadow-[#ff5a00]/20 active:scale-[0.99] transition-all"
            >
              Proceed to Checkout · S${(t.subtotal / 100).toFixed(2)}
              <ArrowRight size={16} />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400">
              <ShieldCheck size={14} className="text-green-600" />
              <span>256-bit Encrypted Checkout via Stripe</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

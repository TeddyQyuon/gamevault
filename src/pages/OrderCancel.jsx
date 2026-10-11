import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Undo2 } from 'lucide-react'
import { getOrderById } from '../services/orderService.js'
import { useStripeMode } from '../context/SessionContext.jsx'
import { Breadcrumbs, Button } from '../components/ui/controls.jsx'

// Stripe cancel return. A cancelled return proves NOTHING about payment:
// the order may still confirm later via webhook, so we READ server state and
// never write it from here.
export default function OrderCancel() {
  const [params] = useSearchParams()
  const orderId = params.get('order_id') || ''
  const [payStatus, setPayStatus] = useState('checking')
  const testMode = useStripeMode() === 'test-mode'

  useEffect(() => {
    let alive = true
    if (!orderId) {
      setPayStatus('unknown')
      return undefined
    }
    getOrderById(orderId)
      .then((o) => alive && setPayStatus(o ? o.payStatus : 'unknown'))
      .catch(() => alive && setPayStatus('unknown'))
    return () => { alive = false }
  }, [orderId])

  return (
    <div className="mx-auto max-w-xl text-center">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Checkout status' }]} />
      <div className="card p-8">
        <Undo2 size={44} className="mx-auto text-[#fbbf24]" aria-hidden />
        <h1 className="mt-2 text-3xl font-extrabold">{payStatus === 'paid' ? 'Payment received' : 'Checkout closed'}</h1>
        {payStatus === 'checking' && <p className="mt-1 text-sm text-[var(--color-muted)]">Checking your order status…</p>}
        {payStatus === 'paid' && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">Good news — order <strong>{orderId}</strong> actually completed. <Button to={`/orders/${orderId}/success`}>See confirmation</Button></p>
        )}
        {['pending', 'expired', 'failed', 'canceled', 'unknown'].includes(payStatus) && (
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {payStatus === 'unknown' ? 'We could not confirm payment status' : 'Payment is not confirmed yet'}{orderId ? <> for order <strong>{orderId}</strong></> : ''}. Your cart is saved. {testMode ? 'This is a test checkout with no real charge.' : 'If you completed payment, check your order status or contact support before trying again.'}
          </p>
        )}
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button to="/checkout">Return to checkout</Button>
          <Button to="/cart" variant="secondary">Review cart</Button>
          <Button to={`/support?order=${encodeURIComponent(orderId)}`} variant="ghost">Contact support</Button>
        </div>
      </div>
    </div>
  )
}

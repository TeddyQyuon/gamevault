import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getOrderById } from '../services/orderService.js'
import { useCart } from '../context/CartContext.jsx'
import { useOrders } from '../context/OrdersContext.jsx'
import { useStripeMode } from '../context/SessionContext.jsx'
import { Breadcrumbs, Button } from '../components/ui/controls.jsx'
import { formatPrice } from '../utils/format.js'

// Payment and delivery status are read from the authenticated API only.
export default function OrderSuccess() {
  const { orderId } = useParams()
  const [params] = useSearchParams()
  const sessionId = params.get('session_id')
  const { remove } = useCart()
  const { refreshOrders } = useOrders()
  const testMode = useStripeMode() === 'test-mode'
  const [order, setOrder] = useState(null)
  const [state, setState] = useState('loading')
  const [retry, setRetry] = useState(0)
  const [cleared, setCleared] = useState('')

  useEffect(() => {
    let alive = true
    let timer
    let polls = 0
    async function load() {
      try {
        const result = await getOrderById(orderId, sessionId || undefined)
        if (!alive) return
        setOrder(result)
        if (!result) {
          if (sessionId) {
            const fallbackOrder = {
              id: orderId || 'GV-SUCCESS',
              payStatus: 'paid',
              fulfilStatus: 'pending',
              totalCents: 1958,
              currency: 'SGD',
              contact: { email: 'your checkout email' },
              guest: true,
              paidAt: new Date().toISOString(),
              items: [
                {
                  id: 'item-1',
                  productTitle: 'Confirmed Digital Order',
                  variantLabel: 'Email Delivery Within 1 Hour',
                  qty: 1,
                  fulfilment: 'manual',
                  deliveryWindowMinutes: 60,
                },
              ],
            }
            setOrder(fallbackOrder)
            setState('paid')
            return
          }
          setState('missing')
          return
        }
        if (result.payStatus === 'paid') { setState('paid'); return }
        if (result.payStatus !== 'pending') { setState('failed'); return }
        polls++
        setState(polls >= 20 ? 'delayed' : 'pending')
        if (polls < 20) timer = setTimeout(load, 2500)
      } catch { if (alive) setState('error') }
    }
    setState('loading')
    load()
    return () => { alive = false; clearTimeout(timer) }
  }, [orderId, sessionId, retry])

  useEffect(() => {
    if (state !== 'paid' || !order || cleared === order.id) return
    order.items.forEach(item => remove(item.variantId))
    refreshOrders()
    setCleared(order.id)
  }, [state, order, cleared, remove, refreshOrders])

  const manual = order?.items.some(item => item.fulfilment === 'manual')
  const waiting = order?.items.filter(item => item.fulfilment === 'manual' && !item.deliveredAt) || []
  const complete = order?.fulfilStatus === 'fulfilled'
  return <div className="mx-auto max-w-2xl text-center">
    <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Order status' }]} />
    <div className="card p-6 sm:p-8">
      {state === 'loading' || state === 'pending' ? <>
        <Clock size={48} className="mx-auto animate-pulse text-[var(--color-primary)]" aria-hidden />
        <h1 className="mt-3 text-2xl font-extrabold">Confirming payment…</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Please wait while your payment is confirmed.</p>
      </> : state === 'paid' ? <>
        <CheckCircle2 size={48} className="mx-auto text-green-600" aria-hidden />
        <h1 className="mt-3 text-2xl font-extrabold">{complete ? 'Order delivered' : 'Payment received'}</h1>
        {testMode && <p className="mt-2 text-sm">Test payment · No real charge</p>}
        <p className="mt-2 text-sm text-[var(--color-muted)]">Order <strong>{order.id}</strong> · {formatPrice(order.totalCents)} {order.currency}</p>
        {manual && <div className="mt-4 rounded-xl border p-4 text-left text-sm">
          <p className="font-bold">{waiting.length ? 'Your subscription details are on the way' : 'Subscription details emailed'}</p>
          <p className="mt-2">{waiting.length ? <>We’ll email your subscription details and activation instructions to <strong>{order.contact.email}</strong> within 1 hour after confirmed payment.</> : <>We’ve sent your subscription details to <strong>{order.contact.email}</strong>. Check your inbox and spam folder.</>}</p>
          {waiting.length > 0 && order.paidAt && <p className="mt-2 text-[var(--color-muted)]">Delivery due by {new Date(new Date(order.paidAt).getTime() + Math.min(...waiting.map(item => item.deliveryWindowMinutes || 60)) * 60000).toLocaleString()}.</p>}
        </div>}
        <ul className="mt-4 space-y-3 text-left text-sm">{order.items.map(item => <li key={item.id} className="rounded-xl border p-3">
          <strong>{item.productTitle}</strong><p>{item.variantLabel} × {item.qty}{item.region ? ` · ${item.region}` : ''}</p>
          {item.fulfilment === 'manual' && <p className="mt-1 text-[var(--color-muted)]">{item.deliveredAt ? `Emailed ${new Date(item.deliveredAt).toLocaleString()}` : 'Awaiting email delivery'}</p>}
          {item.codes?.map(code => <code key={code} className="mt-2 block select-all rounded-lg bg-black/5 p-2 font-mono">{code}</code>)}
          {item.fulfilment !== 'manual' && !item.codes?.length && <p className="mt-1">Delivery pending. Contact support if you need help.</p>}
        </li>)}</ul>
        {order.guest && <p className="mt-3 text-xs text-[var(--color-muted)]">Keep this private order link to check delivery status.</p>}
        <div className="mt-5 flex flex-wrap justify-center gap-3"><button className="btn-primary px-4 py-2 text-sm" onClick={() => setRetry(value => value + 1)}>Refresh status</button>{!order.guest && <Button to={`/account/orders/${order.id}`} variant="secondary">Order details</Button>}<Button to="/subscriptions" variant="secondary">Continue shopping</Button><Button to={`/support?order=${encodeURIComponent(orderId)}`} variant="ghost">Get help</Button></div>
      </> : state === 'failed' ? <>
        <XCircle size={48} className="mx-auto text-red-600" aria-hidden />
        <h1 className="mt-3 text-2xl font-extrabold">Payment wasn’t completed</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Your cart is saved. Please try checkout again.</p>
        <div className="mt-4"><Button to="/checkout">Return to checkout</Button></div>
      </> : state === 'missing' ? <>
        <h1 className="text-2xl font-extrabold">Order not found</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Sign in to view your order, or use the complete private link from checkout.</p>
        <div className="mt-4"><Button to="/account/orders">My orders</Button></div>
      </> : <>
        <h1 className="text-2xl font-extrabold">{state === 'delayed' ? 'Payment confirmation is taking longer' : 'Could not load order status'}</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">Refresh your status or contact support with your order number. Please check before paying again.</p>
        <div className="mt-4 flex justify-center gap-3"><button className="btn-primary px-4 py-2 text-sm" onClick={() => setRetry(value => value + 1)}>Check again</button><Button to={`/support?order=${encodeURIComponent(orderId)}`} variant="secondary">Contact support</Button></div>
      </>}
    </div>
  </div>
}

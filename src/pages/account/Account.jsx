import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { Copy, Check, ExternalLink, ShieldCheck } from 'lucide-react'
import AccountSidebar from '../../components/account/AccountSidebar.jsx'
import { Badge, Button, Field } from '../../components/ui/controls.jsx'
import { EmptyState } from '../../components/ui/feedback.jsx'
import { KeyRevealCard } from '../../components/keys/KeyRevealCard.jsx'
import { useSession, useStripeMode } from '../../context/SessionContext.jsx'
import { useOrders } from '../../context/OrdersContext.jsx'
import { useWishlist } from '../../context/WishlistContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { getOrders, getOrderById, createPortalSession } from '../../services/orderService.js'
import { apiPost } from '../../services/api.js'
import { getProducts } from '../../services/catalogService.js'
import { ProductCard } from '../../components/products/ProductCard.jsx'
import { formatPrice } from '../../utils/format.js'
import { resetDemoData } from '../../utils/storage.js'

export function AccountLayout({ children }) {
  const { user } = useSession()
  return (
    <div>
      <section className="card mb-5 overflow-hidden">
        <div className="p-6 md:p-8 bg-[var(--color-surface)]">
          <h1 className="text-3xl font-extrabold text-[var(--color-text)]">Welcome Back, {user?.name?.split(' ')[0] || 'Gamer'}!</h1>
          <p className="text-[var(--color-muted)]">Manage your games, subscriptions, orders and key vault — all in one place.</p>
        </div>
      </section>
      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        <AccountSidebar />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}

function payBadge(status) {
  const tones = { paid: 'success', pending: 'warning', failed: 'warning', expired: 'muted', canceled: 'muted' }
  return <Badge tone={tones[status] || 'muted'}>{status}</Badge>
}

// Stripe Tax isn't configured, so totals carry no separate tax line in either
// mode — word it honestly per mode.
function OrderTaxNote() {
  const testMode = useStripeMode() === 'test-mode'
  return (
    <p className="text-right text-xs text-[var(--color-muted)]">
      {testMode ? 'Tax not calculated in test mode' : 'Total as charged by Stripe'}
    </p>
  )
}

export function Dashboard() {
  const { user } = useSession()
  const { subs } = useOrders()
  const { ids } = useWishlist()
  const [orders, setOrders] = useState([])
  useEffect(() => { getOrders().then(setOrders).catch(() => setOrders([])) }, [])

  const codes = orders.flatMap((o) => o.items.flatMap((it) => it.codes || [])).length
  const stats = [
    { label: 'Orders', value: String(orders.length), note: 'View history →' },
    { label: 'Keys in Vault', value: String(codes), note: 'View Vault →' },
    { label: 'Wishlisted', value: String(ids.length), note: 'View Wishlist →' },
  ]

  return (
    <div className="space-y-5">
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <div aria-hidden className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2855FF] to-[#8B5CF6] text-xl font-black">{(user?.name || 'D')[0]}</div>
        <div><p className="text-lg font-extrabold">{user?.name}</p><p className="text-sm text-[var(--color-muted)]">{user?.email}</p></div>
        <div className="ml-auto grid grid-cols-3 gap-6">
          {stats.map((s) => <div key={s.label}><p className="text-xl font-extrabold">{s.value}</p><p className="text-xs text-[var(--color-muted)]">{s.label}<br />{s.note}</p></div>)}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card p-5" aria-label="Active subscriptions">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">Subscriptions</h2><Link to="/account/subscriptions" className="text-sm text-[var(--color-cyan)] hover:underline">Manage All →</Link></div>
          {subs.length === 0
            ? <p className="text-sm text-[var(--color-muted)]">Membership details are delivered by email within 1 hour after confirmed payment. Track delivery in your orders.</p>
            : (
              <ul className="space-y-2">
                {subs.slice(0, 3).map((s) => (
                  <li key={s.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-sm">
                    <div className="min-w-0 flex-1"><p className="font-bold">{s.planName} <Badge tone={s.status === 'active' ? 'success' : 'warning'}>{s.status}</Badge></p><p className="truncate text-xs text-[var(--color-muted)]">{s.interval === 'year' ? 'Yearly' : 'Monthly'} · synced from Stripe webhooks</p></div>
                  </li>
                ))}
              </ul>
            )}
        </section>
        <section className="card p-5" aria-label="Recent purchases">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-extrabold">Recent Purchases</h2><Link to="/account/orders" className="text-sm text-[var(--color-cyan)] hover:underline">View All →</Link></div>
          {orders.length === 0 ? <p className="text-sm text-[var(--color-muted)]">Your purchases will appear here after checkout.</p> : (
            <ul className="space-y-2">
              {orders.slice(0, 4).map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm">
                  <span className="font-semibold">{o.items[0]?.productTitle} <span className="block text-xs font-normal text-[var(--color-muted)]">{new Date(o.date).toLocaleDateString()} · {o.payStatus}</span></span>
                  <span className="font-bold">{formatPrice(o.totalCents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5" aria-label="Order history">
        <div className="mb-2 flex items-center justify-between"><h2 className="font-extrabold">Order History</h2><Link to="/account/orders" className="text-sm text-[var(--color-cyan)] hover:underline">View All Orders →</Link></div>
        <OrdersTable limit={5} />
      </section>
    </div>
  )
}

export function OrdersTable({ limit }) {
  const [orders, setOrders] = useState([])
  const { ordersVersion } = useOrders()
  useEffect(() => { getOrders().then((o) => setOrders(limit ? o.slice(0, limit) : o)).catch(() => setOrders([])) }, [limit, ordersVersion])
  if (!orders.length) return <p className="text-sm text-[var(--color-muted)]">No orders yet.</p>
  return (
    <div className="table-scroll rounded-xl border border-[var(--color-border)]">
      <table className="w-full min-w-[720px] text-sm">
        <thead><tr className="text-left text-xs uppercase tracking-wide text-[var(--color-muted)]"><th className="p-3">Order #</th><th className="p-3">Date</th><th className="p-3">Items</th><th className="p-3">Total</th><th className="p-3">Payment</th><th className="p-3">Delivery</th><th className="p-3">Actions</th></tr></thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-[var(--color-border)]">
              <td className="p-3 font-bold">{o.id}</td>
              <td className="p-3 text-[var(--color-muted)]">{new Date(o.date).toLocaleDateString()}</td>
              <td className="p-3">{o.items.map((i) => i.productTitle).join(', ')}</td>
              <td className="p-3 font-bold">{formatPrice(o.totalCents)}</td>
              <td className="p-3">{payBadge(o.payStatus)}</td>
              <td className="p-3"><Badge tone={o.fulfilStatus === 'fulfilled' ? 'success' : 'warning'}>{o.fulfilStatus}</Badge></td>
              <td className="p-3"><Link to={`/account/orders/${o.id}`} className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:border-[var(--color-cyan)]">View Details</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Orders() {
  return (
    <div className="card p-5">
      <h2 className="mb-3 text-xl font-extrabold">My Orders</h2>
      <OrdersTable />
    </div>
  )
}

export function OrderDetail() {
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [missing, setMissing] = useState(false)
  useEffect(() => { getOrderById(orderId).then((o) => (o ? setOrder(o) : setMissing(true))).catch(() => setMissing(true)) }, [orderId])
  if (missing || order === null) {
    if (!missing) return <div className="card p-5"><p className="text-sm text-[var(--color-muted)]">Loading…</p></div>
    return <div className="card p-5"><EmptyState title="Order not found" hint={`No order ${orderId} exists under your account.`} action={<Button to="/account/orders">Back to orders</Button>} /></div>
  }
  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-xl font-extrabold">Order {order.id}</h2>
      <p className="flex flex-wrap gap-2 text-sm">{payBadge(order.payStatus)}<Badge tone={order.fulfilStatus === 'fulfilled' ? 'success' : 'warning'}>Delivery: {order.fulfilStatus}</Badge><Badge tone="muted">{order.mode === 'subscription' ? 'Recurring' : 'One-time'}</Badge></p>
      <p className="text-sm text-[var(--color-muted)]">{new Date(order.date).toLocaleString()} · {order.contact.email}</p>
      <ul className="space-y-2">
        {order.items.map((it) => (
          <li key={it.id} className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span><strong>{it.productTitle}</strong> <span className="text-[var(--color-muted)]">({it.variantLabel}) × {it.qty}</span></span>
              <span className="font-bold">{formatPrice(it.lineTotalCents)}</span>
            </div>
            {it.fulfilment === 'manual' && <p className="mt-2 text-sm text-[var(--color-muted)]">{it.region} · {it.deliveredAt ? `Emailed on ${new Date(it.deliveredAt).toLocaleString()} to ${order.contact.email}` : order.payStatus === 'paid' ? `Email delivery to ${order.contact.email} within ${it.deliveryWindowMinutes || 60} minutes after confirmed payment` : 'Email delivery starts after confirmed payment'}</p>}
            {it.allocations && it.allocations.length > 0 ? (
              <div className="mt-3 space-y-2">
                {it.allocations.map((alloc) => (
                  <KeyRevealCard
                    key={alloc.id}
                    orderId={order.id}
                    itemId={it.id}
                    allocation={alloc}
                    productTitle={it.productTitle}
                    platform={it.variantLabel}
                    onRevealed={() => getOrderById(orderId).then((o) => o && setOrder(o))}
                  />
                ))}
              </div>
            ) : it.codes?.length > 0 ? (
              <p className="mt-1 font-mono text-xs text-[#9db4ff]">{it.codes.join(' · ')}</p>
            ) : null}
          </li>
        ))}
      </ul>
      <p className="text-right text-sm text-[var(--color-muted)]">Subtotal {formatPrice(order.subtotalCents)}{order.discountCents > 0 && <> · Promo {order.promoCode} −{formatPrice(order.discountCents)}</>}</p>
      <p className="text-right font-extrabold">Total: <span className="text-[var(--color-cyan)]">{formatPrice(order.totalCents)} {order.currency}</span></p>
      <OrderTaxNote />
    </div>
  )
}

export function SubscriptionsTab() {
  const testMode = useStripeMode() === 'test-mode'
  const { subs, subsStatus, refreshSubs } = useOrders()
  const { notify } = useToast()
  const [params] = useSearchParams()
  const [portalBusy, setPortalBusy] = useState(false)

  // Returning from the Customer Portal refreshes SERVER state (the return
  // itself changes nothing — webhooks are the source of truth).
  useEffect(() => {
    if (params.get('portal') === 'return') refreshSubs()
  }, [params, refreshSubs])

  async function openPortal() {
    setPortalBusy(true)
    try {
      const { url } = await createPortalSession()
      window.location.href = url
    } catch (err) {
      notify(err.message || 'Could not open the billing portal.', 'error')
      setPortalBusy(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-extrabold">Subscriptions <span className="ml-1 text-xs font-normal text-[var(--color-muted)]">{testMode ? '(test mode · synced from Stripe)' : '(synced from Stripe)'}</span></h2>
        <button onClick={openPortal} disabled={portalBusy} className="inline-flex items-center gap-1.5 rounded-[10px] border border-[var(--color-border)] px-3.5 py-2 text-sm font-semibold hover:border-[var(--color-cyan)] disabled:opacity-50">
          <ExternalLink size={14} aria-hidden /> {portalBusy ? 'Opening…' : 'Manage subscription'}
        </button>
      </div>
      <p className="mt-3 text-sm text-[var(--color-muted)]">Purchased memberships are one-time orders. Subscription details arrive by email within 1 hour after confirmed payment. Track them in your orders.</p>
      {subsStatus === 'loading' && <p className="mt-3 text-sm text-[var(--color-muted)]">Loading…</p>}
      {subsStatus === 'ready' && subs.length === 0 && <p className="mt-3 text-sm text-[var(--color-muted)]">No recurring GameVault billing plans.</p>}
      <ul className="mt-3 space-y-2">
        {subs.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-sm">
            <div className="min-w-[200px] flex-1">
              <p className="font-bold">{s.planName} <Badge tone={s.status === 'active' ? 'success' : 'warning'}>{s.status}{s.cancelAtPeriodEnd ? ' · cancels at period end' : ''}</Badge></p>
              <p className="text-xs text-[var(--color-muted)]">{s.interval === 'year' ? 'Yearly' : 'Monthly'}{s.currentPeriodEnd ? ` · paid through ${new Date(s.currentPeriodEnd).toLocaleDateString()}` : ''}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Library() {
  const [orders, setOrders] = useState([])
  const { ordersVersion } = useOrders()
  useEffect(() => { getOrders().then(setOrders).catch(() => setOrders([])) }, [ordersVersion])

  const allocationsList = orders.flatMap((o) =>
    (o.items || []).flatMap((it) =>
      (it.allocations && it.allocations.length > 0)
        ? it.allocations.map((alloc) => ({
            allocation: alloc,
            orderId: o.id,
            itemId: it.id,
            productTitle: it.productTitle,
            platform: it.variantLabel,
          }))
        : (it.codes || []).map((c, idx) => ({
            allocation: {
              id: `${o.id}-${it.id}-${idx}`,
              code: c,
              isRevealed: true,
              revealedAt: o.paidAt || o.date,
            },
            orderId: o.id,
            itemId: it.id,
            productTitle: it.productTitle,
            platform: it.variantLabel,
          }))
    )
  )

  if (!allocationsList.length) {
    return (
      <div className="card p-5">
        <EmptyState
          title="Your Key Vault is empty"
          hint="Purchased game keys and activation codes appear here. Digital keys are securely masked until revealed."
          action={<Button to="/games">Explore Game Keys</Button>}
        />
      </div>
    )
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--color-text)]">
            Digital Key Vault <span className="ml-2 rounded-full bg-[var(--color-cyan)]/10 px-2.5 py-0.5 text-xs font-semibold text-[var(--color-cyan)]">{allocationsList.length} Items</span>
          </h2>
          <p className="mt-1 text-xs text-[var(--color-muted)]">
            Manage and reveal your purchased activation keys. Unrevealed keys are masked for security and chargeback protection.
          </p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {allocationsList.map((item) => (
          <KeyRevealCard
            key={item.allocation.id}
            orderId={item.orderId}
            itemId={item.itemId}
            allocation={item.allocation}
            productTitle={item.productTitle}
            platform={item.platform}
            onRevealed={() => getOrders().then(setOrders)}
          />
        ))}
      </div>
    </div>
  )
}

export function WishlistTab() {
  const { ids } = useWishlist()
  const [products, setProducts] = useState([])
  useEffect(() => { getProducts().then(setProducts) }, [])
  const items = products.filter((p) => ids.includes(p.id))
  if (!items.length) return <div className="card p-5"><EmptyState title="Wishlist is empty" hint="Tap the heart on any product to save it here. It persists across visits." action={<Button to="/games">Discover games</Button>} /></div>
  return (
    <div>
      <h2 className="mb-3 text-xl font-extrabold">Wishlist ({items.length})</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
    </div>
  )
}

export function SettingsTab() {
  const { user, refresh, logout } = useSession()
  const { notify } = useToast()
  const [f, setF] = useState({ name: user?.name || '', country: user?.country || '' })
  useEffect(() => { setF({ name: user?.name || '', country: user?.country || '' }) }, [user])
  return (
    <div className="space-y-4">
      <form className="card grid gap-3 p-5 sm:grid-cols-2" onSubmit={async (e) => {
        e.preventDefault()
        if (f.name.trim().length < 2) return notify('Enter your display name.', 'error')
        try {
          await apiPost('/api/me', { name: f.name.trim(), country: f.country.trim() })
          await refresh()
          notify('Profile updated.', 'success')
        } catch (err) {
          notify(err.message || 'Update failed.', 'error')
        }
      }}>
        <h2 className="font-extrabold sm:col-span-2">Profile Settings</h2>
        <Field label="Display name" htmlFor="s-name"><input id="s-name" className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Country" htmlFor="s-country"><input id="s-country" className="input" value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })} /></Field>
        <p className="text-sm text-[var(--color-muted)] sm:col-span-2">Email (login): <strong className="text-white">{user?.email}</strong></p>
        <div className="sm:col-span-2"><button className="btn-primary px-5 py-2.5 text-sm">Save changes</button></div>
      </form>
      <section className="card p-5" aria-label="Payment methods">
        <h2 className="font-extrabold">Payment Methods <Badge tone="muted">Stripe-hosted</Badge></h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">Cards are managed inside Stripe Checkout / the Customer Portal. GameVault never sees or stores card numbers.</p>
      </section>
      <section className="card p-5">
        <h2 className="font-extrabold">Local data</h2>
        <div className="mt-2 flex flex-wrap gap-2">
          <button onClick={() => { resetDemoData(); notify('Local cart/wishlist cleared.', 'success') }} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">Clear local cart & wishlist</button>
          <button onClick={() => logout()} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm">Sign out</button>
        </div>
      </section>
    </div>
  )
}

export function NotificationsTab() {
  const testMode = useStripeMode() === 'test-mode'
  const notes = [
    testMode
      ? { t: 'Test-mode payments', s: 'Use card 4242 4242 4242 4242 on Stripe Checkout. No real charges.' }
      : { t: 'Payments by Stripe', s: 'Card payments are processed securely on Stripe-hosted pages.' },
    { t: 'Order updates come from webhooks', s: 'The success page polls your order until Stripe confirms.' },
    { t: 'Manage billing in the portal', s: 'Account → Subscriptions → Manage subscription.' },
  ]
  return (
    <div className="card p-5">
      <h2 className="font-extrabold">Notifications</h2>
      <ul className="mt-3 space-y-2">
        {notes.map((n) => <li key={n.t} className="rounded-xl border border-[var(--color-border)] p-3 text-sm"><p className="font-bold">{n.t}</p><p className="text-xs text-[var(--color-muted)]">{n.s}</p></li>)}
      </ul>
    </div>
  )
}

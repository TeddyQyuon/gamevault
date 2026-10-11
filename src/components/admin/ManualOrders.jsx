import { useEffect, useState } from 'react'
import { apiGet, apiPost } from '../../services/api.js'
import { formatPrice } from '../../utils/format.js'

export default function ManualOrders() {
  const [status, setStatus] = useState('pending')
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ orders: [], total: 0 })
  const [ready, setReady] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState('')
  const [now, setNow] = useState(Date.now())
  async function refresh() {
    try { setData(await apiGet(`/api/admin/orders?status=${status}&page=${page}`)); setError('') }
    catch (err) { setError(err.message) }
  }
  useEffect(() => { apiGet('/api/admin/readiness').then(setReady).catch(err => setError(err.message)) }, [])
  useEffect(() => {
    let alive = true
    async function poll() {
      try { const result = await apiGet(`/api/admin/orders?status=${status}&page=${page}`); if (alive) { setData(result); setError(''); setNow(Date.now()) } }
      catch (err) { if (alive) setError(err.message) }
    }
    poll()
    const timer = setInterval(poll, 30000)
    return () => { alive = false; clearInterval(timer) }
  }, [status, page])
  async function delivered(order) {
    setBusy(order.id)
    try { await apiPost(`/api/admin/orders/${encodeURIComponent(order.id)}/delivered`, {}); setConfirm(''); await refresh() }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }
  return <section id="paid-orders" className="card mt-4 scroll-mt-4 p-5" aria-label="Paid orders for email delivery">
    <h2 className="text-xl font-extrabold">Paid orders · Email delivery</h2>
    <p className="mt-1 text-sm text-[var(--color-muted)]">Email the subscription details and instructions within 1 hour after payment. Mark delivered after you send the email.</p>
    {ready && <div className="mt-3 rounded-xl border p-4 text-sm" role="status">
      <h3 className="font-bold">Launch setup</h3>
      <ul className="mt-2 space-y-2">
        <li>{ready.publishedOffers ? `${ready.publishedOffers} offers published.` : 'Publish your offers below to add products to the shop.'}</li>
        <li>{ready.paymentsConfigured ? 'Stripe key configured.' : 'Add your Stripe key to server/.env.'}</li>
        <li>{ready.webhookConfigured ? 'Webhook signing secret configured.' : 'Register the Stripe webhook endpoint, then put its signing secret in STRIPE_WEBHOOK_SECRET in server/.env and restart the API.'}</li>
        <li>{ready.publicHttps ? `Public store URL: ${ready.clientUrl}` : 'Set CLIENT_URL to your public HTTPS domain when deploying. The current URL is local.'}</li>
        {ready.webhookUrl && <li className="break-all">Webhook endpoint: <code>{ready.webhookUrl}</code></li>}
      </ul>
      <p className="mt-3 text-xs text-[var(--color-muted)]">These checks confirm saved settings. Confirm a successful payment and signed webhook before opening sales.</p>
      <a className="mt-2 inline-block underline" href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noreferrer">Open Stripe webhooks</a>
    </div>}
    <div className="mt-4 flex items-center gap-3"><label>Status <select className="input" value={status} onChange={e => { setStatus(e.target.value); setPage(1) }}><option value="pending">Awaiting email</option><option value="delivered">Delivered</option><option value="all">All paid orders</option></select></label><button className="underline text-sm" onClick={refresh}>Refresh</button></div>
    {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
    <div className="mt-4 space-y-3">{data.orders.map(order => {
      const waiting = order.items.filter(item => !item.deliveredAt)
      const due = waiting.map(item => item.dueAt).filter(Boolean).sort()[0]
      const overdue = due && new Date(due).getTime() < now
      const body = `Hi ${order.contactName || 'there'},\n\nThank you for order ${order.id}.\n\n${order.items.map(item => `${item.title} — ${item.label} × ${item.qty}\nRegion: ${item.region}\nSubscription details: [add details]\nActivation instructions: [add instructions]`).join('\n\n')}\n\nGameVault`
      const compose = `mailto:${encodeURIComponent(order.contactEmail)}?subject=${encodeURIComponent(`Your GameVault order ${order.id}`)}&body=${encodeURIComponent(body)}`
      return <article key={order.id} className="rounded-xl border p-4">
        <div className="flex flex-wrap justify-between gap-2"><strong>{order.id} · {formatPrice(order.totalCents)} {order.currency}</strong><span className={overdue ? 'font-bold text-red-700' : 'text-sm'}>{waiting.length ? (due ? `${overdue ? 'Overdue · ' : 'Due '}${new Date(due).toLocaleString()}` : 'Awaiting email') : 'Delivered'}</span></div>
        <p className="mt-1 text-sm">{order.contactName} · <a className="underline" href={compose}>{order.contactEmail}</a> · {order.contactCountry}</p>
        <ul className="mt-3 text-sm">{order.items.map(item => <li key={item.id}>{item.title} — {item.label} × {item.qty} · {item.region} {item.deliveredAt ? `· Sent ${new Date(item.deliveredAt).toLocaleString()}` : ''}</li>)}</ul>
        {!!waiting.length && <div className="mt-3 flex flex-wrap items-center gap-3"><a href={compose} className="btn-primary px-4 py-2 text-sm">Compose customer email</a><button className="underline text-sm" onClick={async () => { try { await navigator.clipboard.writeText(order.contactEmail) } catch { setError('Copy the email address shown above.') } }}>Copy email</button>{confirm === order.id ? <><span className="text-sm">Email sent to the customer?</span><button disabled={busy === order.id} className="btn-primary px-4 py-2 text-sm" onClick={() => delivered(order)}>{busy === order.id ? 'Saving…' : 'Yes, mark delivered'}</button><button className="underline text-sm" onClick={() => setConfirm('')}>Cancel</button></> : <button className="underline text-sm" onClick={() => setConfirm(order.id)}>Mark delivered</button>}</div>}
      </article>
    })}{!data.orders.length && !error && <p className="text-sm text-[var(--color-muted)]">No {status === 'pending' ? 'paid orders awaiting email' : 'orders in this view'}.</p>}</div>
    {data.total > 30 && <div className="mt-3 flex items-center gap-3"><button disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button><span>Page {page} of {Math.ceil(data.total / 30)}</span><button disabled={page * 30 >= data.total} onClick={() => setPage(p => p + 1)}>Next</button></div>}
  </section>
}

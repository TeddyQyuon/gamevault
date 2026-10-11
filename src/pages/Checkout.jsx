import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useSession, useStripeMode } from '../context/SessionContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Breadcrumbs, Field } from '../components/ui/controls.jsx'
import { EmptyState } from '../components/ui/feedback.jsx'
import OrderSummary from '../components/cart/OrderSummary.jsx'
import { findVariant, variantBilling } from '../data/products.js'
import {
  cartTotals, validatePromo,
  createOneTimeSession, createSubscriptionSession,
} from '../services/orderService.js'
import { apiGet } from '../services/api.js'
import { formatPrice } from '../utils/format.js'

// Order-REVIEW page. No card fields live here — Stripe Checkout collects
// payment details after we redirect. Displayed numbers are local estimates;
// the server reprices authoritatively and Stripe charges that total.
export default function Checkout() {
  // NOTE: the cart is intentionally NOT cleared here — only the success page
  // removes purchased lines after the backend confirms payment.
  const { lines, ready } = useCart()
  const { status, profile } = useSession()
  const { notify } = useToast()
  // Fail-safe: test wording ONLY when test-mode is confirmed (see hook).
  const testMode = useStripeMode() === 'test-mode'

  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', country: 'Singapore' })
  const [errors, setErrors] = useState({})
  const [promo, setPromo] = useState('')
  const [applied, setApplied] = useState('')
  const [serverQuote, setServerQuote] = useState(null)
  const [paymentsReady, setPaymentsReady] = useState(null)
  useEffect(() => { apiGet('/api/health').then(data => setPaymentsReady(Boolean(data.checkoutReady))).catch(() => setPaymentsReady(false)) }, [])
  const [busy, setBusy] = useState(null) // null | 'once' | variantId

  useEffect(() => {
    if (status === 'authed') {
      setForm((f) => ({
        firstName: f.firstName || profile.firstName,
        lastName: f.lastName || profile.lastName,
        email: f.email || profile.email,
        country: f.country || profile.country,
      }))
    }
  }, [status, profile])

  // Partition: one-time lines pay together; each recurring plan pays alone.
  const { oneTime, recurring } = useMemo(() => {
    const once = []
    const recur = []
    for (const l of lines) {
      const found = findVariant(l.variantId)
      if (!found) continue
      const entry = { ...l, product: found.product, variant: found.variant }
      if (variantBilling(found.variant) === 'recurring') recur.push(entry)
      else once.push(entry)
    }
    return { oneTime: once, recurring: recur }
  }, [lines, ready])

  const estimate = useMemo(
    () => cartTotals(oneTime.map((l) => ({ variantId: l.variantId, qty: l.qty }))),
    [oneTime],
  )
  const cartSignature = JSON.stringify(oneTime.map(line => [line.variantId, line.qty, line.variant.priceCents]))
  const shown = serverQuote && serverQuote.promo === applied && serverQuote.cartSignature === cartSignature
    ? { subtotal: serverQuote.subtotalCents, discount: serverQuote.discountCents, total: serverQuote.totalCents }
    : { subtotal: estimate.subtotal, discount: estimate.discount, total: estimate.total }

  useEffect(() => {
    if (serverQuote && serverQuote.cartSignature !== cartSignature) {
      setServerQuote(null)
      setApplied('')
    }
  }, [cartSignature, serverQuote])

  if (!ready) return <p role="status" className="card p-8">Loading checkout…</p>
  if (!lines.length) {
    return (
      <div>
        <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]} />
        <EmptyState title="Nothing to check out" hint="Your cart is empty. Add a product first." action={<Link to="/subscriptions" className="btn-primary px-4 py-2.5 text-sm">Browse subscriptions</Link>} />
      </div>
    )
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  function validateContact() {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'First name is required.'
    if (!form.lastName.trim()) e.lastName = 'Last name is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) e.email = 'Enter a valid email address.'
    if (!form.country.trim()) e.country = 'Country is required.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function applyPromoCode() {
    if (!oneTime.length) return notify('Promo codes apply to one-time items only.', 'error')
    try {
      const q = await validatePromo(oneTime.map((l) => ({ variantId: l.variantId, qty: l.qty })), promo)
      if (!q.ok) return notify(q.message, 'error')
      setApplied(promo.trim().toUpperCase())
      setServerQuote({ ...q, promo: promo.trim().toUpperCase(), cartSignature })
      notify(q.message, 'success')
    } catch (err) {
      notify(err.message || 'Could not validate the promo.', 'error')
    }
  }

  async function payOnce() {
    if (busy) return
    if (!validateContact()) return notify('Please fix the highlighted fields.', 'error')
    setBusy('once')
    try {
      const { url } = await createOneTimeSession({
        items: oneTime.map((l) => ({ variantId: l.variantId, qty: l.qty })),
        promoCode: applied,
        contact: form,
      })
      window.location.href = url // Stripe-hosted Checkout
    } catch (err) {
      notify(friendly(err), 'error')
      setBusy(null)
    }
  }

  async function subscribeOne(entry) {
    if (busy) return
    if (!validateContact()) return notify('Please fix the highlighted fields.', 'error')
    setBusy(entry.variantId)
    try {
      const { url } = await createSubscriptionSession({ variantId: entry.variantId, contact: form })
      window.location.href = url
    } catch (err) {
      notify(friendly(err), 'error')
      setBusy(null)
    }
  }

  return (
    <div>
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]} />
      <h1 className="text-3xl font-extrabold md:text-4xl">Secure <span className="gradient-text">Checkout</span></h1>
      <p className="mt-1 rounded-lg bg-[#2855FF]/10 p-2.5 text-sm font-semibold text-[#2454a7]">
        {testMode
          ? 'Test mode — you pay on Stripe-hosted Checkout (card 4242 4242 4242 4242). No real charges. We never see or store card numbers.'
          : 'You pay on Stripe-hosted Checkout. You will be charged the total shown. We never see or store card numbers.'}
      </p>

      <ol className="mt-4 flex flex-wrap items-center gap-2 text-sm" aria-label="Checkout steps">
        {['Review', 'Secure payment', 'Confirmation'].map((s, i) => (
          <li key={s} className={`rounded-full border px-3 py-1.5 font-semibold ${i === 0 ? 'border-transparent bg-[#2855FF] text-white' : 'border-[var(--color-border)] text-[var(--color-muted)]'}`}>{i + 1}. {s}</li>
        ))}
      </ol>

      {status !== 'authed' && (
        <p className="card mt-4 p-4 text-sm" role="note">
          Checking out as <strong>guest</strong> — no account needed. Subscription details are delivered to the email you enter.{' '}
          <span className="text-[var(--color-muted)]">Want order history in one place? <Link to="/login?next=/checkout" className="font-bold text-[#2454a7] hover:underline">Log in</Link> or <Link to="/register?next=/checkout" className="underline">create an account</Link> (optional).</span>
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.4fr_.9fr]">
        <div className="space-y-4">
          <section className="card p-5" aria-label="Contact details">
            <h2 className="font-extrabold">Contact Details</h2>
            <p className="text-xs text-[var(--color-muted)]">Use your correct email address for subscription delivery. Subscription details arrive within 1 hour after confirmed payment.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Field label="First Name *" error={errors.firstName} htmlFor="co-first"><input id="co-first" className="input" aria-invalid={!!errors.firstName} value={form.firstName} onChange={set('firstName')} autoComplete="given-name" /></Field>
              <Field label="Last Name *" error={errors.lastName} htmlFor="co-last"><input id="co-last" className="input" aria-invalid={!!errors.lastName} value={form.lastName} onChange={set('lastName')} autoComplete="family-name" /></Field>
              <Field label="Email Address *" error={errors.email} htmlFor="co-email"><input id="co-email" type="email" className="input" aria-invalid={!!errors.email} value={form.email} onChange={set('email')} autoComplete="email" /></Field>
              <Field label="Country / Region *" error={errors.country} htmlFor="co-country">
                <input id="co-country" className="input" value={form.country} onChange={set('country')} autoComplete="country-name" aria-invalid={!!errors.country} maxLength={80} />
              </Field>
            </div>
          </section>

          {recurring.length > 0 && (
            <section className="card border-[#fbbf24]/40 p-5" aria-label="Subscriptions check out separately">
              <h2 className="font-extrabold">Subscriptions check out separately</h2>
              <p className="text-sm text-[var(--color-muted)]">
                Recurring plans use Stripe <em>subscription</em> Checkout — one plan at a time. Buying a plan here never touches your other cart items.
              </p>
              <ul className="mt-3 space-y-2">
                {recurring.map((l) => (
                  <li key={l.variantId} className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] p-3 text-sm">
                    <div className="min-w-[180px] flex-1">
                      <p className="font-bold">{l.product.title}</p>
                      <p className="text-xs text-[var(--color-muted)]">{l.variant.label} · {l.variant.interval === 'year' ? 'billed yearly' : 'billed monthly'} · genuine recurring billing{testMode ? ' (test mode)' : ''}</p>
                    </div>
                    <span className="font-bold">{formatPrice(l.variant.priceCents)}</span>
                    <button onClick={() => subscribeOne(l)} disabled={busy !== null || paymentsReady !== true} className="btn-primary px-4 py-2.5 text-sm disabled:opacity-50">
                      {busy === l.variantId ? 'Starting…' : 'Subscribe separately'}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {oneTime.length > 0 && (
            <section className="card p-5" aria-label="Membership and activation requirements">
              <h2 className="font-extrabold">Review your offers</h2>
              <ul className="mt-3 space-y-3 text-sm">{oneTime.map(line => <li key={line.variantId} className="rounded-xl border p-3">
                <Link to={`/products/${line.product.slug}`} className="font-bold underline">{line.product.title}</Link>
                <p className="mt-1">{line.variant.label} · Quantity {line.qty}</p>
                <p className="mt-1"><strong>Supported region:</strong> {line.product.regions.join(', ')}</p>
                <p className="mt-1"><strong>Account requirements:</strong> {line.product.requirements}</p>
              </li>)}</ul>
            </section>
          )}

          {oneTime.length > 0 && (
            <section className="card p-5" aria-label="Promo code">
              <h2 className="font-extrabold">Promo Code</h2>
              <div className="mt-2 flex gap-2">
                <label htmlFor="promo" className="sr-only">Promo code</label>
                <input id="promo" className="input" placeholder="Enter promo code" value={promo} onChange={(e) => { setPromo(e.target.value); setServerQuote(null) }} disabled={!!applied} />
                {applied ? (
                  <button type="button" onClick={() => { setApplied(''); setPromo(''); setServerQuote(null) }} className="shrink-0 rounded-[10px] border border-[var(--color-border)] px-4 text-sm font-semibold">Remove</button>
                ) : (
                  <button type="button" onClick={applyPromoCode} className="btn-primary shrink-0 px-5 text-sm">Apply</button>
                )}
              </div>
            </section>
          )}
        </div>

        <div className="space-y-3">
          {oneTime.length > 0 && (
            <>
              <OrderSummary
                priced={estimate.priced} subtotal={shown.subtotal} discount={shown.discount} total={shown.total}
                promoMessage={applied ? `${applied} validated by the server.` : ''}
              />
              <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-3.5 text-xs leading-relaxed text-[#166534]">
                <strong>⚡ Delivery Notice:</strong> Your subscription details &amp; instructions will be emailed to <strong>{form.email || 'the email address you enter'}</strong> within 1 hour after confirmed payment.
              </div>
              {paymentsReady === false && <p role="status" className="text-sm text-[var(--color-muted)]">Payments are temporarily unavailable. Please try again later.</p>}
              <button onClick={payOnce} disabled={busy !== null || paymentsReady !== true} className="btn-primary flex w-full items-center justify-center gap-2 px-4 py-3.5 text-sm font-bold shadow-lg shadow-[#ff5a00]/20 disabled:opacity-50">
                <Lock size={15} aria-hidden /> {busy === 'once' ? 'Starting secure payment…' : `Continue to secure payment · ${formatPrice(shown.total)}`}
              </button>
              <div className="flex items-center justify-center gap-2 pt-1 opacity-90">
                <img src="/assets/storefront/visa.svg" alt="Visa" width="34" height="22" />
                <img src="/assets/storefront/mastercard.svg" alt="Mastercard" width="34" height="22" />
                <img src="/assets/storefront/apple-pay.svg" alt="Apple Pay" width="34" height="22" />
                <img src="/assets/storefront/google-pay.svg" alt="Google Pay" width="34" height="22" />
                <img src="/assets/storefront/stripe.svg" alt="Stripe" width="44" height="18" />
              </div>
              <p className="text-center text-xs text-[var(--color-muted)]">
                Redirects to Stripe. 256-bit SSL encrypted checkout.
              </p>
            </>
          )}
          {oneTime.length === 0 && recurring.length > 0 && (
            <div className="card p-5 text-sm text-[var(--color-muted)]">Your cart holds subscription plan(s) only — use “Subscribe separately” above. Your cart stays intact either way.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function friendly(err) {
  if (!err) return 'Checkout failed. Please try again.'
  if (err.code === 'NETWORK_ERROR') return err.message
  if (err.code === 'MIXED_CART') return err.message
  if (err.code === 'SERVICE_UNAVAILABLE') return 'Payments are temporarily unavailable. Please try again later.'
  if (err.code === 'UNAUTHENTICATED') return 'Your session expired — you can still check out as guest, just try again.'
  return err.message || 'Checkout failed. Please try again.'
}

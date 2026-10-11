import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { apiPost } from '../../services/api.js'

export default function ContactSupport() {
  const [params] = useSearchParams()
  const [form, setForm] = useState({ name: '', email: '', orderReference: (params.get('order') || '').slice(0, 32), topic: 'delivery', message: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [reference, setReference] = useState('')
  const change = key => event => setForm(current => ({ ...current, [key]: event.target.value }))
  async function submit(event) {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try { const result = await apiPost('/api/support/requests', form); setReference(result.reference); setForm(current => ({ ...current, message: '' })) }
    catch (err) { setError(err.message || 'Could not send your message. Please try again.') }
    finally { setBusy(false) }
  }
  return <section id="contact-support" className="card p-6" aria-label="Contact support">
    <h2 className="text-xl font-extrabold">Contact support</h2>
    <p className="mt-2 text-sm text-[var(--color-muted)]">Send us a message about your order or ask before purchasing. We’ll reply to the email you enter.</p>
    {reference ? <div role="status" className="mt-4 rounded-xl border border-green-300 bg-green-50 p-4 text-sm text-green-900">
      <p className="font-bold">Your message has been received</p><p className="mt-2 break-all">Reference: {reference}</p><p className="mt-2">Keep this reference and check your email for our reply.</p>
      <button type="button" className="mt-3 underline" onClick={() => setReference('')}>Send another message</button>
    </div> : <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-sm font-semibold" htmlFor="help-name">Name<input id="help-name" className="input mt-1" autoComplete="name" required maxLength={100} value={form.name} onChange={change('name')} /></label>
      <label className="block text-sm font-semibold" htmlFor="help-email">Email<input id="help-email" className="input mt-1" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={change('email')} /></label>
      <label className="block text-sm font-semibold" htmlFor="help-order">Order number (optional)<input id="help-order" className="input mt-1" maxLength={32} placeholder="GV-…" value={form.orderReference} onChange={change('orderReference')} /></label>
      <label className="block text-sm font-semibold" htmlFor="help-topic">Topic<select id="help-topic" className="input mt-1" value={form.topic} onChange={change('topic')}><option value="delivery">Email delivery</option><option value="payment">Payment</option><option value="activation">Activation help</option><option value="before_purchase">Before purchasing</option><option value="other">Other</option></select></label>
      <label className="block text-sm font-semibold" htmlFor="help-message">Message<textarea id="help-message" className="input mt-1 min-h-[130px]" required minLength={10} maxLength={4000} value={form.message} onChange={change('message')} aria-describedby="help-privacy" /></label>
      <p id="help-privacy" className="text-xs text-[var(--color-muted)]">Include the issue and your order number. Do not include passwords, activation codes, card numbers or private order links.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="btn-primary px-5 py-3 text-sm disabled:opacity-50">{busy ? 'Sending…' : 'Send message'}</button>
    </form>}
  </section>
}

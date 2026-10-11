import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SUBSCRIPTION_TEMPLATES } from '../../data/subscriptionServices.js'
import { SUBSCRIPTION_PRICES, PRICE_RESEARCH_DATE, PRICE_FX } from '../../data/subscriptionPrices.js'
import { apiPatch, apiPost } from '../../services/api.js'

export default function SubscriptionLaunch({ products, reload }) {
  const [edits, setEdits] = useState({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [failed, setFailed] = useState(false)
  const [shared, setShared] = useState({ region: '', eligibility: '' })
  const draft = (service, product) => edits[service.id] || { selected: false, price: ((product?.variants?.[0]?.priceCents ?? SUBSCRIPTION_PRICES[service.id].priceCents) / 100).toFixed(2), label: product?.variants?.[0]?.label || SUBSCRIPTION_PRICES[service.id].label, region: product?.region || '', eligibility: product?.eligibility || '' }
  function change(service, product, patch) { setEdits(current => ({ ...current, [service.id]: { ...draft(service, product), ...patch } })) }
  const selectedCount = Object.values(edits).filter(row => row.selected).length
  function selectAll(value) {
    setEdits(current => ({ ...current, ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.id, { ...draft(service, products.find(p => p.brand === service.brand && p.category === 'subscriptions')), selected: value }])) }))
  }
  function applyShared() {
    const patch = Object.fromEntries(Object.entries(shared).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]))
    if (!Object.keys(patch).length) { setFailed(true); setMessage('Enter shared requirements first.'); return }
    setEdits(current => Object.fromEntries(Object.entries(current).map(([id, row]) => [id, row.selected ? { ...row, ...patch } : row])))
    setFailed(false)
    setMessage('Terms applied to selected offers. Review each row, then save or publish.')
  }
  async function publish(event) {
    event.preventDefault()
    if (busy || !selectedCount) return
    const publishNow = event.nativeEvent.submitter?.value === 'publish'
    const invalid = SUBSCRIPTION_TEMPLATES.filter(service => {
      const product = products.find(p => p.brand === service.brand && p.category === 'subscriptions')
      const row = draft(service, product)
      const cents = Math.round(Number(row.price) * 100)
      return row.selected && (!Number.isSafeInteger(cents) || cents < 1 || cents > 10000000 || !row.label.trim() || row.label.length > 100 || row.region.length > 80 || row.eligibility.length > 2000 || ((publishNow || product?.publication === 'published') && (!row.region.trim() || !row.eligibility.trim())))
    })
    if (invalid.length) { setFailed(true); setMessage(`${invalid.map(service => service.label).join(', ')}: check price, membership term, region and account requirements. Nothing was saved.`); return }
    setBusy(true)
    setMessage('')
    const errors = []
    let count = 0
    for (const service of SUBSCRIPTION_TEMPLATES) {
      const product = products.find(p => p.brand === service.brand && p.category === 'subscriptions')
      const row = draft(service, product)
      if (!row.selected) continue
      const priceCents = Math.round(Number(row.price) * 100)
      try {
        const details = { brand: service.brand, region: row.region.trim(), eligibility: row.eligibility.trim(), artworkPath: service.artworkPath, artworkFit: 'contain', fulfilment: 'manual', availability: publishNow ? 'available' : (product?.availability || 'available'), publication: publishNow ? 'published' : (product?.publication || 'draft'), tagline: 'Email delivery within 1 hour after confirmed payment' }
        if (product) {
          if (!product.variants?.[0]) throw new Error('No membership variant exists.')
          await apiPatch(`/api/admin/products/${encodeURIComponent(product.id)}`, { ...details, variants: [{ variantId: product.variants[0].variantId, label: row.label.trim(), priceCents, active: publishNow ? true : product.variants[0].active, trackInventory: false }] })
        } else await apiPost('/api/admin/products', { ...details, title: service.title, category: 'subscriptions', label: row.label.trim(), priceCents, publishNow })
        count++
        setEdits(current => ({ ...current, [service.id]: { ...row, selected: false } }))
      } catch (error) { errors.push(`${service.label}: ${error.message}`) }
    }
    setFailed(Boolean(errors.length))
    setMessage(`${count} offer(s) ${publishNow ? 'published' : 'saved'}.${errors.length ? ' ' + errors.join(' ') : ''}`)
    try { await reload() } catch (error) { setFailed(true); setMessage(`Could not refresh the catalog: ${error.message}`) } finally { setBusy(false) }
  }
  return <section id="subscription-offers" className="card mt-4 scroll-mt-4 p-5" aria-label="Launch subscription offers">
    <h2 className="text-xl font-extrabold">Sell subscriptions</h2>
    <p className="mt-2 text-sm"><strong>{products.filter(p => p.category === 'subscriptions' && p.publication === 'published').length} published offers</strong> · <Link to="/subscriptions" className="underline">View storefront</Link></p>
    <p className="mt-1 text-sm text-[var(--color-muted)]">Set your selling prices and the actual regions and account requirements you support. Save your edits as you go, then publish the offers you can fulfill. No code inventory is required. You email customers within 1 hour after confirmed payment.</p>
    <details className="mt-2 text-xs text-[var(--color-muted)]"><summary className="cursor-pointer">Price research: {PRICE_RESEARCH_DATE}</summary><p className="mt-2">G2A account/key listings and official retail references are starter comparisons, not your supply costs. Review the delivery format and margin before publishing. USD converted at {PRICE_FX.usdToSgd} SGD on {PRICE_FX.date} (<a href={PRICE_FX.source} target="_blank" rel="noreferrer" className="underline">ECB reference</a>).</p></details>
    <form onSubmit={publish} noValidate>
      <fieldset disabled={busy} className="mt-4 min-w-0">
      <div className="flex flex-wrap gap-3 text-sm"><button type="button" className="underline" onClick={() => selectAll(true)}>Select all</button><button type="button" className="underline" onClick={() => selectAll(false)}>Clear selection</button><span>{selectedCount} selected</span></div>
      <details className="mt-3 rounded-xl border p-3 text-sm"><summary className="cursor-pointer font-bold">Apply shared delivery requirements</summary><p className="mt-2 text-xs text-[var(--color-muted)]">Apply only to services with matching terms. Blank fields keep existing values. Review each selected offer before publishing.</p><div className="mt-3 grid gap-3 md:grid-cols-2"><label htmlFor="shared-region">Supported countries<input id="shared-region" className="input mt-1" maxLength={80} value={shared.region} onChange={event => setShared(current => ({ ...current, region: event.target.value }))} /></label><label htmlFor="shared-eligibility">Account and activation requirements<input id="shared-eligibility" className="input mt-1" maxLength={2000} value={shared.eligibility} onChange={event => setShared(current => ({ ...current, eligibility: event.target.value }))} /></label></div><button type="button" disabled={!selectedCount} className="mt-3 underline disabled:opacity-50" onClick={applyShared}>Apply to selected offers</button></details>
      <div className="subscription-launch-table mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr><th scope="col">Sell</th><th scope="col">Service</th><th scope="col">Price SGD</th><th scope="col">Membership term</th><th scope="col">Supported region</th><th scope="col">Account requirements</th></tr></thead><tbody>
        {SUBSCRIPTION_TEMPLATES.map(service => {
          const product = products.find(p => p.brand === service.brand && p.category === 'subscriptions')
          const row = draft(service, product)
          const reference = SUBSCRIPTION_PRICES[service.id]
          return <tr key={service.id}>
            <td><input aria-label={`Select ${service.label}`} type="checkbox" checked={row.selected} onChange={e => change(service, product, { selected: e.target.checked })} /></td>
            <td><div className="flex items-center gap-2"><img src={service.icon} alt="" style={{ width: 44, height: 44, objectFit: service.tone === 'playstation' ? 'cover' : 'contain', objectPosition: 'left center', padding: service.tone === 'playstation' ? 0 : 6, borderRadius: 10, background: service.background }} /><strong>{service.label}</strong></div><small>{product?.publication === 'published' ? 'Published' : 'Ready to review'} · <a className="underline" href={reference.source} target="_blank" rel="noreferrer">{reference.format} reference</a></small><small className="block text-[var(--color-muted)]">{reference.region}</small></td>
            <td><input aria-label={`${service.label} price SGD`} className="input" style={{ width: 110 }} type="number" min="0.01" max="100000" step="0.01" required={row.selected} value={row.price} onChange={e => change(service, product, { price: e.target.value })} /></td>
            <td><input aria-label={`${service.label} membership term`} className="input" style={{ minWidth: 180 }} maxLength={100} required={row.selected} value={row.label} onChange={e => change(service, product, { label: e.target.value })} /></td>
            <td><input aria-label={`${service.label} supported region`} className="input" style={{ minWidth: 160 }} maxLength={80} required={row.selected} placeholder="Countries you support" value={row.region} onChange={e => change(service, product, { region: e.target.value })} /></td>
            <td><input aria-label={`${service.label} account requirements`} className="input" style={{ minWidth: 240 }} maxLength={2000} required={row.selected} placeholder="New account, existing account, etc." value={row.eligibility} onChange={e => change(service, product, { eligibility: e.target.value })} /></td>
          </tr>
        })}
      </tbody></table></div>
      <div className="mt-4 flex flex-wrap gap-3"><button type="submit" name="action" value="save" className="rounded-xl border px-5 py-3 text-sm font-bold disabled:opacity-50" disabled={!selectedCount}>Save selected edits</button><button type="submit" name="action" value="publish" className="btn-primary px-5 py-3 text-sm disabled:opacity-50" disabled={!selectedCount}>{busy ? 'Saving…' : 'Publish selected offers'}</button></div>
      </fieldset>
      {message && <p role={failed ? 'alert' : 'status'} className={`mt-3 text-sm ${failed ? 'text-red-700' : 'text-green-800'}`}>{message}</p>}
    </form>
  </section>
}

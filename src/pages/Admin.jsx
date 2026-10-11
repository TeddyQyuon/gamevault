import { useEffect, useMemo, useState } from 'react'
import { useToast } from '../context/ToastContext.jsx'
import { Breadcrumbs, Field } from '../components/ui/controls.jsx'
import { apiGet, apiPost, apiPatch } from '../services/api.js'
import { invalidateCatalogue } from '../services/catalogService.js'
import ManualOrders from '../components/admin/ManualOrders.jsx'
import SubscriptionLaunch from '../components/admin/SubscriptionLaunch.jsx'
import SupportInbox from '../components/admin/SupportInbox.jsx'
import { SUBSCRIPTION_PRICES } from '../data/subscriptionPrices.js'
import { SUBSCRIPTION_TEMPLATES } from '../data/subscriptionServices.js'

// Staff console: real-code inventory import + catalogue workflow for go-live.
// Gated server-side (403 for non-admins); this page only renders the UI.
const CATEGORIES = ['streaming', 'music', 'gaming-membership', 'gift-cards', 'game-keys', 'mobile-topup', 'software', 'games', 'subscriptions']
const FULFILMENTS = ['code_inventory', 'supplier', 'manual', 'demo_test']
const PUBLICATIONS = ['draft', 'published', 'archived']
const AVAILABILITIES = ['available', 'out_of_stock', 'coming_soon']

export default function Admin() {
  const { notify } = useToast()
  const [gate, setGate] = useState('checking') // checking|ok|denied
  const [products, setProducts] = useState([])
  const [drafts, setDrafts] = useState({})
  const [saving, setSaving] = useState('')

  const [variantId, setVariantId] = useState('')
  const [codes, setCodes] = useState('')
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)

  const emptyProduct = { templateId: '', title: '', brand: '', category: 'subscriptions', price: '', fulfilment: 'manual', publishNow: true, label: '', region: '', artworkPath: '', artworkFit: 'contain', eligibility: '' }
  const [np, setNp] = useState(emptyProduct)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    apiGet('/api/admin/me')
      .then(() => setGate('ok'))
      .catch(() => setGate('denied'))
  }, [])

  async function load() {
    invalidateCatalogue()
    try {
      const d = await apiGet('/api/admin/products')
      setProducts(d.products || [])
    } catch (err) {
      notify(err.message || 'Could not load catalogue.', 'error')
    }
  }

  useEffect(() => { if (gate === 'ok') load() }, [gate])

  const variants = useMemo(
    () => products.flatMap((p) => (p.variants || []).map((v) => ({ ...v, productTitle: p.title, fulfilment: p.fulfilment }))),
    [products],
  )
  const importable = variants.filter((v) => v.fulfilment === 'code_inventory')

  function draftFor(p) {
    return drafts[p.id] || { publication: p.publication, availability: p.availability, fulfilment: p.fulfilment, brand: p.brand || '', region: p.region || '', artworkPath: p.artworkPath || '', artworkFit: p.artworkFit || 'contain', eligibility: p.eligibility || '', variants: Object.fromEntries(p.variants.map((v) => [v.variantId, { trackInventory: v.trackInventory, active: v.active, priceCents: v.priceCents, label: v.label }])) }
  }
  const setDraft = (p, patch) => setDrafts((d) => ({ ...d, [p.id]: { ...draftFor(p), ...patch } }))
  const setVariantDraft = (p, vid, patch) => {
    const cur = draftFor(p)
    setDraft(p, { variants: { ...cur.variants, [vid]: { ...cur.variants[vid], ...patch } } })
  }

  async function saveProduct(p) {
    const d = draftFor(p)
    setSaving(p.id)
    try {
      await apiPatch(`/api/admin/products/${encodeURIComponent(p.id)}`, {
        publication: d.publication, availability: d.availability, fulfilment: d.fulfilment,
        brand: d.brand, region: d.region, artworkPath: d.artworkPath, artworkFit: d.artworkFit, eligibility: d.eligibility,
        variants: Object.entries(d.variants).map(([variantId, v]) => {
          const { priceCents, ...otherFields } = v
          return { variantId, ...otherFields, ...(Number(priceCents) > 0 ? { priceCents } : {}) }
        }),
      })
      notify(`${p.title} updated.`, 'success')
      setDrafts((x) => { const n = { ...x }; delete n[p.id]; return n })
      load()
    } catch (err) {
      notify(err.message || 'Save failed.', 'error')
    } finally {
      setSaving('')
    }
  }

  async function runPreview() {
    if (!variantId) return notify('Choose a variant first.', 'error')
    setPreview(null)
    try {
      const r = await apiPost('/api/admin/inventory/preview', { variantId, text: codes })
      setPreview(r)
      if (r.valid === 0) notify('No valid codes found — check the format (one code per line).', 'error')
    } catch (err) {
      notify(err.message || 'Preview failed.', 'error')
    }
  }

  async function runConfirm() {
    if (!variantId || !codes.trim()) return notify('Choose a variant and paste codes.', 'error')
    setImporting(true)
    try {
      const r = await apiPost('/api/admin/inventory/confirm', { variantId, text: codes, filename: 'admin-paste.txt' })
      notify(`Imported ${r.imported} codes (${r.duplicates} duplicates skipped).`, 'success')
      setCodes('')
      setPreview(null)
      load()
    } catch (err) {
      notify(err.message || 'Import failed — nothing was written.', 'error')
    } finally {
      setImporting(false)
    }
  }

  async function createRealProduct(e) {
    e.preventDefault()
    const priceCents = Math.round(Number(np.price) * 100)
    if (np.title.trim().length < 3) return notify('Title must be at least 3 characters.', 'error')
    if (!Number.isInteger(priceCents) || priceCents < 1) return notify('Enter a valid price in dollars.', 'error')
    setCreating(true)
    try {
      const r = await apiPost('/api/admin/products', { ...np, title: np.title.trim(), priceCents })
      notify(`Created ${np.title.trim()} (${r.variantId}). ${np.publishNow && np.fulfilment === 'manual' ? 'Published and available.' : 'Saved as a draft.'}`, 'success')
      setNp(emptyProduct)
      load()
    } catch (err) {
      notify(err.message || 'Creation failed.', 'error')
    } finally {
      setCreating(false)
    }
  }

  function chooseSubscriptionTemplate(templateId) {
    const template = SUBSCRIPTION_TEMPLATES.find((item) => item.id === templateId)
    setNp((current) => template ? {
      ...current,
      templateId,
      title: template.title,
      brand: template.brand,
      category: 'subscriptions',
      price: (SUBSCRIPTION_PRICES[templateId].priceCents / 100).toFixed(2),
      label: SUBSCRIPTION_PRICES[templateId].label,
      fulfilment: 'manual',
      region: '',
      eligibility: '',
      artworkPath: template.artworkPath,
      artworkFit: template.artworkFit,
    } : { ...emptyProduct })
  }

  if (gate === 'checking') return <div><Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Staff' }]} /><p className="card p-8 text-center text-sm text-[var(--color-muted)]">Checking staff access…</p></div>
  if (gate === 'denied') {
    return (
      <div>
        <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Staff' }]} />
        <div className="card mx-auto max-w-md p-8 text-center">
          <h1 className="text-2xl font-extrabold">Staff only</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">This console requires an admin account. Ask an existing admin to promote you (<code className="rounded bg-black/5 px-1">npm run admin:promote -- you@example.com</code> on the server).</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: 'Staff console' }]} />
      <h1 className="text-3xl font-extrabold">Staff <span className="gradient-text">Console</span></h1>
      <nav aria-label="Staff sections" className="mt-4 flex flex-wrap gap-3 text-sm font-semibold"><a className="rounded-xl border px-4 py-2" href="#paid-orders">Paid orders</a><a className="rounded-xl border px-4 py-2" href="#subscription-offers">Subscription offers</a><a className="rounded-xl border px-4 py-2" href="#support-inbox">Support inbox</a></nav>
      <p className="mt-1 text-sm text-[var(--color-muted)]">Publish subscription offers, manage paid orders and reply to customers. Email subscription details within 1 hour after confirmed payment.</p>

      <ManualOrders />
      <SubscriptionLaunch products={products} reload={load} />
      <SupportInbox />
      <details className="card mt-4 p-5" aria-label="Import redeem codes"><summary className="cursor-pointer font-bold">Optional: import activation codes</summary>
        <h2 className="font-extrabold">Import redeem codes</h2>
        <p className="text-xs text-[var(--color-muted)]">One code per line, 4–128 chars, no spaces. Codes are encrypted at rest and never logged. Only <code className="rounded bg-black/5 px-1">code_inventory</code> variants accept imports.</p>
        <div className="mt-3 grid gap-3">
          <Field label="Variant" htmlFor="adm-variant">
            <select id="adm-variant" className="input" value={variantId} onChange={(e) => { setVariantId(e.target.value); setPreview(null) }}>
              <option value="">Choose a variant…</option>
              {importable.map((v) => <option key={v.variantId} value={v.variantId}>{v.productTitle} — {v.label} (available: {v.counts.available})</option>)}
            </select>
          </Field>
          <Field label="Codes (paste)" htmlFor="adm-codes">
            <textarea id="adm-codes" className="input min-h-[140px] font-mono text-xs" placeholder={'ABCD-1234-EFGH\nWXYZ-5678-IJKL'} value={codes} onChange={(e) => { setCodes(e.target.value); setPreview(null) }} />
          </Field>
          <Field label="Or choose a code file (.txt or .csv)" htmlFor="adm-file"><input id="adm-file" type="file" accept=".txt,.csv,text/plain,text/csv" className="input" onChange={async e => { const file=e.target.files?.[0]; if(!file)return; if(file.size>200000){notify('Choose a file under 200KB.','error');return} setPreview(null); setCodes(await file.text()) }}/></Field>
          <div className="flex flex-wrap gap-2">
            <button onClick={runPreview} className="rounded-[10px] border border-[var(--color-border)] px-4 py-2.5 text-sm font-semibold">Preview</button>
            <button onClick={runConfirm} disabled={importing || !preview?.valid} className="btn-primary px-5 text-sm disabled:opacity-50">{importing ? 'Importing…' : `Import ${preview?.valid || 0} codes`}</button>
          </div>
          {preview && (
            <div className="rounded-xl border border-[var(--color-border)] p-3 text-sm" role="status">
              <p>Total lines: <strong>{preview.total}</strong> · Valid new: <strong className="text-[#15803d]">{preview.valid}</strong> · Duplicates skipped: <strong>{preview.duplicateCount}</strong></p>
              {!!preview.errors?.length && (
                <ul className="mt-2 space-y-1 text-xs text-[#b91c1c]">
                  {preview.errors.slice(0, 8).map((er, i) => <li key={i}>Line {er.line}: {er.error} ({er.code})</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      </details>

      <section className="card mt-4 p-5" aria-label="New product">
        <h2 className="font-extrabold">New product</h2>
        <p className="text-xs text-[var(--color-muted)]">Choose a branded subscription starter or enter a custom product. Email-delivered products can be published immediately with your selling price and delivery requirements.</p>
        <form onSubmit={createRealProduct} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="Popular subscription template" htmlFor="np-template"><select id="np-template" className="input" value={np.templateId} onChange={(e) => chooseSubscriptionTemplate(e.target.value)}><option value="">Custom product</option>{SUBSCRIPTION_TEMPLATES.map((template) => <option key={template.id} value={template.id}>{template.title}</option>)}</select></Field>
          <Field label="Title *" htmlFor="np-title"><input id="np-title" className="input" value={np.title} onChange={(e) => setNp({ ...np, title: e.target.value })} /></Field>
          <Field label="Brand *" htmlFor="np-brand"><input id="np-brand" className="input" value={np.brand} onChange={(e) => setNp({ ...np, brand: e.target.value })} required={np.category === 'subscriptions'} /></Field>
          <Field label="Category" htmlFor="np-cat"><select id="np-cat" className="input" value={np.category} onChange={(e) => setNp({ ...np, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></Field>
          <Field label="Price (SGD $) *" htmlFor="np-price"><input id="np-price" className="input" inputMode="decimal" placeholder="25.00" value={np.price} onChange={(e) => setNp({ ...np, price: e.target.value })} /></Field>
          <Field label="Fulfilment" htmlFor="np-ful"><select id="np-ful" className="input" value={np.fulfilment} onChange={(e) => setNp({ ...np, fulfilment: e.target.value })}><option value="code_inventory">code_inventory (real codes)</option><option value="supplier">supplier</option><option value="manual">Email delivery within 1 hour</option></select></Field>
          <Field label="Membership term / denomination *" htmlFor="np-label"><input required id="np-label" className="input" placeholder="3 months · Premium" value={np.label} onChange={e=>setNp({...np,label:e.target.value})}/></Field>
          <Field label="Redemption region *" htmlFor="np-region"><input required id="np-region" className="input" placeholder="Singapore" value={np.region} onChange={e=>setNp({...np,region:e.target.value})}/></Field>
          <Field label="Product image URL or /assets/ path *" htmlFor="np-image"><input id="np-image" className="input" placeholder="https://…/product.jpg" value={np.artworkPath} onChange={e=>setNp({...np,artworkPath:e.target.value})} required={np.category === 'subscriptions'} /></Field>
          <Field label="Image display" htmlFor="np-fit"><select id="np-fit" className="input" value={np.artworkFit} onChange={e=>setNp({...np,artworkFit:e.target.value})}><option value="contain">Show full product image</option><option value="cover">Fill image area</option></select></Field>
          <Field label="Eligible accounts / redemption requirements *" htmlFor="np-eligibility"><input id="np-eligibility" className="input" placeholder="Use the supplier's verified terms" value={np.eligibility} onChange={e=>setNp({...np,eligibility:e.target.value})} required={np.category === 'subscriptions'} /></Field>
          <label className="sm:col-span-2 text-sm"><input type="checkbox" checked={np.publishNow} disabled={np.fulfilment !== 'manual'} onChange={e => setNp({ ...np, publishNow: e.target.checked })} /> Publish immediately</label>
          <div className="sm:col-span-2"><button className="btn-primary px-5 py-2.5 text-sm" disabled={creating}>{creating ? 'Creating…' : np.publishNow && np.fulfilment === 'manual' ? 'Create and publish offer' : 'Create draft product'}</button></div>
        </form>
      </section>

      <section className="card mt-4 p-5" aria-label="Catalogue workflow">
        <h2 className="font-extrabold">Catalogue workflow</h2>
        <p className="text-xs text-[var(--color-muted)]">Published, available email-delivered offers can be purchased without code inventory. Pause an offer whenever you cannot fulfill it.</p>
        <div className="mt-3 space-y-3">
          {products.map((p) => {
            const d = draftFor(p)
            return (
              <details key={p.id} className="rounded-xl border border-[var(--color-border)] p-3 text-sm">
                <summary className="cursor-pointer font-bold">{p.title} <span className="ml-2 text-xs font-normal text-[var(--color-muted)]">{p.publication} · {p.availability} · {p.fulfilment} · {p.variants.length} variant(s)</span></summary>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <label className="text-xs">Publication<select className="input mt-1" value={d.publication} onChange={(e) => setDraft(p, { publication: e.target.value })}>{PUBLICATIONS.map((o) => <option key={o}>{o}</option>)}</select></label>
                  <label className="text-xs">Availability<select className="input mt-1" value={d.availability} onChange={(e) => setDraft(p, { availability: e.target.value })}>{(d.fulfilment === 'manual' ? ['available', 'out_of_stock'] : AVAILABILITIES).map(o => <option key={o} value={o}>{d.fulfilment === 'manual' ? (o === 'available' ? 'Available' : 'Paused') : o}</option>)}</select></label>
                  <label className="text-xs">Fulfilment<select className="input mt-1" value={d.fulfilment} onChange={(e) => setDraft(p, { fulfilment: e.target.value })}>{FULFILMENTS.map((o) => <option key={o}>{o}</option>)}</select></label>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <label className="text-xs">Brand<input className="input mt-1" value={d.brand} onChange={e=>setDraft(p,{brand:e.target.value})}/></label>
                  <label className="text-xs">Redemption region<input className="input mt-1" value={d.region} onChange={e=>setDraft(p,{region:e.target.value})}/></label>
                  <label className="text-xs">Product image URL / path<input className="input mt-1" value={d.artworkPath} onChange={e=>setDraft(p,{artworkPath:e.target.value})}/></label>
                  <label className="text-xs">Image display<select className="input mt-1" value={d.artworkFit} onChange={e=>setDraft(p,{artworkFit:e.target.value})}><option value="contain">Show full image</option><option value="cover">Fill image area</option></select></label>
                  <label className="text-xs">Account eligibility<input className="input mt-1" value={d.eligibility} onChange={e=>setDraft(p,{eligibility:e.target.value})}/></label>
                </div>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {p.variants.map((v) => (
                    <li key={v.variantId} className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-white/[.03] px-2.5 py-1.5">
                      <span className="font-mono">{v.variantId}</span>
                      <label>Term / denomination<input className="input mt-1" value={d.variants[v.variantId]?.label || ''} onChange={e=>setVariantDraft(p,v.variantId,{label:e.target.value})}/></label>
                      <label>Price (SGD)<input type="number" min="0.01" step="0.01" className="input mt-1" value={d.variants[v.variantId]?.priceCents / 100} onChange={e=>setVariantDraft(p,v.variantId,{priceCents:Math.round(Number(e.target.value)*100)})}/></label>
                      <span className="text-[var(--color-muted)]">{d.fulfilment === 'manual' ? 'Email delivery within 1 hour' : `stock ${v.counts.available}a/${v.counts.reserved}r/${v.counts.delivered}d`}</span>
                      {d.fulfilment !== 'manual' && <label className="inline-flex items-center gap-1.5"><input type="checkbox" disabled={d.fulfilment === 'code_inventory'} checked={d.fulfilment === 'code_inventory' || Boolean(d.variants[v.variantId]?.trackInventory)} onChange={(e) => setVariantDraft(p, v.variantId, { trackInventory: e.target.checked })} /> track inventory</label>}
                      <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={Boolean(d.variants[v.variantId]?.active)} onChange={(e) => setVariantDraft(p, v.variantId, { active: e.target.checked })} /> active</label>
                    </li>
                  ))}
                </ul>
                <button onClick={() => saveProduct(p)} disabled={saving === p.id} className="btn-primary mt-2 px-4 py-2 text-xs disabled:opacity-50">{saving === p.id ? 'Saving…' : 'Save'}</button>
              </details>
            )
          })}
        </div>
      </section>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { apiGet, apiPatch } from '../../services/api.js'

export default function SupportInbox() {
  const [status, setStatus] = useState('open')
  const [page, setPage] = useState(1)
  const [reload, setReload] = useState(0)
  const [data, setData] = useState({ requests: [], total: 0, pageSize: 20 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('')
  useEffect(() => {
    let alive = true
    setLoading(true)
    const load = async () => {
      try { const result = await apiGet(`/api/admin/support?status=${status}&page=${page}`); if (alive) { setData(result); setError('') } }
      catch (err) { if (alive) setError(err.message) }
      finally { if (alive) setLoading(false) }
    }
    load()
    const timer = setInterval(load, 30000)
    return () => { alive = false; clearInterval(timer) }
  }, [status, page, reload])
  async function update(request) {
    setBusy(request.id)
    try { await apiPatch(`/api/admin/support/${encodeURIComponent(request.id)}`, { status: request.status === 'open' ? 'resolved' : 'open' }); setReload(value => value + 1) }
    catch (err) { setError(err.message) }
    finally { setBusy('') }
  }
  return <section id="support-inbox" className="card mt-4 scroll-mt-4 p-5" aria-label="Customer support inbox">
    <h2 className="text-xl font-extrabold">Customer support</h2>
    <p className="mt-1 text-sm text-[var(--color-muted)]">Messages submitted through Help & delivery. Reply by email, then mark resolved. Verify order ownership before sharing details.</p>
    <div className="mt-4 flex flex-wrap items-end gap-3"><label className="text-sm" htmlFor="inbox-status">Status<select id="inbox-status" className="input" value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option value="open">Open</option><option value="resolved">Resolved</option><option value="all">All messages</option></select></label><button className="underline text-sm" onClick={() => setReload(value => value + 1)}>Refresh</button></div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {loading ? <p role="status" className="mt-3 text-sm">Loading messages…</p> : <div className="mt-4 space-y-3">{data.requests.map(request => {
      const subject = `GameVault support ${request.orderReference || request.id}`
      const mailto = `mailto:${encodeURIComponent(request.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi ${request.name},\n\nRegarding your support request ${request.id}:\n\n\nGameVault`)}`
      return <article className="rounded-xl border p-4 text-sm" key={request.id}>
        <div className="flex flex-wrap justify-between gap-2"><strong>{request.name} · {request.topic.replaceAll('_', ' ')}</strong><span>{new Date(request.createdAt).toLocaleString()}</span></div>
        <p className="mt-1 break-all">{request.email}{request.orderReference ? ` · Order: ${request.orderReference}` : ''}</p>
        <p className="mt-3 whitespace-pre-wrap break-words">{request.message}</p>
        <p className="mt-3 break-all text-xs text-[var(--color-muted)]">Reference: {request.id} · {request.status}</p>
        <div className="mt-3 flex gap-3"><a className="btn-primary px-4 py-2" href={mailto}>Reply by email</a><button className="underline disabled:opacity-50" disabled={busy === request.id} onClick={() => update(request)}>{busy === request.id ? 'Saving…' : request.status === 'open' ? 'Mark resolved' : 'Reopen'}</button></div>
      </article>
    })}{!data.requests.length && !error && <p className="text-sm text-[var(--color-muted)]">No {status === 'all' ? '' : status + ' '}messages.</p>}</div>}
    {data.total > data.pageSize && <div className="mt-4 flex gap-3 text-sm"><button disabled={page === 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} of {Math.ceil(data.total / data.pageSize)}</span><button disabled={page * data.pageSize >= data.total} onClick={() => setPage(value => value + 1)}>Next</button></div>}
  </section>
}

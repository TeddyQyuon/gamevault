import { useEffect, useRef, useState } from 'react'
import { Search, X, ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getProducts } from '../../services/catalogService.js'

export function SearchBar({ initial = '', compact = false }) {
  const [q, setQ] = useState(initial)
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)
  const nav = useNavigate()

  useEffect(() => {
    let alive = true
    if (q.trim().length > 1) {
      getProducts({ q: q.trim() }).then((list) => {
        if (alive) {
          setResults(list.slice(0, 5))
          setIsOpen(true)
        }
      })
    } else {
      setResults([])
      setIsOpen(false)
    }
    return () => { alive = false }
  }, [q])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsOpen(false)
    nav(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/subscriptions')
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        className={`flex w-full items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-elevated)] transition-all focus-within:border-[#ff5a00] focus-within:bg-white focus-within:shadow-md ${compact ? 'px-3 py-2' : 'px-4 py-2.5'}`}
        onSubmit={handleSubmit}
      >
        <Search size={17} className="shrink-0 text-[var(--color-muted)]" aria-hidden />
        <label htmlFor={compact ? 'site-search-m' : 'site-search'} className="sr-only">Search games, subscriptions, gift cards</label>
        <input
          id={compact ? 'site-search-m' : 'site-search'}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
          placeholder="Search subscriptions, gift cards, games…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-[#6b7d9f]"
          autoComplete="off"
        />
        {q && (
          <button type="button" onClick={() => { setQ(''); setResults([]); setIsOpen(false) }} className="p-0.5 text-[var(--color-muted)] hover:text-black" aria-label="Clear search">
            <X size={15} />
          </button>
        )}
      </form>

      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-2 shadow-2xl">
          <p className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Instant matches</p>
          <div className="space-y-1">
            {results.map((item) => {
              const price = item.priceFromCents || item.variants?.[0]?.priceCents
              return (
                <Link
                  key={item.id}
                  to={`/products/${item.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-3 rounded-lg p-2 transition-colors hover:bg-[#f5f6f8]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.artworkPath && (
                      <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md border border-gray-100 bg-gray-50 p-1 flex items-center justify-center">
                        <img src={item.artworkPath} alt="" className="max-h-full max-w-full object-contain" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#17191d]">{item.title}</p>
                      <p className="text-[11px] text-[var(--color-muted)] capitalize">{item.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {price && <span className="text-xs font-bold text-[#17191d]">S${(price / 100).toFixed(2)}</span>}
                    <span className="flex items-center gap-1 rounded bg-[#ff5a00] px-2 py-1 text-[11px] font-bold text-white">
                      Buy <ArrowRight size={11} />
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            className="mt-1 flex w-full items-center justify-center gap-1.5 border-t border-gray-100 pt-2 text-xs font-semibold text-[#ff5a00] hover:underline"
          >
            View all results for &ldquo;{q}&rdquo; <ArrowRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

export function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <fieldset className="border-b border-[var(--color-border)] pb-4 last:border-0">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="mb-2 flex w-full items-center justify-between py-1 text-sm font-bold">
        <legend className="contents">{title}</legend>
        <span aria-hidden>{open ? '▾' : '▸'}</span>
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </fieldset>
  )
}

export function CheckRow({ label, count, checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1.5 py-1.5 text-sm hover:bg-white/5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#2855FF]" />
      <span className="flex-1">{label}</span>
      {count != null && <span className="text-xs text-[var(--color-muted)]">({count})</span>}
    </label>
  )
}

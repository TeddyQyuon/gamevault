import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { getProducts, getRecent } from '../services/catalogService.js'
import { PLATFORMS, GENRES, REGIONS } from '../data/products.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import Artwork from '../components/ui/Artwork.jsx'
import { Breadcrumbs, Button } from '../components/ui/controls.jsx'
import { CheckRow, FilterGroup } from '../components/ui/search.jsx'
import { Drawer, EmptyState, ProductGridSkeleton } from '../components/ui/feedback.jsx'

const PAGE_SIZE = 8
const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
]

// Reused by /games, /gift-cards, /streaming, /deals, /search —
// callers pass a fixed category / dealsOnly / title instead of duplicating code.
export default function Catalogue({ category, dealsOnly, title, subtitle, heroArt = 'starborne' }) {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState(false)

  const filters = useMemo(() => ({
    q: params.get('q') || '',
    platforms: params.getAll('platform'),
    genres: params.getAll('genre'),
    regions: params.getAll('region'),
    maxPrice: params.get('max') ? Number(params.get('max')) : null,
    inStockOnly: params.get('stock') === 'in',
    sort: params.get('sort') || 'featured',
    page: Math.max(1, Number(params.get('page')) || 1),
  }), [params])

  useEffect(() => {
    let alive = true
    setLoading(true)
    getProducts({ category, dealsOnly, q: filters.q, platforms: filters.platforms, genres: filters.genres, regions: filters.regions, maxPrice: filters.maxPrice, inStockOnly: filters.inStockOnly, sort: filters.sort })
      .then((list) => alive && (setItems(list), setLoading(false)))
    getRecent().then((r) => alive && setRecent(r))
    return () => { alive = false }
  }, [category, dealsOnly, filters.q, filters.platforms, filters.genres, filters.regions, filters.maxPrice, filters.inStockOnly, filters.sort])

  const patch = (mut) => {
    const next = new URLSearchParams(params)
    mut(next)
    next.delete('page') // reset pagination whenever filters change
    setParams(next, { replace: false })
  }
  const toggleList = (key, value) => patch((n) => {
    const cur = n.getAll(key)
    n.delete(key)
    cur.filter((x) => x !== value).forEach((x) => n.append(key, x))
    if (!cur.includes(value)) n.append(key, value)
  })

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasFilters = filters.platforms.length + filters.genres.length + filters.regions.length > 0 || filters.maxPrice || filters.inStockOnly || filters.q

  const filterPanel = (
    <div className="space-y-4">
      <FilterGroup title="Platform">
        {PLATFORMS.map((p) => <CheckRow key={p} label={p} checked={filters.platforms.includes(p)} onChange={() => toggleList('platform', p)} />)}
      </FilterGroup>
      <FilterGroup title="Genre">
        {GENRES.map((g) => <CheckRow key={g} label={g} checked={filters.genres.includes(g)} onChange={() => toggleList('genre', g)} />)}
      </FilterGroup>
      <FilterGroup title="Region">
        {REGIONS.map((r) => <CheckRow key={r} label={r} checked={filters.regions.includes(r)} onChange={() => toggleList('region', r)} />)}
      </FilterGroup>
      <FilterGroup title="Price">
        {[{ l: 'Under S$10', m: 10 }, { l: 'Under S$30', m: 30 }, { l: 'Under S$60', m: 60 }].map((o) => (
          <CheckRow key={o.l} label={o.l} checked={filters.maxPrice === o.m} onChange={(c) => patch((n) => { c ? n.set('max', o.m) : n.delete('max') })} />
        ))}
      </FilterGroup>
      <FilterGroup title="Availability">
        <CheckRow label="In stock only" checked={filters.inStockOnly} onChange={(c) => patch((n) => { c ? n.set('stock', 'in') : n.delete('stock') })} />
      </FilterGroup>
    </div>
  )

  return (
    <div>
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: title }]} />
      <section className="card mb-5 overflow-hidden">
        <div className="grid md:grid-cols-[1.2fr_.8fr]">
          <div className="p-6 md:p-8">
            <h1 className="text-3xl font-extrabold md:text-4xl">Browse <span className="gradient-text">{title.replace('Browse ', '')}</span></h1>
            <p className="mt-1 text-[var(--color-muted)]">{subtitle}</p>
            {filters.q && <p className="mt-2 text-sm">Search: <strong>“{filters.q}”</strong></p>}
          </div>
          <div className="hidden md:block"><Artwork artKey={heroArt} title={`${title} banner`} ratio="21/9" className="h-full" /></div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
        <aside className="card hidden h-fit p-4 lg:block" aria-label="Filters">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-extrabold">Filters</h2>
            {hasFilters && <button onClick={() => setParams({ sort: filters.sort })} className="text-xs font-semibold text-[#2454a7] hover:underline">Clear filters</button>}
          </div>
          {filterPanel}
        </aside>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold lg:hidden" onClick={() => setDrawer(true)}>
              <span className="inline-flex items-center gap-1.5"><SlidersHorizontal size={15} aria-hidden /> Filters</span>
            </button>
            <p className="text-sm text-[var(--color-muted)]" role="status">
              {loading ? 'Loading…' : `Showing ${pageItems.length} of ${items.length} result${items.length === 1 ? '' : 's'}`}
            </p>
            <label className="ml-auto flex items-center gap-2 text-sm">
              Sort by
              <select value={filters.sort} onChange={(e) => patch((n) => n.set('sort', e.target.value))} className="input !w-auto" aria-label="Sort products">
                {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
          </div>

          {loading ? <ProductGridSkeleton /> : pageItems.length === 0 ? (
            <EmptyState
              title="No products match those filters"
              hint="Try removing a filter or searching for another product."
              action={hasFilters ? <Button variant="secondary" onClick={() => setParams({})}>Clear filters</Button> : null}
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
              {pageItems.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <nav aria-label="Pagination" className="mt-5 flex flex-wrap items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} aria-label={`Page ${n}`} aria-current={n === page ? 'page' : undefined}
                  onClick={() => { const next = new URLSearchParams(params); next.set('page', n); setParams(next) }}
                  className={`min-h-[40px] min-w-[40px] rounded-lg border px-3 text-sm font-bold ${n === page ? 'border-transparent bg-[#2855FF]' : 'border-[var(--color-border)] hover:border-[var(--color-cyan)]'}`}>
                  {n}
                </button>
              ))}
            </nav>
          )}

          {recent.length > 0 && (
            <section aria-label="Recently viewed" className="card mt-6 p-4">
              <h2 className="mb-3 font-extrabold">Recently Viewed</h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {recent.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            </section>
          )}
        </div>
      </div>

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filters">
        {filterPanel}
        <div className="mt-4 flex gap-2">
          <button onClick={() => setParams({})} className="flex-1 rounded-lg border border-[var(--color-border)] py-2.5 text-sm font-semibold">Clear all</button>
          <button onClick={() => setDrawer(false)} className="btn-primary flex-1 py-2.5 text-sm">Show {items.length} results</button>
        </div>
      </Drawer>
    </div>
  )
}

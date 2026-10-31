import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowRight, SearchX, SlidersHorizontal, X } from 'lucide-react'
import { getProducts, getRecent } from '../services/catalogService.js'
import { PLATFORMS, GENRES, REGIONS } from '../data/products.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import { Breadcrumbs, Button } from '../components/ui/controls.jsx'
import { CheckRow, FilterGroup } from '../components/ui/search.jsx'
import { Drawer, ProductGridSkeleton } from '../components/ui/feedback.jsx'
import Rail from '../components/ui/Rail.jsx'
import SectionHeader from '../components/ui/SectionHeader.jsx'

const PAGE_SIZE = 12
const SORTS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'discount', label: 'Best discount' },
  { id: 'name', label: 'Name: A to Z' },
]
const discountFor = (product) =>
  Math.max(
    0,
    ...product.variants.map((variant) =>
      variant.compareAtCents > variant.priceCents
        ? (variant.compareAtCents - variant.priceCents) / variant.compareAtCents
        : 0,
    ),
  )

// Shared by the existing category and search routes. URL parameters remain the
// source of truth so filters, pagination and browser history keep working.
export default function Catalogue({ category, dealsOnly, title, subtitle }) {
  const [params, setParams] = useSearchParams()
  const [items, setItems] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [drawer, setDrawer] = useState(false)
  const filters = useMemo(
    () => ({
      q: params.get('q') || '',
      platforms: params.getAll('platform'),
      genres: params.getAll('genre'),
      regions: params.getAll('region'),
      maxPrice: params.get('max') ? Number(params.get('max')) : null,
      inStockOnly: params.get('stock') === 'in',
      sort: params.get('sort') || 'featured',
      page: Math.max(1, Number(params.get('page')) || 1),
    }),
    [params],
  )

  useEffect(() => {
    let alive = true
    setLoading(true)
    getProducts({
      category,
      dealsOnly,
      q: filters.q,
      platforms: filters.platforms,
      genres: filters.genres,
      regions: filters.regions,
      maxPrice: filters.maxPrice,
      inStockOnly: filters.inStockOnly,
      sort: filters.sort,
    }).then((list) => {
      if (!alive) return
      // These are display orderings only; prices and availability are unchanged.
      const ordered = [...list]
      if (filters.sort === 'discount') ordered.sort((a, b) => discountFor(b) - discountFor(a))
      if (filters.sort === 'name') ordered.sort((a, b) => a.title.localeCompare(b.title))
      setItems(ordered)
      setLoading(false)
    })
    getRecent().then((list) => {
      if (alive) setRecent(list)
    })
    return () => {
      alive = false
    }
  }, [
    category,
    dealsOnly,
    filters.q,
    filters.platforms,
    filters.genres,
    filters.regions,
    filters.maxPrice,
    filters.inStockOnly,
    filters.sort,
  ])

  const patch = (mutation) => {
    const next = new URLSearchParams(params)
    mutation(next)
    next.delete('page')
    setParams(next, { replace: false })
  }
  const toggleList = (key, value) =>
    patch((next) => {
      const current = next.getAll(key)
      next.delete(key)
      current.filter((item) => item !== value).forEach((item) => next.append(key, item))
      if (!current.includes(value)) next.append(key, value)
    })
  const clearFilters = () => setParams({ sort: filters.sort })
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const page = Math.min(filters.page, totalPages)
  const pageItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const activeFilters = [
    ...filters.platforms.map((value) => ({
      key: `platform-${value}`,
      label: value,
      remove: () => toggleList('platform', value),
    })),
    ...filters.genres.map((value) => ({
      key: `genre-${value}`,
      label: value,
      remove: () => toggleList('genre', value),
    })),
    ...filters.regions.map((value) => ({
      key: `region-${value}`,
      label: value,
      remove: () => toggleList('region', value),
    })),
    ...(filters.q
      ? [{ key: 'q', label: `Search: ${filters.q}`, remove: () => patch((next) => next.delete('q')) }]
      : []),
    ...(filters.maxPrice
      ? [
          {
            key: 'max',
            label: `Up to S$${filters.maxPrice}`,
            remove: () => patch((next) => next.delete('max')),
          },
        ]
      : []),
    ...(filters.inStockOnly
      ? [{ key: 'stock', label: 'In stock', remove: () => patch((next) => next.delete('stock')) }]
      : []),
  ]

  const filterPanel = (
    <div className="catalogue-filter-groups">
      <FilterGroup title="Platform">
        {PLATFORMS.map((platform) => (
          <CheckRow
            key={platform}
            label={platform}
            checked={filters.platforms.includes(platform)}
            onChange={() => toggleList('platform', platform)}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Genre">
        {GENRES.map((genre) => (
          <CheckRow
            key={genre}
            label={genre}
            checked={filters.genres.includes(genre)}
            onChange={() => toggleList('genre', genre)}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Region">
        {REGIONS.map((region) => (
          <CheckRow
            key={region}
            label={region}
            checked={filters.regions.includes(region)}
            onChange={() => toggleList('region', region)}
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {[
          { label: 'S$10 and under', max: 10 },
          { label: 'S$30 and under', max: 30 },
          { label: 'S$60 and under', max: 60 },
        ].map((option) => (
          <CheckRow
            key={option.max}
            label={option.label}
            checked={filters.maxPrice === option.max}
            onChange={(checked) =>
              patch((next) => {
                checked ? next.set('max', option.max) : next.delete('max')
              })
            }
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Availability">
        <CheckRow
          label="In stock only"
          checked={filters.inStockOnly}
          onChange={(checked) =>
            patch((next) => {
              checked ? next.set('stock', 'in') : next.delete('stock')
            })
          }
        />
      </FilterGroup>
    </div>
  )

  return (
    <div className="catalogue-page">
      <Breadcrumbs trail={[{ label: 'Home', to: '/' }, { label: title }]} />
      <header className="catalogue-hero">
        <div>
          <p className="eyebrow">The GameVault collection</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <span className="catalogue-hero-note">
          Check your platform.
          <br />
          Choose your region.
        </span>
      </header>
      <div className="catalogue-layout">
        <aside className="catalogue-filters" aria-label="Filters">
          <div className="catalogue-filter-heading">
            <h2>Filter by</h2>
            {activeFilters.length > 0 && <button onClick={clearFilters}>Clear all</button>}
          </div>
          {filterPanel}
        </aside>
        <div className="catalogue-results">
          <div className="catalogue-toolbar">
            <button
              className="catalogue-filter-toggle"
              onClick={() => setDrawer(true)}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal size={17} aria-hidden />
              Filters{activeFilters.length > 0 && <span>{activeFilters.length}</span>}
            </button>
            <p role="status" aria-live="polite">
              {loading
                ? 'Finding your next favourite…'
                : `${items.length} result${items.length === 1 ? '' : 's'}`}
            </p>
            <label className="catalogue-sort">
              <span>Sort by</span>
              <select
                value={filters.sort}
                onChange={(event) => patch((next) => next.set('sort', event.target.value))}
                className="input"
                aria-label="Sort products"
              >
                {SORTS.map((sort) => (
                  <option key={sort.id} value={sort.id}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {activeFilters.length > 0 && (
            <div className="catalogue-active-filters" aria-label="Active filters">
              {activeFilters.map((filter) => (
                <button key={filter.key} onClick={filter.remove} aria-label={`Remove ${filter.label} filter`}>
                  {filter.label}
                  <X size={14} aria-hidden />
                </button>
              ))}
              <button className="catalogue-clear" onClick={clearFilters}>
                Clear all
              </button>
            </div>
          )}
          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : pageItems.length ? (
            <div className="product-grid catalogue-grid">
              {pageItems.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="catalogue-empty">
              <SearchX size={42} strokeWidth={1.5} aria-hidden />
              <h2>A fresh search could do it.</h2>
              <p>We couldn’t find a match for these filters. Try another title, platform or region.</p>
              <div>
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
                <Link to="/subscriptions">
                  Explore subscriptions <ArrowRight size={16} aria-hidden />
                </Link>
              </div>
            </div>
          )}
          {!loading && items.length > 0 && (
            <p className="catalogue-page-count">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, items.length)} of{' '}
              {items.length} products
            </p>
          )}
          {totalPages > 1 && (
            <nav aria-label="Pagination" className="catalogue-pagination">
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => (
                <button
                  key={number}
                  aria-label={`Page ${number}`}
                  aria-current={number === page ? 'page' : undefined}
                  onClick={() => {
                    const next = new URLSearchParams(params)
                    next.set('page', number)
                    setParams(next)
                  }}
                >
                  {number}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>
      {recent.length > 0 && (
        <section className="catalogue-recent" aria-label="Recently viewed">
          <SectionHeader title="Recently viewed" subtitle="Take another look." />
          <Rail label="Recently viewed products">
            {recent.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Rail>
        </section>
      )}
      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Filter products">
        {filterPanel}
        <div className="catalogue-drawer-actions">
          <button onClick={clearFilters}>Clear all</button>
          <button onClick={() => setDrawer(false)} className="btn-primary">
            Show {items.length} results
          </button>
        </div>
      </Drawer>
    </div>
  )
}

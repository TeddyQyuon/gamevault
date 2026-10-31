import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, ChevronDown, Search, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { getProducts } from '../../services/catalogService.js'
import { formatPrice } from '../../utils/format.js'
import Artwork from './Artwork.jsx'

export function SearchBar({ initial = '', compact = false }) {
  const [q, setQ] = useState(initial)
  const [results, setResults] = useState([])
  const [isOpen, setIsOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId().replaceAll(':', '')
  const nav = useNavigate()
  const visible = isOpen && q.trim().length > 1

  useEffect(() => {
    let alive = true
    setActive(-1)
    if (q.trim().length <= 1) {
      setResults([])
      setIsOpen(false)
      return undefined
    }
    const timer = setTimeout(() => {
      getProducts({ q: q.trim() }).then((list) => {
        if (alive) {
          setResults(list.slice(0, 5))
          setIsOpen(true)
        }
      })
    }, 150)
    return () => { alive = false; clearTimeout(timer) }
  }, [q])

  useEffect(() => {
    const onPointer = (event) => {
      if (!containerRef.current?.contains(event.target)) setIsOpen(false)
    }
    document.addEventListener('pointerdown', onPointer)
    return () => document.removeEventListener('pointerdown', onPointer)
  }, [])

  const handleSubmit = (event) => {
    event.preventDefault()
    setIsOpen(false)
    nav(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : '/subscriptions')
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape') { setIsOpen(false); setActive(-1) }
    if (event.key === 'Tab') setIsOpen(false)
    if (event.key === 'ArrowDown' && results.length) {
      event.preventDefault()
      setIsOpen(true)
      setActive((index) => (index + 1) % results.length)
    }
    if (event.key === 'ArrowUp' && results.length) {
      event.preventDefault()
      setIsOpen(true)
      setActive((index) => (index <= 0 ? results.length - 1 : index - 1))
    }
    if (event.key === 'Enter' && visible && active >= 0 && results[active]) {
      event.preventDefault()
      setIsOpen(false)
      nav(`/products/${results[active].slug}`)
    }
  }

  return (
    <div className={`search-combobox${compact ? ' search-combobox-compact' : ''}`} ref={containerRef} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setIsOpen(false)
    }}>
      <form role="search" className="search-form" onSubmit={handleSubmit}>
        <Search size={19} aria-hidden="true" className="search-icon" />
        <label htmlFor={`${listId}-input`} className="sr-only">Search games, subscriptions, gift cards</label>
        <input ref={inputRef} id={`${listId}-input`} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={visible ? `${listId}-results` : undefined} aria-activedescendant={visible && active >= 0 ? `${listId}-option-${active}` : undefined} value={q} onChange={(event) => setQ(event.target.value)} onFocus={() => { if (q.trim().length > 1) setIsOpen(true) }} onKeyDown={handleKeyDown} placeholder="Search games, subscriptions, gift cards…" autoComplete="off" />
        {q && <button type="button" className="search-clear" onClick={() => { setQ(''); setResults([]); setIsOpen(false); inputRef.current?.focus() }} aria-label="Clear search"><X size={18} aria-hidden="true" /></button>}
        <button type="submit" className="search-submit" aria-label="Search store"><ArrowRight size={19} aria-hidden="true" /></button>
      </form>

      {visible && (
        <div className="search-dropdown">
          <p className="search-dropdown-heading">Suggested products</p>
          <ul id={`${listId}-results`} role="listbox" aria-label="Product suggestions" className="search-results">
            {results.map((item, index) => {
              const price = item.priceFromCents || item.variants?.[0]?.priceCents
              return (
                <li key={item.id} role="presentation">
                  <Link role="option" id={`${listId}-option-${index}`} aria-selected={active === index} tabIndex={-1} to={`/products/${item.slug}`} onMouseEnter={() => setActive(index)} onClick={() => { setIsOpen(false); inputRef.current?.blur() }} className={`search-result${active === index ? ' is-active' : ''}`}>
                    <Artwork artKey={item.art} title={item.title} src={item.artworkPath} ratio="1/1" className="search-result-art" />
                    <span className="search-result-copy"><strong>{item.title}</strong><small>{item.category.replaceAll('-', ' ')}</small></span>
                    {Number.isFinite(price) && <span className="search-result-price">{formatPrice(price)}</span>}
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              )
            })}
          </ul>
          {!results.length && <p className="search-no-results">No products found. Try a game, service or platform name.</p>}
          <button type="button" onClick={handleSubmit} className="search-all-results">View all results for “{q}” <ArrowRight size={15} aria-hidden="true" /></button>
        </div>
      )}
      <span className="sr-only" role="status" aria-live="polite">{visible ? `${results.length} suggested ${results.length === 1 ? 'product' : 'products'}` : ''}</span>
    </div>
  )
}

export function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  const id = useId().replaceAll(':', '')
  return (
    <fieldset className="filter-group">
      <legend className="sr-only">{title}</legend>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls={open ? `${id}-panel` : undefined} className="filter-group-toggle">{title}<ChevronDown size={16} aria-hidden="true" /></button>
      {open && <div id={`${id}-panel`} className="filter-group-options">{children}</div>}
    </fieldset>
  )
}

export function CheckRow({ label, count, checked, onChange }) {
  return (
    <label className="filter-check-row">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <span>{label}</span>
      {count != null && <small>({count})</small>}
    </label>
  )
}

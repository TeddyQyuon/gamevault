import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ArrowRight, ChevronDown, Clock3, Menu, ShoppingCart, UserRound, X } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { SearchBar } from '../ui/search.jsx'

const NAV = [
  { to: '/games', label: 'Games', links: [['/games', 'All games'], ['/games?platform=PC+(Steam)', 'PC · Steam'], ['/games?platform=PlayStation', 'PlayStation'], ['/games?platform=Xbox', 'Xbox'], ['/games?platform=Nintendo+Switch', 'Nintendo Switch']] },
  { to: '/subscriptions', label: 'Subscriptions', links: [['/subscriptions', 'All subscriptions'], ['/subscriptions?type=gaming', 'Gaming memberships'], ['/subscriptions?type=music', 'Music'], ['/subscriptions?type=software', 'Software'], ['/subscriptions?type=vpn', 'VPN & security']] },
  { to: '/gift-cards', label: 'Gift cards', links: [['/gift-cards', 'All gift cards'], ['/gift-cards?platform=PC+(Steam)', 'Steam wallet'], ['/gift-cards?platform=PlayStation', 'PlayStation Store'], ['/gift-cards?platform=Xbox', 'Xbox gift cards'], ['/gift-cards?region=Singapore', 'Singapore gift cards']] },
  { to: '/streaming', label: 'Streaming', links: [['/streaming', 'Video & streaming'], ['/subscriptions?type=video', 'All video memberships'], ['/subscriptions?type=music', 'Music memberships']] },
  { to: '/deals', label: 'Deals', links: [['/deals', 'Browse all deals'], ['/deals?sort=price-asc', 'Price: low to high'], ['/deals?platform=PC+(Steam)', 'PC game deals']] },
]

export default function Header() {
  const { count, openCart } = useCart()
  const { user } = useSession()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [dropdown, setDropdown] = useState(null)
  const [scrolled, setScrolled] = useState(false)
  const drawerRef = useRef(null)
  const navRef = useRef(null)
  const menuId = useId().replaceAll(':', '')
  const closeMenu = useCallback(() => setOpen(false), [])

  useFocusTrap({ open, onClose: closeMenu, ref: drawerRef })

  useEffect(() => {
    setOpen(false)
    setDropdown(null)
  }, [location.pathname, location.search])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (dropdown === null) return
    const onPointer = (event) => {
      if (!navRef.current?.contains(event.target)) setDropdown(null)
    }
    const onKey = (event) => {
      if (event.key !== 'Escape') return
      setDropdown(null)
      navRef.current?.querySelector(`[data-category-trigger="${dropdown}"]`)?.focus()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [dropdown])

  function openCategory(event, index) {
    if (event.key !== 'ArrowDown') return
    event.preventDefault()
    setDropdown(index)
    window.requestAnimationFrame(() => document.getElementById(`${menuId}-${index}`)?.querySelector('a')?.focus())
  }

  return (
    <>
      <div className="store-announcement">
        <Clock3 size={14} aria-hidden="true" />
        <p>Email delivery within 1 hour <span>after confirmed payment</span></p>
        <Link to="/support">How delivery works <ArrowRight size={13} aria-hidden="true" /></Link>
      </div>

      <header className={`store-header${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container-shell store-header-main">
          <button type="button" className="header-menu header-icon-button" onClick={() => setOpen(true)} aria-expanded={open} aria-controls={open ? `${menuId}-mobile` : undefined} aria-label="Open navigation menu">
            <Menu size={23} aria-hidden="true" />
          </button>
          <Link to="/" className="store-brand" aria-label="GameVault home">
            <img src="/assets/storefront/gamevault-logo.svg" alt="" width="32" height="32" decoding="async" />
            <span className="store-brand-wordmark">Game<span>Vault</span></span>
          </Link>
          <div className="store-search"><SearchBar /></div>
          <div className="header-actions">
            <Link to={user ? '/account' : '/login'} className="header-account" aria-label={user ? 'Your account' : 'Sign in'}>
              <UserRound size={22} aria-hidden="true" />
              <span>{user ? user.name?.split(' ')[0] || 'Account' : 'Sign in'}</span>
            </Link>
            <button type="button" onClick={openCart} className="header-cart" aria-label={`Cart, ${count} ${count === 1 ? 'item' : 'items'}`}>
              <ShoppingCart size={23} aria-hidden="true" />
              <span>Cart</span>
              {count > 0 && <b className="cart-count-pop" key={count} aria-hidden="true">{count}</b>}
            </button>
            <span className="sr-only" aria-live="polite" aria-atomic="true">{count} {count === 1 ? 'item' : 'items'} in your cart</span>
          </div>
        </div>

        <div className="store-nav-border">
          <div className="container-shell store-nav-row">
            <nav aria-label="Primary" className="store-nav" ref={navRef} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setDropdown(null)
            }}>
              {NAV.map((item, index) => (
                <div className="nav-category" key={item.to}>
                  <NavLink to={item.to} className={({ isActive }) => isActive ? 'active' : ''}>{item.label}</NavLink>
                  <button type="button" className="nav-category-toggle" data-category-trigger={index} aria-label={`Browse ${item.label.toLowerCase()} categories`} aria-expanded={dropdown === index} aria-controls={dropdown === index ? `${menuId}-${index}` : undefined} onClick={() => setDropdown(dropdown === index ? null : index)} onKeyDown={(event) => openCategory(event, index)}>
                    <ChevronDown size={14} aria-hidden="true" />
                  </button>
                  {dropdown === index && (
                    <div className="nav-dropdown" id={`${menuId}-${index}`}>
                      <p>{item.label}</p>
                      {item.links.map(([to, label]) => <Link to={to} key={to} onClick={() => setDropdown(null)}>{label}<ArrowRight size={14} aria-hidden="true" /></Link>)}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <Link className="header-help-link" to="/support">Help & delivery <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
        </div>
      </header>

      {open && (
        <div className="mobile-nav-overlay">
          <button type="button" className="mobile-nav-backdrop" onClick={closeMenu} tabIndex={-1} aria-label="Close navigation menu" />
          <section className="mobile-nav-dialog" id={`${menuId}-mobile`} ref={drawerRef} role="dialog" aria-modal="true" aria-labelledby={`${menuId}-title`} tabIndex={-1}>
            <div className="mobile-nav-heading">
              <h2 id={`${menuId}-title`}>Explore GameVault</h2>
              <button type="button" className="header-icon-button" onClick={closeMenu} aria-label="Close navigation menu"><X size={22} aria-hidden="true" /></button>
            </div>
            <nav aria-label="Mobile primary">
              {NAV.map((item) => (
                <details className="mobile-nav-category" key={item.to}>
                  <summary>{item.label}<ChevronDown size={18} aria-hidden="true" /></summary>
                  <div>{item.links.map(([to, label]) => <Link to={to} key={to} onClick={closeMenu}>{label}<ArrowRight size={15} aria-hidden="true" /></Link>)}</div>
                </details>
              ))}
              <Link className="mobile-nav-direct" to="/support" onClick={closeMenu}>Help & delivery <ArrowRight size={17} aria-hidden="true" /></Link>
              <Link className="mobile-nav-direct" to={user ? '/account' : '/login'} onClick={closeMenu}>{user ? 'Your account' : 'Sign in to your account'}<UserRound size={18} aria-hidden="true" /></Link>
            </nav>
            <p className="mobile-nav-note"><Clock3 size={18} aria-hidden="true" />Manual offers are emailed within 1 hour after confirmed payment. Check the delivery method on each listing.</p>
          </section>
        </div>
      )}
    </>
  )
}

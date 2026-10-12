import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, ShoppingCart, User, X, ShieldCheck } from 'lucide-react'
import { useCart } from '../../context/CartContext.jsx'
import { useSession } from '../../context/SessionContext.jsx'
import { SearchBar } from '../ui/search.jsx'

const NAV = [['/games','Games'],['/subscriptions','Subscriptions'],['/gift-cards','Gift cards'],['/streaming','Streaming'],['/deals','Deals'],['/coder','Mobile Coder'],['/support','Support']]
export default function Header() {
  const { count, openCart } = useCart()
  const { user } = useSession()
  const [open,setOpen] = useState(false)
  return <header className="store-header">
    <div className="container-shell store-header-main">
      <button className="header-menu" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label={open?'Close menu':'Open menu'}>{open?<X/>:<Menu/>}</button>
      <Link to="/" className="store-brand" aria-label="GameVault home">
        <img src="/assets/storefront/gamevault-logo.svg" alt="" width="34" height="34" />
        Game<span>Vault</span><i>.</i>
      </Link>
      <div className="store-search"><SearchBar/></div>
      <Link to={user?'/account':'/login'} className="header-account"><User size={23}/><span>{user?user.name.split(' ')[0]:'Sign in'}</span></Link>
      <button type="button" onClick={openCart} className="header-cart" aria-label={`Cart, ${count} items`}><ShoppingCart size={24}/><span>Cart</span>{count>0&&<b>{count}</b>}</button>
    </div>
    <div className="store-nav-border"><div className="container-shell store-nav-row">
      <nav aria-label="Primary" className={open?'store-nav open':'store-nav'}>{NAV.map(([to,label])=><NavLink key={to} to={to} onClick={()=>setOpen(false)} className={({isActive})=>isActive?'active':''}>{label}</NavLink>)}</nav>
      <span className="header-trust"><ShieldCheck size={16}/> Email delivery · Secure checkout</span>
    </div></div>
  </header>
}


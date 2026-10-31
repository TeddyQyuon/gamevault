import { NavLink } from 'react-router-dom'
import { Bell, Heart, Home, Library, Package, Settings, LifeBuoy, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useSession } from '../../context/SessionContext.jsx'

const LINKS = [
  { to: '/account', label: 'Overview', icon: Home, end: true },
  { to: '/account/orders', label: 'Orders', icon: Package },
  { to: '/account/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { to: '/account/library', label: 'Digital key vault', icon: Library },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin', label: 'Staff console', icon: ShieldCheck },
  { to: '/account/settings', label: 'Account settings', icon: Settings },
  { to: '/support', label: 'Help & delivery', icon: LifeBuoy },
]

export default function AccountSidebar() {
  const { user, logout } = useSession()
  return <aside className="card account-sidebar" aria-label="Account navigation">
    <div className="account-sidebar-person"><div className="account-avatar" aria-hidden>{(user?.name || 'D')[0]}</div><div><strong>{user?.name || 'Gamer'}</strong><p>{user?.email}</p></div></div>
    <nav><ul>{LINKS.map(link => <li key={link.to}><NavLink to={link.to} end={link.end} className={({ isActive }) => `account-nav-link ${isActive ? 'is-active' : ''}`}><link.icon size={18} aria-hidden /><span>{link.label}</span></NavLink></li>)}<li><button onClick={logout} className="account-nav-link account-signout"><LogOut size={18} aria-hidden /><span>Sign out</span></button></li></ul></nav>
  </aside>
}

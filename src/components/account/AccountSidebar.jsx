import { NavLink } from 'react-router-dom'
import { Bell, CreditCard, Heart, Home, Library, Package, Settings, LifeBuoy, LogOut, RefreshCw, ShieldCheck } from 'lucide-react'
import { useSession } from '../../context/SessionContext.jsx'

const LINKS = [
  { to: '/account', label: 'Dashboard', icon: Home, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/subscriptions', label: 'Subscriptions', icon: RefreshCw },
  { to: '/account/library', label: 'Digital Key Vault', icon: Library },
  { to: '/account/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/admin', label: 'Staff Console', icon: ShieldCheck },
  { to: '/account/settings', label: 'Account Settings', icon: Settings },
  { to: '/support', label: 'Support', icon: LifeBuoy },
]

export default function AccountSidebar() {
  const { user, logout } = useSession()
  return (
    <aside className="card h-fit p-4 lg:sticky lg:top-20" aria-label="Account navigation">
      <div className="mb-3 flex items-center gap-3 border-b border-[var(--color-border)] pb-3">
        <div aria-hidden className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#2855FF] to-[#8B5CF6] font-extrabold">
          {(user?.name || 'D')[0]}
        </div>
        <div className="min-w-0">
          <p className="clamp-1 text-sm font-bold">{user?.name || 'Gamer'}</p>
          <p className="clamp-1 text-xs text-[var(--color-muted)]">{user?.email}</p>
        </div>
      </div>
      <nav>
        <ul className="space-y-1">
          {LINKS.map((l) => (
            <li key={l.to}>
              <NavLink
                to={l.to}
                end={l.end}
                className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-[#2855FF] text-white' : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'}`}
              >
                <l.icon size={17} aria-hidden /> {l.label}
              </NavLink>
            </li>
          ))}
          <li>
            <NavLink
              to="/account/subscriptions"
              className={({ isActive }) => `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-[#2855FF] text-white' : 'text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]'}`}
            >
              <CreditCard size={17} aria-hidden /> Billing & Plans
            </NavLink>
          </li>
          <li>
            <button onClick={logout} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-[var(--color-muted)] hover:bg-white/5 hover:text-[var(--color-text)]">
              <LogOut size={17} aria-hidden /> Sign Out
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  )
}

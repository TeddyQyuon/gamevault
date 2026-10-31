import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
const Catalogue = lazy(() => import('./pages/Catalogue.jsx'))
const ProductDetails = lazy(() => import('./pages/ProductDetails.jsx'))
const Subscriptions = lazy(() => import('./pages/Subscriptions.jsx'))
const Cart = lazy(() => import('./pages/Cart.jsx'))
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const OrderSuccess = lazy(() => import('./pages/OrderSuccess.jsx'))
const OrderCancel = lazy(() => import('./pages/OrderCancel.jsx'))
const Login = lazy(() => import('./pages/Auth.jsx').then(module => ({ default: module.Login })))
const Register = lazy(() => import('./pages/Auth.jsx').then(module => ({ default: module.Register })))
const Support = lazy(() => import('./pages/Support.jsx'))
const NotFound = lazy(() => import('./pages/NotFound.jsx'))
import { useSession } from './context/SessionContext.jsx'

const Admin = lazy(() => import('./pages/Admin.jsx'))
const accountView = name => lazy(() => import('./pages/account/Account.jsx').then(module => ({ default: module[name] })))
const AccountLayout = accountView('AccountLayout')
const Dashboard = accountView('Dashboard')
const Orders = accountView('Orders')
const OrderDetail = accountView('OrderDetail')
const SubscriptionsTab = accountView('SubscriptionsTab')
const Library = accountView('Library')
const WishlistTab = accountView('WishlistTab')
const SettingsTab = accountView('SettingsTab')
const NotificationsTab = accountView('NotificationsTab')

function Deferred({ children }) {
  return <Suspense fallback={<p className="card p-8" role="status">Loading your workspace…</p>}>{children}</Suspense>
}

// Redirects guests to /login?next=... (UX convenience — the API enforces
// ownership on every customer route regardless).
function RequireAuth() {
  const { user, loading } = useSession()
  const loc = useLocation()
  if (loading) return <p className="card p-8 text-center text-sm text-[var(--color-muted)]">Checking your session…</p>
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname)}`} replace />
  return <Outlet />
}

export default function App() {
  return (
    <Suspense fallback={<p className="container-shell py-8" role="status">Loading GameVault…</p>}>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="games" element={<Catalogue category="games" title="Browse Games" subtitle="Discover your next adventure across all platforms." heroArt="elden-ring" />} />
        <Route path="gift-cards" element={<Catalogue category="gift-cards" title="Browse Gift Cards" subtitle="Shop prepaid gift cards. Check the supported region and redemption requirements before buying." heroArt="default" />} />
        <Route path="streaming" element={<Navigate to="/subscriptions?type=video" replace />} />
        <Route path="deals" element={<Catalogue dealsOnly title="Browse Deals" subtitle="Compare currently available offers and prices." heroArt="cyberpunk-2077" />} />
        <Route path="search" element={<Catalogue title="Search Results" subtitle="Find products across the store." heroArt="black-myth-wukong" />} />
        <Route path="products/:slug" element={<ProductDetails />} />
        <Route path="boost" element={<Navigate to="/products/discord-nitro" replace />} />
        <Route path="discord-boost" element={<Navigate to="/products/discord-nitro" replace />} />
        <Route path="nitro" element={<Navigate to="/products/discord-nitro" replace />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders/:orderId/success" element={<OrderSuccess />} />
        <Route path="checkout/cancel" element={<OrderCancel />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="account" element={<Deferred><AccountLayout><Outlet /></AccountLayout></Deferred>}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:orderId" element={<OrderDetail />} />
            <Route path="subscriptions" element={<SubscriptionsTab />} />
            <Route path="library" element={<Library />} />
            <Route path="wishlist" element={<WishlistTab />} />
            <Route path="settings" element={<SettingsTab />} />
            <Route path="notifications" element={<NotificationsTab />} />
          </Route>
          <Route path="admin" element={<Deferred><Admin /></Deferred>} />
        </Route>
        <Route path="support" element={<Support />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
    </Suspense>
  )
}

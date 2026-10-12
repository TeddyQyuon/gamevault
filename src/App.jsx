import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import Catalogue from './pages/Catalogue.jsx'
import ProductDetails from './pages/ProductDetails.jsx'
import Subscriptions from './pages/Subscriptions.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderSuccess from './pages/OrderSuccess.jsx'
import OrderCancel from './pages/OrderCancel.jsx'
import { Login, Register } from './pages/Auth.jsx'
import { AccountLayout, Dashboard, Orders, OrderDetail, SubscriptionsTab, Library, WishlistTab, SettingsTab, NotificationsTab } from './pages/account/Account.jsx'
import Admin from './pages/Admin.jsx'
import Support from './pages/Support.jsx'
import NotFound from './pages/NotFound.jsx'
import MobileCoder from './pages/MobileCoder.jsx'
import { useSession } from './context/SessionContext.jsx'

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
    <Routes>
      <Route path="coder" element={<MobileCoder />} />
      <Route path="mobile-coder" element={<Navigate to="/coder" replace />} />
      <Route path="agent" element={<Navigate to="/coder" replace />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="games" element={<Catalogue category="games" title="Browse Games" subtitle="Discover your next adventure across all platforms." heroArt="starborne" />} />
        <Route path="gift-cards" element={<Catalogue category="gift-cards" title="Browse Gift Cards" subtitle="Shop prepaid gift cards. Check the supported region and redemption requirements before buying." heroArt="default" />} />
        <Route path="streaming" element={<Navigate to="/subscriptions?type=video" replace />} />
        <Route path="deals" element={<Catalogue dealsOnly title="Browse Deals" subtitle="Compare currently available offers and prices." heroArt="rivals-arena" />} />
        <Route path="search" element={<Catalogue title="Search Results" subtitle="Find products across the store." heroArt="emberfall" />} />
        <Route path="products/:slug" element={<ProductDetails />} />
        <Route path="subscriptions" element={<Subscriptions />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="orders/:orderId/success" element={<OrderSuccess />} />
        <Route path="checkout/cancel" element={<OrderCancel />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route element={<RequireAuth />}>
          <Route path="account" element={<AccountLayout><Outlet /></AccountLayout>}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:orderId" element={<OrderDetail />} />
            <Route path="subscriptions" element={<SubscriptionsTab />} />
            <Route path="library" element={<Library />} />
            <Route path="wishlist" element={<WishlistTab />} />
            <Route path="settings" element={<SettingsTab />} />
            <Route path="notifications" element={<NotificationsTab />} />
          </Route>
          <Route path="admin" element={<Admin />} />
        </Route>
        <Route path="support" element={<Support />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}

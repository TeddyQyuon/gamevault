import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { Toasts } from '../ui/feedback.jsx'
import CartDrawer from '../cart/CartDrawer.jsx'

export default function Layout() {
  const { pathname } = useLocation()
  const home = pathname === '/'
  const calm = pathname.startsWith('/checkout') || pathname.startsWith('/orders')
  return (
    <div className="app-backdrop min-h-screen">
      <a href="#main" className="skip-link">Skip to content</a>
      <Header />
      <main id="main" tabIndex={-1} className={`page-main${home ? ' page-main-home' : ' container-shell py-6'}`}>
        <div key={pathname} className={calm ? 'route-static' : 'route-enter'}><Outlet /></div>
      </main>
      <Footer />
      <CartDrawer />
      <Toasts />
    </div>
  )
}

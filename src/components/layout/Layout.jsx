import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { Toasts } from '../ui/feedback.jsx'
import CartDrawer from '../cart/CartDrawer.jsx'

export default function Layout() {
  const home = useLocation().pathname === '/'
  return (
    <div className="app-backdrop min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[70] focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-black">
        Skip to content
      </a>
      <Header />
      <main id="main" className={home ? '' : 'container-shell py-6'}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      <Toasts />
    </div>
  )
}

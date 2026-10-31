import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import UpdateNotice from './components/ui/UpdateNotice.jsx'
import PortfolioDemoBadge from './PortfolioDemoBadge.jsx'
import './styles/index.css'
import './styles/header.css'
import './styles/hero.css'
import './styles/product-card.css'
import './styles/customer.css'
import './styles/footer.css'
import './styles/motion.css'
import './styles/pwa.css'
import { ToastProvider } from './context/ToastContext.jsx'
import { CartProvider } from './context/CartContext.jsx'
import { WishlistProvider } from './context/WishlistContext.jsx'
import { SessionProvider } from './context/SessionContext.jsx'
import { OrdersProvider } from './context/OrdersContext.jsx'

// Provider order: Toast (leaf) -> data providers. Each concern is separate:
// cart, wishlist, demo session, orders/subs — readable Context + hooks, no Redux.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <SessionProvider>
          <CartProvider>
            <WishlistProvider>
              <OrdersProvider>
                <App />
                <UpdateNotice />
              </OrdersProvider>
            </WishlistProvider>
          </CartProvider>
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
    <PortfolioDemoBadge />
  </React.StrictMode>,
)


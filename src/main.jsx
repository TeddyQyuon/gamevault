import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './styles/index.css'
import './styles/marketplace.css'
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
              </OrdersProvider>
            </WishlistProvider>
          </CartProvider>
        </SessionProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)

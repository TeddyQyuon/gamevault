import { ArrowUpRight, Clock3 } from 'lucide-react'
import { Link } from 'react-router-dom'

const PAYMENTS = [
  ['visa.svg', 'Visa', 38, 25],
  ['mastercard.svg', 'Mastercard', 38, 25],
  ['apple-pay.svg', 'Apple Pay', 38, 25],
  ['google-pay.svg', 'Google Pay', 38, 25],
  ['stripe.svg', 'Stripe', 48, 25],
]

export default function Footer() {
  return (
    <footer className="store-footer">
      <div className="container-shell footer-grid">
        <div className="footer-intro">
          <Link className="store-brand" to="/" aria-label="GameVault home">
            <img src="/assets/storefront/gamevault-logo.svg" alt="" width="32" height="32" loading="lazy" decoding="async" />
            <span className="store-brand-wordmark">Game<span>Vault</span></span>
          </Link>
          <p>Games, memberships and digital essentials.<br />Find your next favourite.</p>
          <div className="footer-delivery"><Clock3 size={18} aria-hidden="true" /><span>Email delivery within 1 hour<br /><small>For manual offers, after confirmed payment.</small></span></div>
        </div>
        <nav aria-label="Shop">
          <h2>Explore</h2>
          {[['/games', 'Games'], ['/subscriptions', 'Subscriptions'], ['/gift-cards', 'Gift cards'], ['/streaming', 'Streaming'], ['/deals', 'Deals']].map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}
        </nav>
        <nav aria-label="Help">
          <h2>Here to help</h2>
          <Link to="/support">Help & delivery</Link>
          <Link to="/account/orders">Your orders</Link>
          <Link to="/account">Your account</Link>
          <Link to="/support#contact-support" className="footer-contact">Contact support <ArrowUpRight size={14} aria-hidden="true" /></Link>
        </nav>
        <div className="footer-before-buy">
          <h2>Before you buy</h2>
          <p>Check the supported region, membership term, account requirements and delivery method on each listing.</p>
          <p>Code-inventory offers are delivered to your vault after payment confirmation. Manual offers are emailed within 1 hour.</p>
        </div>
      </div>
      <div className="container-shell footer-bottom">
        <div>
          <small>© {new Date().getFullYear()} GameVault. All rights reserved.</small>
          <p>All product names and logos belong to their respective owners.</p>
        </div>
        <div className="footer-payment-group">
          <span>Checkout with Stripe</span>
          <div className="footer-payments" aria-label="Payment brands">
            {PAYMENTS.map(([file, label, width, height]) => <span className="footer-payment-logo" key={file}><img src={`/assets/storefront/${file}`} alt={label} width={width} height={height} loading="lazy" decoding="async" /></span>)}
          </div>
        </div>
      </div>
    </footer>
  )
}

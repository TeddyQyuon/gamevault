import { Link } from 'react-router-dom'
export default function Footer() {
  return <footer className="store-footer"><div className="container-shell footer-grid">
    <div>
      <Link className="store-brand" to="/">
        <img src="/assets/storefront/gamevault-logo.svg" alt="" width="32" height="32" />
        Game<span>Vault</span><i>.</i>
      </Link>
      <p>Games, memberships and digital essentials.<br/>Find your next favourite.</p>
      <div className="footer-payments" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
        <img src="/assets/storefront/visa.svg" alt="Visa" width="38" height="25" />
        <img src="/assets/storefront/mastercard.svg" alt="Mastercard" width="38" height="25" />
        <img src="/assets/storefront/apple-pay.svg" alt="Apple Pay" width="38" height="25" />
        <img src="/assets/storefront/google-pay.svg" alt="Google Pay" width="38" height="25" />
        <img src="/assets/storefront/stripe.svg" alt="Stripe" width="48" height="20" />
      </div>
      <small style={{ display: 'block', marginTop: '12px' }}>© {new Date().getFullYear()} GameVault · All rights reserved</small>
    </div>
    <nav aria-label="Shop"><h2>Explore</h2>{[['/games','Games'],['/subscriptions','Subscriptions'],['/gift-cards','Gift cards'],['/deals','Deals']].map(([to,label])=><Link key={to} to={to}>{label}</Link>)}</nav>
    <nav aria-label="Help"><h2>Here to help</h2><Link to="/support">Help & delivery</Link><Link to="/account/orders">Your orders</Link><Link to="/account">Your account</Link></nav>
    <div><h2>Before you buy</h2><p>Check the region, term and account requirements on each offer. Subscription details are emailed within 1 hour after confirmed payment.</p><p>All product names and logos belong to their respective owners.</p></div>
  </div></footer>
}


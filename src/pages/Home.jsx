import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Headphones, Monitor, ShieldCheck, KeyRound, Gamepad2 } from 'lucide-react'
import { getProducts } from '../services/catalogService.js'
import { ProductCard } from '../components/products/ProductCard.jsx'
import { ProductGridSkeleton } from '../components/ui/feedback.jsx'

const A = '/assets/storefront/'
const CATEGORIES = [
  { label: 'STEAM', logo: 'steam.svg', to: '/gift-cards?q=Steam' },
  { label: 'PLAYSTATION', logo: 'playstation.svg', to: '/gift-cards?q=PlayStation' },
  { label: 'XBOX', logo: 'xbox.svg', to: '/subscriptions?q=Xbox' },
  { label: 'NINTENDO', logo: 'nintendo.svg', to: '/subscriptions?q=Nintendo' },
  { label: 'APPLE', logo: 'apple.svg', to: '/gift-cards?q=Apple' },
  { label: 'GOOGLE PLAY', logo: 'googleplay.svg', to: '/gift-cards?q=Google' },
  { label: 'DISCORD NITRO', logo: 'discord-nitro.svg', to: '/products/discord-nitro' },
  { label: 'SPOTIFY', logo: 'spotify.svg', to: '/subscriptions?q=Spotify' },
]
const COLLECTIONS = [
  { label: 'PC adventures', image: 'elden-ring.jpg', to: '/gift-cards?q=Steam', logo: 'steam.svg' },
  { label: 'Xbox Game Pass', image: 'forza-horizon-5.jpg', to: '/subscriptions?q=Xbox', logo: 'xbox-game-pass.svg' },
  { label: 'PlayStation Plus', color: '#1658c9', to: '/subscriptions?q=PlayStation', logo: 'ps-plus.svg' },
  { label: 'Gift cards', image: 'cyberpunk-2077.jpg', to: '/gift-cards', logo: 'razer.svg' },
  { label: 'Music & streaming', color: '#1b744c', to: '/subscriptions?type=music', logo: 'spotify.svg' },
  { label: 'Discord Nitro & Boost', color: '#5865F2', to: '/products/discord-nitro', logo: 'discord-nitro.svg' },
]

export default function Home() {
  const [products,setProducts] = useState([])
  const [loading,setLoading] = useState(true)
  useEffect(() => {
    let alive = true
    getProducts().then((items) => { if(alive){setProducts(items);setLoading(false)} })
    return () => { alive = false }
  }, [])
  const subscriptions = products.filter((p) => p.category === 'subscriptions')
  const gifts = products.filter((p) => p.category === 'gift-cards')
  const games = products.filter((p) => p.category === 'games')
  const featured = [...subscriptions, ...gifts].slice(0,6)
  return (
    <div className="market-home">
      <section className="market-hero">
        <img className="market-hero-photo" src={`${A}gaming-photo.jpg`} alt="Friends playing video games together" />
        <div className="container-shell market-hero-content">
          <div>
            <p className="market-eyebrow">YOUR NEXT GREAT EXPERIENCE</p>
            <h1>Play more.<br />Make it yours.</h1>
            <p>Game keys, memberships and gift cards.<br className="hidden sm:block" /> Find your next favourite in one place.</p>
            <Link className="market-button" to="/subscriptions">Explore subscriptions <ArrowRight size={18} aria-hidden /></Link>
          </div>
          <Link to="/products/xbox-game-pass-ultimate" className="hero-feature">
            <img src={`${A}game-pass.jpg`} alt="Xbox Game Pass Ultimate" />
            <div><span>MORE WAYS TO PLAY</span><strong>Xbox Game Pass Ultimate</strong><p>Email delivery within 1 hour</p><b>Buy now · From S$19.58 <ArrowRight size={16} aria-hidden /></b></div>
          </Link>
        </div>
      </section>

      <div className="container-shell market-content">
        <nav className="campaign-grid" aria-label="Featured collections">
          {COLLECTIONS.map((c) => <Link key={c.label} to={c.to} className="campaign-tile" style={{backgroundColor:c.color || '#172131'}}>
            {c.image && <img className="campaign-photo" src={`${A}${c.image}`} alt="" />}
            {c.logo && <img className="campaign-logo" src={`${A}${c.logo}`} alt="" />}
            <span>{c.label}</span>
          </Link>)}
        </nav>

        <nav className="platform-grid" aria-label="Shop by category">
          {CATEGORIES.map(({label,logo,Icon,to}) => <Link className="platform-tile" key={label} to={to}>
            {logo ? <img src={`${A}${logo}`} alt="" /> : <Icon strokeWidth={1.6} aria-hidden />}
            <span>{label}</span>
          </Link>)}
        </nav>

        <section className="market-section">
          <SectionHead title="Subscriptions & digital essentials" subtitle="Gaming, streaming, music and software. One-time payment, delivered by email within 1 hour." to="/subscriptions" />
          {loading ? <ProductGridSkeleton count={6}/> : featured.length ? <ProductRow products={featured}/> : <EmptyOffers/>}
        </section>

        <section className="market-section">
          <SectionHead title="Top gift cards" subtitle="A little credit. A lot of possibilities. Find the right gift for every player." to="/gift-cards" />
          {loading ? <ProductGridSkeleton count={6}/> : gifts.length ? <ProductRow products={gifts.slice(0,6)}/> : <EmptyOffers/>}
        </section>

        {games.length > 0 && <section className="market-section"><SectionHead title="Discover your next game" subtitle="Explore available game keys and editions." to="/games"/><ProductRow products={games.slice(0,6)}/></section>}

        <section className="membership-callout">
          <img className="plus-brand-image" src={`${A}ps-plus.svg`} alt="PlayStation Plus" />
          <div><p className="market-eyebrow">YOUR FAVOURITE SERVICES.</p><h2>More entertainment,<br />one simple checkout.</h2><p>Choose your membership and make a one-time payment. We'll email your subscription details within 1 hour after confirmed payment.</p><Link className="market-button" to="/subscriptions">Find your membership <ArrowRight size={18} aria-hidden /></Link></div>
        </section>

        <div className="market-benefits">
          {[{Icon:KeyRound,title:'Email delivery',copy:'Membership details within 1 hour after confirmed payment.'},{Icon:ShieldCheck,title:'Secure checkout',copy:'Payment details stay with Stripe.'},{Icon:Monitor,title:'Choose your platform',copy:'Check region and compatibility.'},{Icon:Headphones,title:'Help when you need it',copy:'Redemption guidance and support.'}].map(({Icon,title,copy}) => <div key={title}><Icon size={28} strokeWidth={1.6} aria-hidden/><span><strong>{title}</strong><p>{copy}</p></span></div>)}
        </div>
      </div>
    </div>
  )
}
function SectionHead({title,subtitle,to}) {
  return <div className="market-section-head"><div><h2>{title}</h2><p>{subtitle}</p></div><Link to={to}>View all <ArrowRight size={16} aria-hidden/></Link></div>
}
function ProductRow({products}) {return <div className="market-product-grid">{products.map(p=><ProductCard key={p.id} product={p}/>)}</div>}
function EmptyOffers(){return <div className="market-empty"><Gamepad2 size={30} aria-hidden/><h3>New offers are on the way</h3><p>Browse popular services and memberships.</p><Link to="/support">Get in touch <ArrowRight size={15} aria-hidden/></Link></div>}

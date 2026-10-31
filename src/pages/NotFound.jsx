import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/controls.jsx'

export default function NotFound() {
  return (
    <div className="customer-page not-found-page card">
      <Compass className="not-found-icon" size={48} aria-hidden /><p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">404 · Page not found</p>
      <h1 className="mt-1 text-4xl font-extrabold">Let’s get you back to browsing</h1>
      <p className="mt-2 text-[var(--color-muted)]">This page could not be found. Continue browsing the store.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-3">
        <Button to="/">Back home</Button>
        <Button to="/games" variant="secondary">Browse games</Button>
      </div>
      <p className="mt-4 text-xs text-[var(--color-muted)]"><Link to="/support" className="underline">Visit support</Link> if you followed a broken link.</p>
    </div>
  )
}

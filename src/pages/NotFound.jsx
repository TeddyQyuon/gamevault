import { Link } from 'react-router-dom'
import { Button } from '../components/ui/controls.jsx'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--color-muted)]">404</p>
      <h1 className="mt-1 text-4xl font-extrabold">Lost in the <span className="gradient-text">Void</span>?</h1>
      <p className="mt-2 text-[var(--color-muted)]">This page could not be found. Continue browsing the store.</p>
      <div className="mt-5 flex justify-center gap-3">
        <Button to="/">Back home</Button>
        <Button to="/games" variant="secondary">Browse games</Button>
      </div>
      <p className="mt-4 text-xs text-[var(--color-muted)]"><Link to="/support" className="underline">Visit support</Link> if you followed a broken link.</p>
    </div>
  )
}

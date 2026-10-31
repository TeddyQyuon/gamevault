import { useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
const PORTFOLIO_URL = 'https://teddy-qyuon-portfolio.vercel.app/'
const STORAGE_KEY = 'tq-demo-badge-dismissed'
export default function PortfolioDemoBadge() {
  const [dismissed, setDismissed] = useState(() => {
    try { return window.sessionStorage.getItem(STORAGE_KEY) === '1' } catch { return false }
  })
  if (dismissed) return null
  const dismiss = () => {
    try { window.sessionStorage.setItem(STORAGE_KEY, '1') } catch { /* Session-only fallback. */ }
    setDismissed(true)
  }
  return <aside className="portfolio-demo" aria-label="Demo notice" data-demo-badge="portfolio">
    <span className="portfolio-demo-dot" aria-hidden="true" /><span>Live demo</span>
    <a href={PORTFOLIO_URL} target="_blank" rel="noopener noreferrer">My portfolio <ArrowUpRight size={14} aria-hidden="true" /></a>
    <button type="button" onClick={dismiss} aria-label="Dismiss demo notice"><X size={16} aria-hidden="true" /></button>
  </aside>
}

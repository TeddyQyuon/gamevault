import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

export function SectionHeader({ title, subtitle, to, actionLabel = 'View all', action }) {
  return <div className="section-header">
    <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
    {action || (to && <Link to={to} className="section-header-link">{actionLabel}<ArrowRight size={16} aria-hidden="true" /></Link>)}
  </div>
}

export default SectionHeader

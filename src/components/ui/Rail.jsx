import { Children, useEffect, useId, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import useReducedMotion from '../../hooks/useReducedMotion.js'

export function Rail({ children, label, className = '' }) {
  const track = useRef(null)
  const id = useId()
  const reducedMotion = useReducedMotion()
  const [edges, setEdges] = useState({ start: true, end: false })
  const items = Children.toArray(children)

  useEffect(() => {
    const element = track.current
    if (!element) return
    function update() {
      setEdges({ start: element.scrollLeft <= 2, end: element.scrollLeft + element.clientWidth >= element.scrollWidth - 2 })
    }
    update()
    element.addEventListener('scroll', update, { passive: true })
    const observer = typeof window.ResizeObserver === 'function' ? new window.ResizeObserver(update) : null
    observer?.observe(element)
    return () => { element.removeEventListener('scroll', update); observer?.disconnect() }
  }, [items.length])

  function move(direction) {
    const element = track.current
    element?.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: reducedMotion ? 'auto' : 'smooth' })
  }

  return <div className={`product-rail ${className}`} role="region" aria-label={label}>
    <div className="rail-controls">
      <button type="button" className="rail-arrow" aria-label={`${label}: previous products`} aria-controls={id} onClick={() => move(-1)} disabled={edges.start}><ChevronLeft size={18} aria-hidden="true" /></button>
      <button type="button" className="rail-arrow" aria-label={`${label}: next products`} aria-controls={id} onClick={() => move(1)} disabled={edges.end}><ChevronRight size={18} aria-hidden="true" /></button>
    </div>
    <div ref={track} id={id} className="rail-track" role="list" tabIndex={0} aria-label={`${label} products`}>
      {items.map((child, index) => <div key={child.key || index} className="rail-item" role="listitem">{child}</div>)}
    </div>
  </div>
}

export default Rail

import { useEffect, useRef, useState } from 'react'
import useReducedMotion from '../../hooks/useReducedMotion.js'

export function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (reducedMotion || !('IntersectionObserver' in window)) { setVisible(true); return }
    const observer = new window.IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); observer.disconnect() }
    }, { threshold: 0.05, rootMargin: '0px 0px 40px 0px' })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [reducedMotion])
  return <div ref={ref} className={`reveal ${className}`} data-visible={visible || reducedMotion} style={{ '--reveal-delay': `${Math.max(0, Math.min(delay, 240))}ms` }}>{children}</div>
}

export default Reveal

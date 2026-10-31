import { useState } from 'react'
import { getBrand } from '../../data/brands.js'

// Provider assets retain their original vector fills and aspect ratios.
export default function BrandLogo({ brand, brandId, name, className = '', size = 24, tile = false, decorative = false }) {
  const entry = typeof brand === 'object' ? brand : getBrand(brand || brandId)
  const [failed, setFailed] = useState('')
  const label = name || entry?.name || 'Brand'
  return (
    <span
      className={`brand-logo ${tile ? 'brand-logo--tile' : ''} ${className}`}
      style={{ '--brand-background': entry?.background || 'var(--color-elevated)', '--brand-padding': entry?.padding || '18%', '--brand-size': `${size}px` }}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
    >
      {entry?.logo && failed !== entry.logo ? (
        <img src={entry.logo} alt="" width="120" height="120" loading="lazy" decoding="async" onError={() => setFailed(entry.logo)} />
      ) : <span className="brand-logo-fallback">{label}</span>}
    </span>
  )
}

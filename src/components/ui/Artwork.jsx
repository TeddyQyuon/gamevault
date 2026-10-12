import { useState } from 'react'
import { ARTWORK_FILES, ARTWORK_STYLES } from '../../utils/artwork.js'

export default function Artwork({ artKey, title, ratio = '16/10', className = '', src, fit, eager = false }) {
  const file = src || ARTWORK_FILES[artKey] || ARTWORK_FILES.default
  const theme = src && src !== ARTWORK_FILES[artKey] ? {} : ARTWORK_STYLES[artKey] || {}
  const insetScale = theme.padding ? Math.max(0.2, 1 - 2 * Number.parseFloat(theme.padding) / 100) : 1
  const [failedSource, setFailedSource] = useState('')
  return (
    <div className={`artwork relative overflow-hidden ${className}`} style={{ aspectRatio: ratio, background: theme.background || 'var(--color-surface, #0e1626)' }}>
      {failedSource !== file ? <img src={file} alt={`${title} product artwork`} loading={eager ? 'eager' : 'lazy'} onError={() => setFailedSource(file)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: src ? fit || 'cover' : theme.fit || fit || 'cover', transform: insetScale < 1 ? `scale(${insetScale})` : undefined, filter: theme.invert ? 'brightness(0) invert(1)' : theme.monochrome ? 'brightness(0)' : undefined }} />
        : <span className="flex h-full items-center justify-center p-4 text-center text-sm text-[var(--color-muted)]">Product image unavailable</span>}
    </div>
  )
}

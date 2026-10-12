import { useState } from 'react'
import { ARTWORK_FILES, ARTWORK_STYLES } from '../../utils/artwork.js'

export default function Artwork({ artKey, title, ratio = '16/10', className = '', src, fit, eager = false }) {
  const rawFile = src || ARTWORK_FILES[artKey] || ARTWORK_FILES.default
  // Attach cache-busting version if loading from storefront assets to guarantee fresh fetch
  const file = (rawFile && rawFile.includes('/assets/storefront/') && !rawFile.includes('?v='))
    ? `${rawFile}?v=4`
    : rawFile

  const cleanFile = (rawFile || '').split('?')[0]
  const cleanSrc = (src || '').split('?')[0]

  const resolvedKey = (artKey && ARTWORK_STYLES[artKey])
    ? artKey
    : Object.entries(ARTWORK_FILES).find(([, v]) => {
        const cleanV = (v || '').split('?')[0]
        return cleanV && (cleanV === cleanFile || cleanV === cleanSrc)
      })?.[0] || artKey

  const theme = ARTWORK_STYLES[resolvedKey] || {}
  const insetScale = theme.padding ? Math.max(0.2, 1 - 2 * Number.parseFloat(theme.padding) / 100) : 1
  const isSvg = cleanFile.endsWith('.svg')
  const objectFit = fit || (theme && theme.fit) || (isSvg ? 'contain' : 'cover')
  const [failedSource, setFailedSource] = useState('')

  return (
    <div
      className={`artwork relative overflow-hidden ${className}`}
      style={{
        aspectRatio: ratio,
        background: theme.background || 'var(--color-surface, #0e1626)',
      }}
    >
      {failedSource !== file ? (
        <img
          src={file}
          alt={`${title} product artwork`}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailedSource(file)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            transform: insetScale < 1 ? `scale(${insetScale})` : undefined,
          }}
        />
      ) : (
        <span className="flex h-full items-center justify-center p-4 text-center text-sm text-[var(--color-muted)]">
          Product image unavailable
        </span>
      )}
    </div>
  )
}

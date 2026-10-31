import { useState } from 'react'
import { ARTWORK_FILES, ARTWORK_STYLES } from '../../utils/artwork.js'
import { getBrand, brandFor } from '../../data/brands.js'
import BrandLogo from './BrandLogo.jsx'

export default function Artwork({ artKey, title, product, ratio = '16/10', className = '', src, fit, eager = false, decorative = false }) {
  const brand = product ? brandFor(product) : getBrand(artKey)
  const label = title || product?.title || brand?.name || 'GameVault'
  // Only self-hosted files are rendered. Remote merchant URLs cannot bypass the registry.
  const file = src?.startsWith('/') ? src : ARTWORK_FILES[artKey || product?.art] || brand?.logo || ARTWORK_FILES.default
  const style = ARTWORK_STYLES[artKey || product?.art] || brand || {}
  const [failedSource, setFailedSource] = useState('')
  const game = brand?.group === 'games'
  const objectFit = fit || style.fit || (file?.endsWith('.svg') ? 'contain' : 'cover')
  const padding = game ? '0%' : style.padding || '18%'
  return (
    <div className={`artwork ${game ? 'artwork--game' : 'artwork--brand'} ${className}`}
      style={{ aspectRatio: ratio, '--artwork-background': style.background || 'var(--color-artwork)', '--artwork-fit': objectFit, '--artwork-padding': padding }}>
      {game && objectFit === 'contain' && brand.hero && <img className="artwork-backdrop" src={brand.hero} alt="" aria-hidden="true" width="460" height="215" loading={eager ? 'eager' : 'lazy'} decoding="async" />}
      {failedSource !== file ? (
        <img className="artwork-image" src={file} alt={decorative ? '' : `${label} product artwork`}
          width={game ? 600 : 480} height={game ? 900 : 480}
          loading={eager ? 'eager' : 'lazy'} decoding="async" fetchPriority={eager ? 'high' : 'auto'}
          onError={() => setFailedSource(file)} />
      ) : (
        <span className="artwork-fallback">
          <BrandLogo brand={game ? 'steam' : 'default'} size={56} decorative />
          <span>{label}</span>
        </span>
      )}
    </div>
  )
}

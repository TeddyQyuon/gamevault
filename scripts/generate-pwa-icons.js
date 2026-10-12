import fs from 'fs'
import path from 'path'
import zlib from 'zlib'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.resolve(__dirname, '../public')
const iconsDir = path.join(publicDir, 'icons')

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true })
}

// Minimal valid uncompressed PNG encoder using zlib.deflateSync
function createPng(width, height, colorFn) {
  // 8-byte PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // CRC32 table
  const crcTable = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    crcTable[n] = c
  }

  function crc32(buf) {
    let crc = 0xffffffff
    for (let i = 0; i < buf.length; i++) {
      crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8)
    }
    return (crc ^ 0xffffffff) >>> 0
  }

  function makeChunk(type, data) {
    const len = data.length
    const buf = Buffer.alloc(8 + len + 4)
    buf.writeUInt32BE(len, 0)
    buf.write(type, 4, 4, 'ascii')
    data.copy(buf, 8)
    const crcVal = crc32(buf.subarray(4, 8 + len))
    buf.writeUInt32BE(crcVal, 8 + len)
    return buf
  }

  // IHDR chunk
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type: RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr)

  // Raw image data: height rows, each starting with filter byte 0, then width * 4 bytes RGBA
  const rowSize = 1 + width * 4
  const rawData = Buffer.alloc(height * rowSize)

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize
    rawData[rowOffset] = 0 // Filter type 0: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4
      const [r, g, b, a] = colorFn(x, y, width, height)
      rawData[pixelOffset] = r
      rawData[pixelOffset + 1] = g
      rawData[pixelOffset + 2] = b
      rawData[pixelOffset + 3] = a
    }
  }

  const compressed = zlib.deflateSync(rawData)
  const idatChunk = makeChunk('IDAT', compressed)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

// Gradient cyber-blue theme for Antigravity Coder
function antigravityIconColor(x, y, w, h) {
  const cx = w / 2
  const cy = h / 2
  const dx = x - cx
  const dy = y - cy
  const dist = Math.sqrt(dx * dx + dy * dy)
  const radius = w * 0.44

  // Rounded squircle / circular border
  if (dist > radius) {
    return [15, 23, 42, 0] // Transparent outside
  }

  // Border highlight ring
  if (dist > radius - (w * 0.05)) {
    return [59, 130, 246, 255] // Sky blue accent
  }

  // Inner gradient from dark slate to deep indigo
  const gradientFactor = y / h
  const r = Math.floor(15 + 30 * gradientFactor)
  const g = Math.floor(23 + 45 * gradientFactor)
  const b = Math.floor(42 + 90 * gradientFactor)

  // Inner glowing code symbol (brackets or lightning / robot)
  const normX = Math.abs(x - cx) / w
  const normY = Math.abs(y - cy) / h
  if (normX < 0.22 && normY < 0.22) {
    // Center glowing core
    if (dist < w * 0.14) {
      return [96, 165, 250, 255] // Neon cyan/blue core
    }
  }

  return [r, g, b, 255]
}

// Generate 192x192, 512x512, and maskable PNG icons
console.log('Generating PWA icons...')
const icon192 = createPng(192, 192, antigravityIconColor)
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192)

const icon512 = createPng(512, 512, antigravityIconColor)
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512)

const iconMaskable = createPng(512, 512, (x, y, w, h) => {
  // Maskable full-bleed background
  const gradientFactor = (x + y) / (w + h)
  const r = Math.floor(15 + 20 * gradientFactor)
  const g = Math.floor(23 + 40 * gradientFactor)
  const b = Math.floor(42 + 80 * gradientFactor)

  const cx = w / 2
  const cy = h / 2
  const dist = Math.hypot(x - cx, y - cy)
  if (dist < w * 0.22) {
    return [96, 165, 250, 255]
  }
  if (dist < w * 0.26) {
    return [37, 99, 235, 255]
  }
  return [r, g, b, 255]
})
fs.writeFileSync(path.join(iconsDir, 'icon-maskable.png'), iconMaskable)

// Also create vector SVG icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8" />
      <stop offset="50%" stop-color="#6366f1" />
      <stop offset="100%" stop-color="#a855f7" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)" />
  <rect x="16" y="16" width="480" height="480" rx="96" fill="none" stroke="url(#accentGrad)" stroke-width="6" opacity="0.4" />
  
  <!-- Robot / AI Coder Emblem -->
  <g transform="translate(256, 256)" filter="url(#glow)">
    <!-- Circuit rings -->
    <circle r="140" fill="none" stroke="#38bdf8" stroke-width="4" stroke-dasharray="16 12" opacity="0.6" />
    <circle r="110" fill="#1e293b" stroke="url(#accentGrad)" stroke-width="6" />
    
    <!-- Code Brackets < / > and AI Core -->
    <path d="M-60 -40 L-95 0 L-60 40" fill="none" stroke="#38bdf8" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M60 -40 L95 0 L60 40" fill="none" stroke="#a855f7" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" />
    
    <!-- Core Spark -->
    <circle cx="0" cy="0" r="28" fill="url(#accentGrad)" />
    <polygon points="0,-18 6,-6 18,0 6,6 0,18 -6,6 -18,0 -6,-6" fill="#ffffff" />
  </g>
  
  <!-- Bottom App Label Accent -->
  <text x="256" y="440" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="34" fill="#f8fafc" letter-spacing="4">ANTIGRAVITY</text>
</svg>`

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svgContent)
console.log('PWA icons created successfully in public/icons/')

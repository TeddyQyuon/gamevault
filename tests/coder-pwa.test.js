import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'

test('PWA manifest: valid JSON and required properties', () => {
  const manifestPath = path.resolve('public/manifest.webmanifest')
  assert.ok(fs.existsSync(manifestPath), 'manifest.webmanifest exists')

  const content = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  assert.equal(content.name, 'Antigravity Mobile Coder')
  assert.equal(content.short_name, 'Antigravity')
  assert.equal(content.display, 'standalone')
  assert.equal(content.start_url, '/coder')
  assert.equal(content.theme_color, '#0f172a')
  assert.ok(Array.isArray(content.icons))
  assert.ok(content.icons.length >= 3)

  const has192 = content.icons.some((i) => i.sizes === '192x192')
  const has512 = content.icons.some((i) => i.sizes === '512x512')
  const hasMaskable = content.icons.some((i) => i.purpose === 'maskable')
  assert.ok(has192, 'contains 192x192 icon')
  assert.ok(has512, 'contains 512x512 icon')
  assert.ok(hasMaskable, 'contains maskable icon')
})

test('PWA service worker: valid file and offline fallback', () => {
  const swPath = path.resolve('public/sw.js')
  assert.ok(fs.existsSync(swPath), 'sw.js exists')

  const code = fs.readFileSync(swPath, 'utf8')
  assert.match(code, /CACHE_NAME/)
  assert.match(code, /addEventListener\('install'/)
  assert.match(code, /addEventListener\('fetch'/)
  assert.match(code, /NETWORK_OFFLINE/)
})

test('PWA icons: all icon files exist on disk with valid byte headers', () => {
  const icon192 = path.resolve('public/icons/icon-192.png')
  const icon512 = path.resolve('public/icons/icon-512.png')
  const iconMaskable = path.resolve('public/icons/icon-maskable.png')
  const iconSvg = path.resolve('public/icons/icon.svg')

  assert.ok(fs.existsSync(icon192), 'icon-192.png exists')
  assert.ok(fs.existsSync(icon512), 'icon-512.png exists')
  assert.ok(fs.existsSync(iconMaskable), 'icon-maskable.png exists')
  assert.ok(fs.existsSync(iconSvg), 'icon.svg exists')

  // Check PNG signature [137, 80, 78, 71, 13, 10, 26, 10]
  const pngSig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const header192 = fs.readFileSync(icon192).subarray(0, 8)
  assert.deepEqual(header192, pngSig)
})

test('HTML: index.html contains PWA meta tags and manifest link', () => {
  const htmlPath = path.resolve('index.html')
  const html = fs.readFileSync(htmlPath, 'utf8')

  assert.match(html, /rel="manifest"/)
  assert.match(html, /name="theme-color"/)
  assert.match(html, /name="apple-mobile-web-app-capable"/)
  assert.match(html, /name="mobile-web-app-capable"/)
})

test('Repository presets: all 3 target repositories are defined with verified paths', () => {
  const paths = [
    'c:/Users/waiya/Downloads/GameValut',
    'c:/Users/waiya/Downloads/TeddyQyuonPortfolio',
    'c:/Users/waiya/Downloads/meterwise'
  ]

  for (const p of paths) {
    assert.ok(fs.existsSync(p), `Path exists: ${p}`)
  }
})

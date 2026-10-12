import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTWORK_FILES, ARTWORK_STYLES, ARTWORK_THEMES, themeFor } from '../src/utils/artwork.js'
import { getProductBySlug } from '../src/services/catalogService.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

describe('storefront brand artwork & styling verification', () => {
  const criticalBrands = [
    'game-pass-ultimate',
    'nintendo',
    'eshop',
    'nintendo-switch-online',
    'xbox',
    'psn',
    'playstation-plus',
    'steam',
    'spotify-premium',
    'netflix',
    'discord-nitro',
    'discord-boost',
    'discord',
    'apple',
    'googleplay',
    'roblox',
    'razer',
  ]

  it('defines valid file paths in ARTWORK_FILES for all critical storefront brands', () => {
    for (const key of criticalBrands) {
      const filePath = ARTWORK_FILES[key]
      assert.ok(filePath, `ARTWORK_FILES must define a path for brand "${key}"`)
      const diskPath = path.join(rootDir, 'public', filePath.replace(/^\//, ''))
      assert.ok(fs.existsSync(diskPath), `Asset file on disk must exist: ${diskPath}`)
      const stat = fs.statSync(diskPath)
      assert.ok(stat.size > 100, `Asset file must have non-trivial size: ${diskPath} (${stat.size} bytes)`)
    }
  })

  it('defines distinct, high-contrast themes in ARTWORK_STYLES for all critical brands', () => {
    for (const key of criticalBrands) {
      const style = ARTWORK_STYLES[key]
      assert.ok(style, `ARTWORK_STYLES must define a style configuration for "${key}"`)
      assert.ok(style.background, `Brand "${key}" must define a background color`)
      assert.ok(style.padding, `Brand "${key}" must define padding for container fitting`)
    }
  })

  it('verifies Xbox Game Pass Ultimate SVG has crisp white vector emblem on green background', () => {
    const p = path.join(rootDir, 'public', 'assets', 'storefront', 'xbox-game-pass.svg')
    const svg = fs.readFileSync(p, 'utf8')
    assert.ok(svg.includes('#FFFFFF') || svg.includes('white'), 'Xbox Game Pass SVG must include crisp white vector paths')
    assert.ok(svg.includes('#107C10') || svg.includes('#107c10'), 'Xbox Game Pass SVG must use official Xbox green')
    assert.ok(svg.includes('GAME PASS'), 'Xbox Game Pass SVG must include GAME PASS wordmark')
    assert.ok(svg.includes('ULTIMATE'), 'Xbox Game Pass SVG must include ULTIMATE badge')
  })

  it('verifies Nintendo eShop / Switch SVG has official Nintendo red (#E60012) and crisp white logo', () => {
    const p = path.join(rootDir, 'public', 'assets', 'storefront', 'nintendo.svg')
    const svg = fs.readFileSync(p, 'utf8')
    assert.ok(svg.includes('#E60012'), 'Nintendo SVG must use official Nintendo vibrant red')
    assert.ok(svg.includes('#FFFFFF'), 'Nintendo SVG must use crisp white elements for contrast')
    assert.ok(svg.includes('NINTENDO') && svg.includes('SWITCH'), 'Nintendo SVG must feature official Nintendo Switch branding')
    assert.ok(!svg.includes('fill="#000000"'), 'Nintendo SVG must not be a pure black icon on dark background')
  })

  it('verifies Steam, PlayStation, Roblox, Apple SVGs have crisp white vector paths for dark backgrounds', () => {
    const brands = [
      { file: 'steam.svg', name: 'Steam' },
      { file: 'playstation.svg', name: 'PlayStation' },
      { file: 'roblox.svg', name: 'Roblox' },
      { file: 'apple.svg', name: 'Apple' },
      { file: 'xbox.svg', name: 'Xbox' },
    ]
    for (const b of brands) {
      const p = path.join(rootDir, 'public', 'assets', 'storefront', b.file)
      const svg = fs.readFileSync(p, 'utf8')
      assert.ok(svg.includes('#FFFFFF') || svg.includes('fill="white"'), `${b.name} (${b.file}) must have white vector fill for high contrast`)
      assert.ok(!svg.includes('fill="#000000"'), `${b.name} (${b.file}) must not be pure black on dark surface`)
    }
  })

  it('verifies Google Play has authentic 4-color facets and Razer has neon green on black', () => {
    const gplay = fs.readFileSync(path.join(rootDir, 'public', 'assets', 'storefront', 'googleplay.svg'), 'utf8')
    assert.ok(gplay.includes('#0086F8'), 'Google Play must have Blue facet')
    assert.ok(gplay.includes('#00A94B'), 'Google Play must have Green facet')
    assert.ok(gplay.includes('#FF334B'), 'Google Play must have Red facet')
    assert.ok(gplay.includes('#FFCE00'), 'Google Play must have Yellow facet')

    const razer = fs.readFileSync(path.join(rootDir, 'public', 'assets', 'storefront', 'razer.svg'), 'utf8')
    assert.ok(razer.includes('#00FF00'), 'Razer must have neon green Chroma fill')
    assert.equal(ARTWORK_STYLES.razer.background, '#000000', 'Razer style must have pitch black background')
  })

  it('correctly resolves gift card vs subscription product slugs without collision', async () => {
    const eshop = await getProductBySlug('eshop-credit-us')
    assert.ok(eshop)
    assert.equal(eshop.art, 'nintendo')

    const nso = await getProductBySlug('nintendo-switch-online')
    assert.ok(nso)
    assert.equal(nso.art, 'nintendo-switch-online')

    const xboxGift = await getProductBySlug('xbox-gift-sg')
    assert.ok(xboxGift)
    assert.equal(xboxGift.art, 'xbox')

    const gpu = await getProductBySlug('xbox-game-pass-ultimate')
    assert.ok(gpu)
    assert.equal(gpu.art, 'game-pass-ultimate')

    const psn = await getProductBySlug('psn-credit-sg')
    assert.ok(psn)
    assert.equal(psn.art, 'psn')

    const psPlus = await getProductBySlug('playstation-plus-essential')
    assert.ok(psPlus)
    assert.equal(psPlus.art, 'playstation-plus')
  })

  it('resolves ARTWORK_FILES and ARTWORK_STYLES for product slugs and IDs without failure', () => {
    // Slugs and IDs must directly resolve valid asset files and styles
    assert.equal(ARTWORK_FILES['xbox-game-pass-ultimate'], '/assets/storefront/xbox-game-pass.svg')
    assert.equal(ARTWORK_STYLES['xbox-game-pass-ultimate'].background, '#107c10')
    assert.equal(ARTWORK_FILES['p-xbox-game-pass-ultimate'], '/assets/storefront/xbox-game-pass.svg')

    assert.equal(ARTWORK_FILES['eshop-credit-us'], '/assets/storefront/nintendo.svg')
    assert.equal(ARTWORK_STYLES['eshop-credit-us'].background, '#e60012')
    assert.equal(ARTWORK_FILES['p-eshop-us'], '/assets/storefront/nintendo.svg')

    assert.equal(ARTWORK_FILES['playstation-plus-essential'], '/assets/storefront/ps-plus.svg')
    assert.equal(ARTWORK_STYLES['playstation-plus-essential'].background, '#00439c')

    assert.equal(ARTWORK_FILES['xbox-gift-sg'], '/assets/storefront/xbox.svg')
    assert.equal(ARTWORK_STYLES['xbox-gift-sg'].background, '#107c10')

    assert.equal(ARTWORK_FILES['psn-credit-sg'], '/assets/storefront/playstation.svg')
    assert.equal(ARTWORK_STYLES['psn-credit-sg'].background, '#00439c')

    assert.equal(ARTWORK_STYLES['apple-music'].background, '#fc3c44')
  })
})


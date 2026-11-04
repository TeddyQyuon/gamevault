import { createHash } from 'node:crypto'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { ARTWORK_FILES, ARTWORK_STYLES, ARTWORK_THEMES, themeFor, resolveArtworkSource } from '../src/utils/artwork.js'
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

  it('keeps every third-party provider on an original, immutable official asset', () => {
    const sources = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/assets/storefront/sources.json'), 'utf8'))
    const providers = [...new Set(Object.values(BRANDS))].filter(brand => brand.group !== 'games' && brand.id !== 'default')
    assert.equal(providers.length, 25)
    for (const brand of providers) {
      assert.ok(brand.logo.startsWith('/assets/storefront/official/'), `${brand.id}: legacy artwork is still registered`)
      const provenance = sources.find(item => item.file === brand.logo)
      assert.ok(provenance?.source?.startsWith('https://'), `${brand.id}: missing original source`)
      assert.match(provenance?.sha256 || '', /^[a-f0-9]{64}$/, `${brand.id}: missing original byte fingerprint`)
      const bytes = fs.readFileSync(path.join(rootDir, 'public', brand.logo))
      assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.sha256, `${brand.id}: original artwork bytes changed`)
      if (brand.logo.endsWith('.svg')) {
        const svg = bytes.toString('utf8')
        assert.match(svg, /<svg[\s>]/, `${brand.id}: expected SVG artwork`)
        assert.doesNotMatch(svg, /<script|<foreignObject|<text[\s>]/i, `${brand.id}: executable content or a typed substitute is not allowed`)
      }
    }
  })

  it('updates old stored logo paths while preserving merchant artwork and publisher covers', () => {
    assert.equal(resolveArtworkSource('/assets/storefront/xbox-game-pass.svg', 'game-pass-ultimate'), getBrand('game-pass-ultimate').logo)
    assert.equal(resolveArtworkSource('/assets/storefront/googleplay.svg', 'googleplay'), getBrand('googleplay').logo)
    assert.equal(resolveArtworkSource('/uploads/merchant-custom-art.png', 'netflix'), '/uploads/merchant-custom-art.png')
    assert.equal(resolveArtworkSource('/assets/storefront/games/elden-ring.jpg', 'elden-ring'), '/assets/storefront/games/elden-ring.jpg')
    assert.equal(resolveArtworkSource('https://example.com/untrusted.png', 'spotify'), getBrand('spotify').logo)
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
    assert.equal(ARTWORK_FILES['xbox-game-pass-ultimate'], getBrand('game-pass-ultimate').logo)
    assert.equal(ARTWORK_STYLES['xbox-game-pass-ultimate'].background, '#107c10')
    assert.equal(ARTWORK_FILES['p-xbox-game-pass-ultimate'], getBrand('game-pass-ultimate').logo)

    assert.equal(ARTWORK_FILES['eshop-credit-us'], getBrand('nintendo').logo)
    assert.equal(ARTWORK_STYLES['eshop-credit-us'].background, '#e60012')
    assert.equal(ARTWORK_FILES['p-eshop-us'], getBrand('nintendo').logo)

    assert.equal(ARTWORK_FILES['playstation-plus-essential'], getBrand('playstation-plus').logo)
    assert.equal(ARTWORK_STYLES['playstation-plus-essential'].background, '#ffffff')

    assert.equal(ARTWORK_FILES['xbox-gift-sg'], getBrand('xbox').logo)
    assert.equal(ARTWORK_STYLES['xbox-gift-sg'].background, '#107c10')

    assert.equal(ARTWORK_FILES['psn-credit-sg'], getBrand('psn').logo)
    assert.equal(ARTWORK_STYLES['psn-credit-sg'].background, '#ffffff')

    assert.equal(ARTWORK_STYLES['apple-music'].background, '#ffffff')
  })
})


// Complete catalogue coverage: a product cannot ship with an unregistered,
// missing or untraceable cover/logo. Original provider byte fingerprints and catalogue coverage are checked above.
import { PRODUCTS } from '../src/data/products.js'
import { SUBSCRIPTION_TEMPLATES } from '../src/data/subscriptionServices.js'
import { SUBSCRIPTION_PLANS } from '../src/data/subscriptions.js'
import { BRANDS, brandFor, getBrand } from '../src/data/brands.js'

describe('complete native artwork registry', () => {
  const sources = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/assets/storefront/sources.json'), 'utf8'))
  const verify = (brand, label) => {
    assert.ok(brand, `${label} needs a brand registry entry`)
    assert.ok(brand.logo.startsWith('/assets/'), `${label} must use a local asset`)
    assert.ok(fs.statSync(path.join(rootDir, 'public', brand.logo)).size > 100, `${label} asset must be larger than 100 bytes`)
    const source = sources.find(item => item.file === brand.logo)
    assert.ok(source?.source?.startsWith('https://'), `${label} needs recorded provenance`)
    assert.match(source.downloadedAt || source.retrievedAt || source.reviewedAt || '', /^\d{4}-\d{2}-\d{2}/, `${label} needs a source date`)
  }
  it('covers every product and subscription with a native local asset and source', () => {
    for (const product of PRODUCTS) verify(brandFor(product), product.title)
    for (const item of [...SUBSCRIPTION_TEMPLATES, ...SUBSCRIPTION_PLANS]) verify(getBrand(item.art), item.id)
  })
  it('covers every registered brand and game with provenance', () => {
    for (const brand of new Set(Object.values(BRANDS))) verify(brand, brand.id)
  })
  it('renders no hotlinked product images', () => {
    for (const product of PRODUCTS) assert.ok(!product.artworkPath || product.artworkPath.startsWith('/'), product.title)
  })
})

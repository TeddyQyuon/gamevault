// Refresh publisher game artwork without changing native logos, prices or stock.
// Run from the repository root: node scripts/fetch-storefront-assets.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { GAME_ART } from '../src/data/brands.js'

const root = new URL('../public/assets/storefront/', import.meta.url)
await mkdir(new URL('games/', root), { recursive: true })
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'))
const downloadedAt = new Date().toISOString().slice(0, 10)

async function save(file, url, extra = {}) {
  const response = await fetch(url, { signal: AbortSignal.timeout(25000) })
  if (!response.ok) return false
  const bytes = Buffer.from(await response.arrayBuffer())
  if (!response.headers.get('content-type')?.startsWith('image/') || bytes.length < 100) {
    throw new Error(`Invalid publisher image: ${url}`)
  }
  await writeFile(new URL(file, root), bytes)
  const local = `/assets/storefront/${file}`
  const at = sources.findIndex(item => item.file === local)
  const record = { file: local, source: url, downloadedAt, ...extra }
  if (at >= 0) sources[at] = record
  else sources.push(record)
  console.log(`Saved ${file} (${bytes.length} bytes)`)
  return true
}

// Bounded concurrency keeps the task reproducible without flooding publisher CDNs.
const queue = [...GAME_ART]
const failures = []
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const game = queue.shift()
    try {
      const base = `https://cdn.cloudflare.steamstatic.com/steam/apps/${game.appId}/`
      const portrait = await save(`games/${game.id}.jpg`, `${base}library_600x900.jpg`, { format: 'portrait' })
      if (!portrait) {
        if (!await save(`games/${game.id}.jpg`, `${base}header.jpg`, { format: 'landscape', fit: 'contain' })) {
          throw new Error('No portrait capsule or header image is available')
        }
        console.log(`${game.name}: landscape fallback; use contain over its blurred backdrop.`)
      }
      if (!await save(`games/${game.id}-header.jpg`, `${base}header.jpg`, { format: 'landscape' })) {
        throw new Error('Header image unavailable')
      }
    } catch (error) {
      failures.push(`${game.name}: ${error.message}`)
    }
  }
}))
await writeFile(new URL('sources.json', root), JSON.stringify(sources, null, 2) + '\n')
if (failures.length) {
  console.error(failures.join('\n'))
  process.exitCode = 1
}

import { mkdir, writeFile } from 'node:fs/promises'

const root = new URL('../public/assets/storefront/', import.meta.url)
await mkdir(root, { recursive: true })
const manifest = []
async function save(name, url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`)
  const bytes = Buffer.from(await response.arrayBuffer())
  await writeFile(new URL(name, root), bytes)
  manifest.push({ file: `/assets/storefront/${name}`, source: url })
  console.log(`Saved ${name} (${bytes.length} bytes)`)
}

const logos = ['steam', 'xbox', 'playstation', 'nintendoswitch', 'netflix', 'spotify']
for (const logo of logos) {
  try { await save(`${logo}.svg`, `https://cdn.simpleicons.org/${logo}`) }
  catch (error) { console.log(error.message) }
}
try {
  await save('gaming-photo.jpg', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=2000&q=90')
} catch (error) { console.log(error.message) }

for (const [name, appId] of [['elden-ring',1245620], ['forza-horizon-5',1551360], ['cyberpunk-2077',1091500], ['baldurs-gate-3',1086940]]) {
  try {
    const response = await fetch(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=sg&l=english`)
    const details = (await response.json())[appId]?.data
    if (details?.header_image) await save(`${name}.jpg`, details.header_image)
  } catch (error) { console.log(error.message) }
}

try {
  const response = await fetch('https://displaycatalog.mp.microsoft.com/v7.0/products?bigIds=CFQ7TTC0KHS0&market=SG&languages=en-sg')
  const data = await response.json()
  const images = data.Products?.[0]?.LocalizedProperties?.[0]?.Images || []
  const artwork = images.find((item) => item.ImagePurpose === 'Poster') || images.find((item) => item.ImagePurpose === 'BoxArt') || images[0]
  if (artwork?.Uri) await save('game-pass.jpg', artwork.Uri.startsWith('//') ? `https:${artwork.Uri}` : artwork.Uri)
} catch (error) { console.log(error.message) }

try {
  const page = await (await fetch('https://www.playstation.com/en-sg/ps-plus/')).text()
  const paths = [...new Set(page.match(/(?:https:\/\/gmedia\.playstation\.com\/is\/image\/SIEPDC\/|\/content\/dam\/global_pdc\/)[^"\s<>]+/g) || [])]
  const artwork = paths.find((path) => /essential.*image-block/i.test(path)) || paths.find((path) => /ps-plus.*(?:hero|keyart|essential)/i.test(path))
  if (artwork) await save('ps-plus.jpg', new URL(artwork.replace(/&amp;/g, '&'), 'https://www.playstation.com').href)
} catch (error) { console.log(error.message) }

await writeFile(new URL('sources.json', root), JSON.stringify(manifest, null, 2))

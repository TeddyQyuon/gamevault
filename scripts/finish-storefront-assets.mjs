import { writeFile, readFile } from 'node:fs/promises'
const root = new URL('../public/assets/storefront/', import.meta.url)
const sources = JSON.parse(await readFile(new URL('sources.json', root), 'utf8'))
for (const [name,url] of [
  ['psplus.png','https://gmedia.playstation.com/is/image/SIEPDC/ps-plus-black-badge-01-22sep20?$native--t$'],
  ['ps-plus.jpg','https://gmedia.playstation.com/is/image/SIEPDC/E922082D-377E-4135-A38E-8B8FA3B8EB64-ps-plus-interactive-wizard-essential-desktop-25sep26_en'],
  ['gaming-photo.jpg','https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?auto=format&fit=crop&w=2000&q=90'],
  ['xbox.svg','https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg'],
  ['nintendo.svg','https://upload.wikimedia.org/wikipedia/commons/5/5d/Nintendo_Switch_Logo.svg'],
]) {
  const response = await fetch(url)
  if (response.ok) {
    await writeFile(new URL(name,root), Buffer.from(await response.arrayBuffer()))
    const at=sources.findIndex(s=>s.file===`/assets/storefront/${name}`)
    if(at>=0)sources.splice(at,1)
    sources.push({file:`/assets/storefront/${name}`,source:url})
    console.log(`Saved ${name}`)
  } else console.log(`${name}: HTTP ${response.status}`)
}
for (const logo of ['apple','googleplay','roblox','razer']) {
  const url=`https://cdn.simpleicons.org/${logo}`
  const response=await fetch(url)
  if(response.ok){await writeFile(new URL(`${logo}.svg`,root),Buffer.from(await response.arrayBuffer()));sources.push({file:`/assets/storefront/${logo}.svg`,source:url});console.log(`Saved ${logo}`)}
}
const html=await(await fetch('https://www.playstation.com/en-sg/ps-plus/')).text()
const urls=[...new Set(html.match(/(?:https:\/\/gmedia\.playstation\.com\/is\/image\/SIEPDC\/|\/content\/dam\/global_pdc\/)[^"\s<>]+/g)||[])]
console.log(JSON.stringify(urls.filter(x=>/plus.*(?:logo|badge|essential)/i.test(x)).slice(0,15),null,2))
await writeFile(new URL('sources.json',root),JSON.stringify(sources,null,2))

// Native provider logos and publisher cover art. New artwork is registered once here.
// Colors describe the original brand tile, never the surrounding interface theme.
const A = '/assets/storefront/'
const entry = (id, name, logo, background, tag, group, source, padding = '18%') => ({
  id, name, logo: A + logo, background, fit: 'contain', padding, tag, group, source,
})

const providers = [
  entry('game-pass-ultimate', 'Xbox Game Pass', 'xbox-game-pass.svg', '#107c10', 'Gaming membership', 'gaming', 'https://www.xbox.com/en-US/xbox-game-pass'),
  entry('playstation-plus', 'PlayStation Plus', 'ps-plus.svg', '#00439c', 'Gaming membership', 'gaming', 'https://www.playstation.com/en-sg/ps-plus/'),
  entry('nintendo-switch-online', 'Nintendo Switch Online', 'nintendo-online.svg', '#e60012', 'Gaming membership', 'gaming', 'https://commons.wikimedia.org/wiki/File:Nintendo_Switch_Online_logo.svg'),
  entry('ea-play', 'EA Play', 'ea-play.svg', '#ffffff', 'Gaming membership', 'gaming', 'https://www.ea.com/ea-play', '14%'),
  entry('discord-nitro', 'Discord Nitro', 'discord-nitro.svg', '#1e1f22', 'Gaming membership', 'gaming', 'https://discord.com/branding'),
  entry('discord-boost', 'Discord', 'discord-boost.svg', '#1e1f22', 'Discord', 'gaming', 'https://discord.com/branding'),
  entry('netflix', 'Netflix', 'netflix.svg', '#080808', 'Video & streaming', 'video', 'https://commons.wikimedia.org/wiki/File:Netflix_2015_N_logo.svg', '27%'),
  entry('spotify-premium', 'Spotify', 'spotify.svg', '#191414', 'Music', 'music', 'https://cdn.simpleicons.org/spotify', '24%'),
  entry('disney-plus', 'Disney+', 'disney.svg', '#ffffff', 'Video & streaming', 'video', 'https://commons.wikimedia.org/wiki/File:Disney%2B_2024.svg'),
  entry('youtube-premium', 'YouTube', 'youtube.svg', '#ffffff', 'Video & streaming', 'video', 'https://cdn.simpleicons.org/youtube/FF0000'),
  entry('crunchyroll-premium', 'Crunchyroll', 'crunchyroll.svg', '#ffffff', 'Video & streaming', 'video', 'https://cdn.simpleicons.org/crunchyroll/F47521'),
  entry('apple-music', 'Apple Music', 'apple-music.svg', '#fc3c44', 'Music', 'music', 'https://commons.wikimedia.org/wiki/File:Apple_Music_Icon.svg', '16%'),
  entry('microsoft-365', 'Microsoft 365', 'microsoft365.svg', '#ffffff', 'Software', 'software', 'https://commons.wikimedia.org/wiki/File:Microsoft_365_(2022).svg'),
  entry('canva-pro', 'Canva', 'canva.svg', '#ffffff', 'Software', 'software', 'https://www.canva.com/'),
  entry('adobe-creative-cloud', 'Adobe', 'adobe.svg', '#ffffff', 'Software', 'software', 'https://commons.wikimedia.org/wiki/File:Adobe_Creative_Cloud_rainbow_icon.svg'),
  entry('nordvpn', 'NordVPN', 'nordvpn.svg', '#ffffff', 'VPN & security', 'vpn', 'https://cdn.simpleicons.org/nordvpn/4687FF'),
  entry('steam', 'Steam', 'steam.svg', '#171a21', 'Steam', 'platform', 'https://cdn.simpleicons.org/steam', '22%'),
  entry('psn', 'PlayStation', 'playstation.svg', '#00439c', 'PlayStation', 'platform', 'https://cdn.simpleicons.org/playstation', '20%'),
  entry('xbox', 'Xbox', 'xbox.svg', '#107c10', 'Xbox', 'platform', 'https://upload.wikimedia.org/wikipedia/commons/f/f9/Xbox_one_logo.svg', '20%'),
  entry('nintendo', 'Nintendo', 'nintendo.svg', '#e60012', 'Nintendo Switch', 'platform', 'https://www.nintendo.co.jp/common/v2/img/ncommon/_common/logo/switch.svg', '14%'),
  entry('apple', 'Apple', 'apple.svg', '#1c1c1e', 'Gift card', 'gift-cards', 'https://cdn.simpleicons.org/apple', '24%'),
  entry('googleplay', 'Google Play', 'googleplay.svg', '#202124', 'Gift card', 'gift-cards', 'https://cdn.simpleicons.org/googleplay', '22%'),
  entry('roblox', 'Roblox', 'roblox.svg', '#111216', 'Gift card', 'gift-cards', 'https://cdn.simpleicons.org/roblox', '22%'),
  entry('razer', 'Razer', 'razer.svg', '#000000', 'Gift card', 'gift-cards', 'https://cdn.simpleicons.org/razer', '20%'),
  entry('discord', 'Discord', 'discord.svg', '#1e1f22', 'Discord', 'gaming', 'https://cdn.simpleicons.org/discord/5865F2', '16%'),
  entry('default', 'GameVault', 'gamevault-logo.svg', 'var(--color-header)', 'Digital marketplace', 'marketplace', 'https://github.com/TeddyQyuon/gamevault', '12%'),
]

export const GAME_ART = [
  ['elden-ring', 'Elden Ring', 1245620],
  ['cyberpunk-2077', 'Cyberpunk 2077', 1091500],
  ['grand-theft-auto-v', 'Grand Theft Auto V', 271590],
  ['baldurs-gate-3', "Baldur's Gate 3", 1086940],
  ['hogwarts-legacy', 'Hogwarts Legacy', 990080],
  ['red-dead-redemption-2', 'Red Dead Redemption 2', 1174180],
  ['the-witcher-3', 'The Witcher 3: Wild Hunt', 292030],
  ['sekiro', 'Sekiro: Shadows Die Twice', 814380],
  ['hades', 'Hades', 1145360],
  ['dead-by-daylight', 'Dead by Daylight', 381210],
  ['helldivers-2', 'Helldivers 2', 553850],
  ['black-myth-wukong', 'Black Myth: Wukong', 2358720],
  ['resident-evil-4', 'Resident Evil 4', 2050650],
  ['doom-eternal', 'DOOM Eternal', 782330],
].map(([id, name, appId]) => ({
  id, name, appId, logo: A + `games/${id}.jpg`, hero: A + `games/${id}-header.jpg`,
  background: 'var(--color-artwork)', fit: 'cover', padding: '0%', tag: 'PC game', group: 'games',
  source: `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/library_600x900.jpg`,
}))

const aliases = {
  'xbox-game-pass-ultimate': 'game-pass-ultimate', 'playstation-plus-essential': 'playstation-plus',
  'netflix-premium': 'netflix', eshop: 'nintendo', playstation: 'psn', spotify: 'spotify-premium',
}
const registry = Object.fromEntries([...providers, ...GAME_ART].map(brand => [brand.id, brand]))
for (const [alias, id] of Object.entries(aliases)) registry[alias] = registry[id]
export const BRANDS = Object.freeze(registry)
export const getBrand = key => BRANDS[key] || null
export function brandFor(product) {
  if (!product) return null
  return getBrand(product.brandId || product.art) || getBrand(product.slug)
    || providers.find(brand => brand.name === product.brand) || null
}
export function platformBrandFor(platform) {
  const key = { 'PC (Steam)': 'steam', PlayStation: 'psn', Xbox: 'xbox', 'Nintendo Switch': 'nintendo', 'Apple Devices': 'apple' }[platform]
  return key ? getBrand(key) : null
}
export function platformBrandsFor(product) {
  return [...new Map((product?.platforms || []).map(platformBrandFor).filter(Boolean).map(brand => [brand.id, brand])).values()]
}

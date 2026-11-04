// Native provider logos and publisher cover art. New artwork is registered once here.
// Colors describe the original brand tile, never the surrounding interface theme.
const A = '/assets/storefront/'
const entry = (id, name, logo, background, tag, group, source, padding = '18%') => ({
  id, name, logo: A + logo, background, fit: 'contain', padding, tag, group, source,
})

const providers = [
  entry('game-pass-ultimate', 'Xbox Game Pass', 'official/xbox-game-pass.png', '#107c10', 'Gaming membership', 'gaming', 'https://cms-assets.xboxservices.com/assets/dc/a1/dca12e01-f367-4d86-a2c8-1ef23bfd593a.png?n=Game-Pass_SKU-Chart-0_3x-XGP-Logo-540_1225x150.png', '8%'),
  entry('playstation-plus', 'PlayStation Plus', 'official/ps-plus.svg', '#ffffff', 'Gaming membership', 'gaming', 'https://www.playstation.com/en-sg/ps-plus/', '8%'),
  entry('nintendo-switch-online', 'Nintendo Switch Online', 'official/nintendo-online.svg', '#e60012', 'Gaming membership', 'gaming', 'https://www.nintendo.com/sg/nintendo-switch-online/regions/img/img-logo.svg', '12%'),
  entry('ea-play', 'EA Play', 'official/ea-play.png', '#ffffff', 'Gaming membership', 'gaming', 'https://media.contentapi.ea.com/content/dam/eacom/subscription/ea-play/common/embed-code/color/ea-play-logo-hyper-crimson.png', '12%'),
  entry('discord-nitro', 'Discord Nitro', 'official/discord.svg', '#1e1f22', 'Gaming membership', 'gaming', 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d7f4ef6498ac018f2c55_Symbol.svg', '18%'),
  entry('discord-boost', 'Discord', 'official/discord.svg', '#1e1f22', 'Discord', 'gaming', 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d7f4ef6498ac018f2c55_Symbol.svg', '18%'),
  entry('netflix', 'Netflix', 'official/netflix.png', '#080808', 'Video & streaming', 'video', 'https://assets.ctfassets.net/4cd45et68cgf/5vCbQ45TfVUvWgm8eiDOtn/ef1c2431dc81f79ae93fcce649ae796f/Netflix_Symbol.zip', '20%'),
  entry('spotify-premium', 'Spotify', 'official/spotify.svg', '#191414', 'Music', 'music', 'https://developer.spotify.com/images/guidelines/design/2024-spotify-logo-icon.zip', '20%'),
  entry('disney-plus', 'Disney+', 'official/disney.png', '#040714', 'Video & streaming', 'video', 'https://cnbl-cdn.bamgrid.com/assets/3e17693b8248ad37a66f8d92439647627185b4da03e64e88c0b6edc7fb67fb7f/original', '12%'),
  entry('youtube-premium', 'YouTube', 'official/youtube.png', '#ffffff', 'Video & streaming', 'video', 'https://www.gstatic.com/marketing-cms/89/d9/cf95c4f345709f4998dc581221b0/youtube-icon.zip', '12%'),
  entry('crunchyroll-premium', 'Crunchyroll', 'official/crunchyroll.jpg', '#ffffff', 'Video & streaming', 'video', 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/51/e2/8f/51e28f69-7bc1-d9e1-5c7e-d636f53ed0d2/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg', '0%'),
  entry('apple-music', 'Apple Music', 'official/apple-music.png', '#ffffff', 'Music', 'music', 'https://www.apple.com/v/apple-music/ah/images/overview/apple_music_app_icon__ehrv06ssfpea_large.png', '12%'),
  entry('microsoft-365', 'Microsoft 365', 'official/microsoft365.png', '#ffffff', 'Software', 'software', 'https://uhf.microsoft.com/images/microsoft/RE1Mu3b.png', '8%'),
  entry('canva-pro', 'Canva', 'official/canva.jpg', '#ffffff', 'Software', 'software', 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b3/61/b0/b361b0a6-4295-6738-be3d-0f97418cfbf9/AppIcon-0-0-1x_U007epad-0-11-0-85-220.png/512x512bb.jpg', '0%'),
  entry('adobe-creative-cloud', 'Adobe', 'official/adobe.svg', '#ffffff', 'Software', 'software', 'https://www.adobe.com/cc-shared/assets/img/product-icons/svg/creative-cloud.svg', '18%'),
  entry('nordvpn', 'NordVPN', 'official/nordvpn.jpg', '#ffffff', 'VPN & security', 'vpn', 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/b1/28/64/b1286427-ec8b-81b0-26d8-9c0523cf1efc/AppIcon-0-0-1x_U007epad-0-1-0-85-220.png/512x512bb.jpg', '0%'),
  entry('steam', 'Steam', 'official/steam.svg', '#171a21', 'Steam', 'platform', 'https://store.fastly.steamstatic.com/public/shared/images/header/logo_steam.svg?t=962016', '10%'),
  entry('psn', 'PlayStation', 'official/playstation.svg', '#ffffff', 'PlayStation', 'platform', 'https://www.playstation.com/etc.clientlibs/global_pdc/clientlibs/auto-clientlibs/pdc.designkit/resources/ps-icons-map__dig__brand.svg#ps-icon_brand_playstation-family_logo', '8%'),
  entry('xbox', 'Xbox', 'official/xbox.png', '#107c10', 'Xbox', 'platform', 'https://uhf.microsoft.com/images/xbox/RW8TP2.png', '10%'),
  entry('nintendo', 'Nintendo', 'official/nintendo.svg', '#e60012', 'Nintendo Switch', 'platform', 'https://www.nintendo.co.jp/common/v2/img/ncommon/_common/logo/switch.svg', '14%'),
  entry('apple', 'Apple', 'official/apple.svg', '#ffffff', 'Gift card', 'gift-cards', 'https://www.apple.com/apple-music/', '0%'),
  entry('googleplay', 'Google Play', 'official/googleplay.svg', '#ffffff', 'Gift card', 'gift-cards', 'https://play.google.com/store/games', '18%'),
  entry('roblox', 'Roblox', 'official/roblox.svg', '#111216', 'Gift card', 'gift-cards', 'https://about.roblox.com/images/Roblox_Logo_White.svg', '10%'),
  entry('razer', 'Razer', 'official/razer.svg', '#000000', 'Gift card', 'gift-cards', 'https://assets2.razerzone.com/images/phoenix/razer-ths-logo.svg', '18%'),
  entry('discord', 'Discord', 'official/discord.svg', '#1e1f22', 'Discord', 'gaming', 'https://cdn.prod.website-files.com/6257adef93867e50d84d30e2/66e3d7f4ef6498ac018f2c55_Symbol.svg', '18%'),
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

// Migrate stored catalogue logo paths to the verified original provider files.
export const LEGACY_PROVIDER_ASSETS = Object.freeze({
  "/assets/storefront/xbox-game-pass.svg": "/assets/storefront/official/xbox-game-pass.png",
  "/assets/storefront/ps-plus.svg": "/assets/storefront/official/ps-plus.svg",
  "/assets/storefront/nintendo-online.svg": "/assets/storefront/official/nintendo-online.svg",
  "/assets/storefront/ea-play.svg": "/assets/storefront/official/ea-play.png",
  "/assets/storefront/discord-nitro.svg": "/assets/storefront/official/discord.svg",
  "/assets/storefront/discord-boost.svg": "/assets/storefront/official/discord.svg",
  "/assets/storefront/netflix.svg": "/assets/storefront/official/netflix.png",
  "/assets/storefront/spotify.svg": "/assets/storefront/official/spotify.svg",
  "/assets/storefront/disney.svg": "/assets/storefront/official/disney.png",
  "/assets/storefront/youtube.svg": "/assets/storefront/official/youtube.png",
  "/assets/storefront/crunchyroll.svg": "/assets/storefront/official/crunchyroll.jpg",
  "/assets/storefront/apple-music.svg": "/assets/storefront/official/apple-music.png",
  "/assets/storefront/microsoft365.svg": "/assets/storefront/official/microsoft365.png",
  "/assets/storefront/canva.svg": "/assets/storefront/official/canva.jpg",
  "/assets/storefront/adobe.svg": "/assets/storefront/official/adobe.svg",
  "/assets/storefront/nordvpn.svg": "/assets/storefront/official/nordvpn.jpg",
  "/assets/storefront/steam.svg": "/assets/storefront/official/steam.svg",
  "/assets/storefront/playstation.svg": "/assets/storefront/official/playstation.svg",
  "/assets/storefront/xbox.svg": "/assets/storefront/official/xbox.png",
  "/assets/storefront/nintendo.svg": "/assets/storefront/official/nintendo.svg",
  "/assets/storefront/apple.svg": "/assets/storefront/official/apple.svg",
  "/assets/storefront/googleplay.svg": "/assets/storefront/official/googleplay.svg",
  "/assets/storefront/roblox.svg": "/assets/storefront/official/roblox.svg",
  "/assets/storefront/razer.svg": "/assets/storefront/official/razer.svg",
  "/assets/storefront/discord.svg": "/assets/storefront/official/discord.svg"
})

// Original brand artwork and display styles shared by product cards,
// detail pages and cart thumbnails. Local assets retain their native colors.

import { SUBSCRIPTION_TEMPLATES } from '../data/subscriptionServices.js'
import { PRODUCTS } from '../data/products.js'

const BASE_ARTWORK_FILES = {
  'game-pass-ultimate': '/assets/storefront/xbox-game-pass.svg',
  'playstation-plus': '/assets/storefront/ps-plus.svg',
  netflix: '/assets/storefront/netflix.svg',
  'spotify-premium': '/assets/storefront/spotify.svg',
  'nintendo-switch-online': '/assets/storefront/nintendo-online.svg',
  'ea-play': '/assets/storefront/ea-play.svg',
  'discord-nitro': '/assets/storefront/discord-nitro.svg',
  'discord-boost': '/assets/storefront/discord-boost.svg',
  'canva-pro': '/assets/storefront/canva.svg',
  steam: '/assets/storefront/steam.svg',
  xbox: '/assets/storefront/xbox.svg',
  psn: '/assets/storefront/playstation.svg',
  nintendo: '/assets/storefront/nintendo.svg',
  eshop: '/assets/storefront/nintendo.svg',
  discord: '/assets/storefront/discord.svg',
  apple: '/assets/storefront/apple.svg',
  googleplay: '/assets/storefront/googleplay.svg',
  roblox: '/assets/storefront/roblox.svg',
  razer: '/assets/storefront/razer.svg',
  default: '/assets/storefront/gaming-photo.jpg',
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.art, service.artworkPath])),
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.id, service.artworkPath])),
}

export const ARTWORK_FILES = {
  ...BASE_ARTWORK_FILES,
  ...Object.fromEntries(PRODUCTS.map(p => [p.slug, p.artworkPath || BASE_ARTWORK_FILES[p.art] || BASE_ARTWORK_FILES.default])),
  ...Object.fromEntries(PRODUCTS.map(p => [p.id, p.artworkPath || BASE_ARTWORK_FILES[p.art] || BASE_ARTWORK_FILES.default])),
}

const BASE_ARTWORK_STYLES = {
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.art, { background: service.background, fit: service.artworkFit || 'contain', padding: '14%' }])),
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.id, { background: service.background, fit: service.artworkFit || 'contain', padding: '14%' }])),
  'game-pass-ultimate': { background: '#107c10', fit: 'contain', padding: '14%' },
  'playstation-plus': { background: '#00439c', fit: 'contain', padding: '14%' },
  netflix: { background: '#080808', fit: 'contain', padding: '27%' },
  'spotify-premium': { background: '#191414', fit: 'contain', padding: '24%' },
  'nintendo-switch-online': { background: '#e60012', fit: 'contain', padding: '14%' },
  'ea-play': { background: '#fff', fit: 'contain', padding: '14%' },
  'discord-nitro': { background: '#1e1f22', fit: 'contain', padding: '14%' },
  'discord-boost': { background: '#1e1f22', fit: 'contain', padding: '14%' },
  discord: { background: '#1e1f22', fit: 'contain', padding: '16%' },
  'canva-pro': { background: '#fff', fit: 'contain', padding: '14%' },
  steam: { background: '#171a21', fit: 'contain', padding: '22%' },
  xbox: { background: '#107c10', fit: 'contain', padding: '20%' },
  psn: { background: '#00439c', fit: 'contain', padding: '20%' },
  nintendo: { background: '#e60012', fit: 'contain', padding: '14%' },
  eshop: { background: '#e60012', fit: 'contain', padding: '14%' },
  apple: { background: '#1c1c1e', fit: 'contain', padding: '24%' },
  googleplay: { background: '#202124', fit: 'contain', padding: '22%' },
  roblox: { background: '#111216', fit: 'contain', padding: '22%' },
  razer: { background: '#000000', fit: 'contain', padding: '20%' },
}

export const ARTWORK_STYLES = {
  ...BASE_ARTWORK_STYLES,
  ...Object.fromEntries(PRODUCTS.filter(p => BASE_ARTWORK_STYLES[p.art]).map(p => [p.slug, BASE_ARTWORK_STYLES[p.art]])),
  ...Object.fromEntries(PRODUCTS.filter(p => BASE_ARTWORK_STYLES[p.art]).map(p => [p.id, BASE_ARTWORK_STYLES[p.art]])),
}

const BASE_ARTWORK_THEMES = {
  'elden-ring': { from: '#b8860b', to: '#1c1917', icon: 'swords', tag: 'Open World RPG' },
  'cyberpunk-2077': { from: '#fcee0a', to: '#0f0f23', icon: 'zap', tag: 'Open-World RPG' },
  'grand-theft-auto-v': { from: '#0a9b4a', to: '#0b0f0c', icon: 'car', tag: 'Open World Action' },
  'baldurs-gate-3': { from: '#c19a6b', to: '#2a1a0f', icon: 'sparkles', tag: 'Party RPG' },
  'hogwarts-legacy': { from: '#7c0a02', to: '#1c1917', icon: 'castle', tag: 'Wizarding RPG' },
  'red-dead-redemption-2': { from: '#8b0000', to: '#201a19', icon: 'mountain', tag: 'Western Epic' },
  'the-witcher-3': { from: '#4a5d23', to: '#1a1a10', icon: 'swords', tag: 'Monster Slayer RPG' },
  sekiro: { from: '#7a1f1f', to: '#111111', icon: 'swords', tag: 'Shinobi Action' },
  hades: { from: '#d7263d', to: '#1a0505', icon: 'flame', tag: 'Roguelike' },
  'dead-by-daylight': { from: '#3b0d0d', to: '#0a0a0a', icon: 'ghost', tag: 'Asymmetric Horror' },
  'helldivers-2': { from: '#f5b301', to: '#14213d', icon: 'shield', tag: 'Co-op Shooter' },
  'black-myth-wukong': { from: '#d4a017', to: '#101418', icon: 'sparkles', tag: 'Mythic Action' },
  'resident-evil-4': { from: '#5c0e0e', to: '#0d0d0d', icon: 'ghost', tag: 'Survival Horror' },
  'doom-eternal': { from: '#ff2a00', to: '#1a0a00', icon: 'flame', tag: 'Slayer Shooter' },
  // Brand & subscription plans fallback themes
  'game-pass-ultimate': { from: '#107C10', to: '#041f04', icon: 'gamepad', tag: 'Games Membership' },
  'playstation-plus': { from: '#0070D1', to: '#0c1a3a', icon: 'swords', tag: 'Online Multiplayer' },
  netflix: { from: '#E50914', to: '#1a0505', icon: 'sparkles', tag: 'Movies & Series' },
  'spotify-premium': { from: '#1DB954', to: '#052e14', icon: 'sparkles', tag: 'Music Streaming' },
  'nintendo-switch-online': { from: '#E60012', to: '#2a0208', icon: 'gamepad', tag: 'Online Multiplayer' },
  nintendo: { from: '#E60012', to: '#2a0208', icon: 'gamepad', tag: 'Nintendo eShop' },
  eshop: { from: '#E60012', to: '#2a0208', icon: 'gamepad', tag: 'Nintendo eShop' },
  xbox: { from: '#107C10', to: '#063d06', icon: 'gamepad', tag: 'Xbox Store' },
  psn: { from: '#0070D1', to: '#002664', icon: 'gamepad', tag: 'PlayStation Network' },
  steam: { from: '#171a21', to: '#2a475e', icon: 'gamepad', tag: 'Steam Wallet' },
  apple: { from: '#1c1c1e', to: '#3a3a3c', icon: 'sparkles', tag: 'Apple Gift Card' },
  googleplay: { from: '#0086F8', to: '#00A94B', icon: 'sparkles', tag: 'Google Play' },
  roblox: { from: '#111216', to: '#232527', icon: 'gamepad', tag: 'Roblox' },
  razer: { from: '#00FF00', to: '#003300', icon: 'zap', tag: 'Razer Gold' },
  'discord-nitro': { from: '#5865F2', to: '#2b3177', icon: 'sparkles', tag: 'Discord Nitro' },
  'discord-boost': { from: '#FF73FA', to: '#EB459E', icon: 'sparkles', tag: 'Server Boost' },
  discord: { from: '#5865F2', to: '#2b3177', icon: 'sparkles', tag: 'Discord' },
  default: { from: '#2855FF', to: '#8B5CF6', icon: 'gamepad', tag: 'GameVault' },
}

export const ARTWORK_THEMES = {
  ...BASE_ARTWORK_THEMES,
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.filter(s => BASE_ARTWORK_THEMES[s.art]).map(s => [s.id, BASE_ARTWORK_THEMES[s.art]])),
  ...Object.fromEntries(PRODUCTS.filter(p => BASE_ARTWORK_THEMES[p.art]).map(p => [p.slug, BASE_ARTWORK_THEMES[p.art]])),
  ...Object.fromEntries(PRODUCTS.filter(p => BASE_ARTWORK_THEMES[p.art]).map(p => [p.id, BASE_ARTWORK_THEMES[p.art]])),
}

export function themeFor(key) {
  return ARTWORK_THEMES[key] || ARTWORK_THEMES.default
}

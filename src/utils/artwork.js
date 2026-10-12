// Original brand artwork and display styles shared by product cards,
// detail pages and cart thumbnails. Local assets retain their native colors.

import { SUBSCRIPTION_TEMPLATES } from '../data/subscriptionServices.js'
import { PRODUCTS } from '../data/products.js'

const BASE_ARTWORK_FILES = {
  ...Object.fromEntries(['stormlands','neon-drift','shadow-realm','galaxy-frontiers','rivals-arena','mythic-tales','emberfall','neon-circuit','starborne','valkyrie-protocol','pixel-quest','ironclad-tactics','drift-horizon','cursed-hollow'].map(key => [key, `/assets/${key}.jpg`])),
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
  stormlands: { from: '#2855FF', to: '#0ea5e9', icon: 'mountain', tag: 'Open World RPG' },
  'neon-drift': { from: '#d946ef', to: '#2855FF', icon: 'car', tag: 'Neon Racing' },
  'shadow-realm': { from: '#7c3aed', to: '#0f172a', icon: 'ghost', tag: 'Dark Fantasy' },
  'galaxy-frontiers': { from: '#0ea5e9', to: '#6366f1', icon: 'rocket', tag: 'Space Epic' },
  'rivals-arena': { from: '#f59e0b', to: '#ef4444', icon: 'swords', tag: 'Arena Shooter' },
  'mythic-tales': { from: '#10b981', to: '#2855FF', icon: 'castle', tag: 'Fantasy Adventure' },
  emberfall: { from: '#f97316', to: '#7c2d12', icon: 'flame', tag: 'Action RPG' },
  'neon-circuit': { from: '#ec4899', to: '#4f46e5', icon: 'zap', tag: 'Arcade Racing' },
  starborne: { from: '#38bdf8', to: '#1e1b4b', icon: 'sparkles', tag: 'Space Adventure' },
  'valkyrie-protocol': { from: '#ef4444', to: '#1f2937', icon: 'shield', tag: 'Tactical Shooter' },
  'pixel-quest': { from: '#22c55e', to: '#a16207', icon: 'gamepad', tag: 'Indie Adventure' },
  'ironclad-tactics': { from: '#f97316', to: '#334155', icon: 'bot', tag: 'Mech Strategy' },
  'drift-horizon': { from: '#8b5cf6', to: '#ec4899', icon: 'car', tag: 'Street Racing' },
  'cursed-hollow': { from: '#6d28d9', to: '#020617', icon: 'moon', tag: 'Survival Horror' },
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

// Original brand artwork and display styles shared by product cards,
// detail pages and cart thumbnails. Local assets retain their native colors.

import { SUBSCRIPTION_TEMPLATES } from '../data/subscriptionServices.js'

export const ARTWORK_FILES = {
  ...Object.fromEntries(['stormlands','neon-drift','shadow-realm','galaxy-frontiers','rivals-arena','mythic-tales','emberfall','neon-circuit','starborne','valkyrie-protocol','pixel-quest','ironclad-tactics','drift-horizon','cursed-hollow'].map(key => [key, `/assets/${key}.jpg`])),
  'game-pass-ultimate': '/assets/storefront/game-pass.jpg',
  'playstation-plus': '/assets/storefront/psplus.png',
  netflix: '/assets/storefront/netflix.svg',
  'spotify-premium': '/assets/storefront/spotify.svg',
  'nintendo-switch-online': '/assets/storefront/nintendo.svg',
  'ea-play': '/assets/storefront/ea.svg',
  'discord-nitro': '/assets/storefront/discord.svg',
  steam: '/assets/storefront/steam.svg',
  xbox: '/assets/storefront/xbox.svg',
  psn: '/assets/storefront/playstation.svg',
  apple: '/assets/storefront/apple.svg',
  googleplay: '/assets/storefront/googleplay.svg',
  roblox: '/assets/storefront/roblox.svg',
  razer: '/assets/storefront/razer.svg',
  default: '/assets/storefront/gaming-photo.jpg',
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.art, service.artworkPath])),
}

export const ARTWORK_STYLES = {
  ...Object.fromEntries(SUBSCRIPTION_TEMPLATES.map(service => [service.art, { background: service.background, fit: 'contain', padding: '14%' }])),
  'game-pass-ultimate': { background: '#087b08', fit: 'contain' },
  'playstation-plus': { background: '#ffdc22', fit: 'contain', padding: '18%' },
  netflix: { background: '#080808', fit: 'contain', padding: '27%' },
  'spotify-premium': { background: '#191414', fit: 'contain', padding: '24%' },
  'nintendo-switch-online': { background: '#fff', fit: 'contain', padding: '22%' },
  'ea-play': { background: '#fff', fit: 'contain', padding: '24%' },
  'discord-nitro': { background: '#fff', fit: 'contain', padding: '24%' },
  steam: { background: '#e7f0f5', fit: 'contain', padding: '24%' },
  xbox: { background: '#e8f3e7', fit: 'contain', padding: '23%' },
  psn: { background: '#e8ecf9', fit: 'contain', padding: '22%' },
  apple: { background: '#f0edf6', fit: 'contain', padding: '27%' },
  googleplay: { background: '#eef7f4', fit: 'contain', padding: '24%' },
  roblox: { background: '#eef0f2', fit: 'contain', padding: '24%' },
  razer: { background: '#d9f0da', fit: 'contain', padding: '24%' },
}

export const ARTWORK_THEMES = {
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
  // Subscription plans (fallback theme if the SVG file is missing).
  'game-pass-ultimate': { from: '#107C10', to: '#041f04', icon: 'gamepad', tag: 'Games Membership' },
  'playstation-plus': { from: '#0070D1', to: '#0c1a3a', icon: 'swords', tag: 'Online Multiplayer' },
  netflix: { from: '#E50914', to: '#1a0505', icon: 'sparkles', tag: 'Movies & Series' },
  'spotify-premium': { from: '#1DB954', to: '#052e14', icon: 'sparkles', tag: 'Music Streaming' },
  'nintendo-switch-online': { from: '#E60012', to: '#2a0208', icon: 'gamepad', tag: 'Online Multiplayer' },
  default: { from: '#2855FF', to: '#8B5CF6', icon: 'gamepad', tag: 'GameVault' },
}

export function themeFor(key) {
  return ARTWORK_THEMES[key] || ARTWORK_THEMES.default
}

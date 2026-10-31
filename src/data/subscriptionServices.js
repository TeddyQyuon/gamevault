// Original provider artwork is stored locally. Prices and supply terms are
// reviewed by the merchant before an offer is published.
import { getBrand } from './brands.js'
export const SUBSCRIPTION_TEMPLATES = [
  { id: 'xbox-game-pass-ultimate', brand: 'Xbox', label: 'Xbox Game Pass', title: 'Xbox Game Pass Ultimate', tone: 'xbox', query: 'Game Pass', art: 'game-pass-ultimate' },
  { id: 'playstation-plus-essential', brand: 'PlayStation', label: 'PlayStation Plus', title: 'PlayStation Plus Essential', tone: 'playstation', query: 'PlayStation Plus', art: 'playstation-plus' },
  { id: 'nintendo-switch-online', brand: 'Nintendo', label: 'Nintendo Switch Online', title: 'Nintendo Switch Online', tone: 'nintendo', query: 'Nintendo Switch Online', art: 'nintendo-switch-online' },
  { id: 'ea-play', brand: 'EA', label: 'EA Play', title: 'EA Play', tone: 'ea', query: 'EA Play', art: 'ea-play' },
  { id: 'discord-nitro', brand: 'Discord', label: 'Discord Nitro', title: 'Discord Nitro', tone: 'discord', query: 'Discord', art: 'discord-nitro' },
  { id: 'netflix-premium', brand: 'Netflix', label: 'Netflix', title: 'Netflix Premium', tone: 'netflix', query: 'Netflix', art: 'netflix' },
  { id: 'spotify-premium', brand: 'Spotify', label: 'Spotify Premium', title: 'Spotify Premium Individual', tone: 'spotify', query: 'Spotify', art: 'spotify-premium' },
  { id: 'disney-plus', brand: 'Disney+', label: 'Disney+', title: 'Disney+ Premium', tone: 'disney', query: 'Disney', art: 'disney-plus' },
  { id: 'youtube-premium', brand: 'YouTube', label: 'YouTube Premium', title: 'YouTube Premium Individual', tone: 'youtube', query: 'YouTube', art: 'youtube-premium' },
  { id: 'crunchyroll-premium', brand: 'Crunchyroll', label: 'Crunchyroll', title: 'Crunchyroll Premium Fan', tone: 'crunchyroll', query: 'Crunchyroll', art: 'crunchyroll-premium' },
  { id: 'apple-music', brand: 'Apple Music', label: 'Apple Music', title: 'Apple Music Individual', tone: 'applemusic', query: 'Apple Music', art: 'apple-music' },
  { id: 'microsoft-365', brand: 'Microsoft 365', label: 'Microsoft 365', title: 'Microsoft 365 Personal', tone: 'microsoft365', query: 'Microsoft 365', art: 'microsoft-365' },
  { id: 'canva-pro', brand: 'Canva', label: 'Canva Pro', title: 'Canva Pro', tone: 'canva', query: 'Canva', art: 'canva-pro' },
  { id: 'adobe-creative-cloud', brand: 'Adobe', label: 'Adobe Creative Cloud', title: 'Adobe Creative Cloud Pro', tone: 'adobe', query: 'Adobe', art: 'adobe-creative-cloud' },
  { id: 'nordvpn', brand: 'NordVPN', label: 'NordVPN', title: 'NordVPN Basic', tone: 'nordvpn', query: 'NordVPN', art: 'nordvpn' },
] .map(template => {
  const brand = getBrand(template.art)
  return { ...template, group: brand.group, icon: brand.logo, artworkPath: brand.logo, artworkFit: brand.fit, background: brand.background }
})

export function subscriptionServiceFor(product) {
  return SUBSCRIPTION_TEMPLATES.find(service => product.brand === service.brand)
    || SUBSCRIPTION_TEMPLATES.find(service => product.title.toLowerCase().includes(service.query.toLowerCase()))
}

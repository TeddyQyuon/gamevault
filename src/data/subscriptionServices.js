// Original provider artwork is stored locally. Prices and supply terms are
// reviewed by the merchant before an offer is published.
const A = '/assets/storefront/'
export const SUBSCRIPTION_TEMPLATES = [
  { id: 'xbox-game-pass-ultimate', brand: 'Xbox', label: 'Xbox Game Pass', title: 'Xbox Game Pass Ultimate', tone: 'xbox', query: 'Game Pass', group: 'gaming', art: 'game-pass-ultimate', icon: A+'xbox-game-pass.svg', artworkPath: A+'xbox-game-pass.svg', artworkFit: 'contain', background: '#107c10' },
  { id: 'playstation-plus-essential', brand: 'PlayStation', label: 'PlayStation Plus', title: 'PlayStation Plus Essential', tone: 'playstation', query: 'PlayStation Plus', group: 'gaming', art: 'playstation-plus', icon: A+'ps-plus.svg', artworkPath: A+'ps-plus.svg', artworkFit: 'contain', background: '#00439c' },
  { id: 'nintendo-switch-online', brand: 'Nintendo', label: 'Nintendo Switch Online', title: 'Nintendo Switch Online', tone: 'nintendo', query: 'Nintendo Switch Online', group: 'gaming', art: 'nintendo-switch-online', icon: A+'nintendo-online.svg', artworkPath: A+'nintendo-online.svg', artworkFit: 'contain', background: '#e60012' },
  { id: 'ea-play', brand: 'EA', label: 'EA Play', title: 'EA Play', tone: 'ea', query: 'EA Play', group: 'gaming', art: 'ea-play', icon: A+'ea-play.svg', artworkPath: A+'ea-play.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'discord-nitro', brand: 'Discord', label: 'Discord Nitro', title: 'Discord Nitro', tone: 'discord', query: 'Discord', group: 'gaming', art: 'discord-nitro', icon: A+'discord-nitro.svg', artworkPath: A+'discord-nitro.svg', artworkFit: 'contain', background: '#1e1f22' },
  { id: 'netflix-premium', brand: 'Netflix', label: 'Netflix', title: 'Netflix Premium', tone: 'netflix', query: 'Netflix', group: 'video', art: 'netflix', icon: A+'netflix.svg', artworkPath: A+'netflix.svg', artworkFit: 'contain', background: '#080808' },
  { id: 'spotify-premium', brand: 'Spotify', label: 'Spotify Premium', title: 'Spotify Premium Individual', tone: 'spotify', query: 'Spotify', group: 'music', art: 'spotify-premium', icon: A+'spotify.svg', artworkPath: A+'spotify.svg', artworkFit: 'contain', background: '#191414' },
  { id: 'disney-plus', brand: 'Disney+', label: 'Disney+', title: 'Disney+ Premium', tone: 'disney', query: 'Disney', group: 'video', art: 'disney-plus', icon: A+'disney.svg', artworkPath: A+'disney.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'youtube-premium', brand: 'YouTube', label: 'YouTube Premium', title: 'YouTube Premium Individual', tone: 'youtube', query: 'YouTube', group: 'video', art: 'youtube-premium', icon: A+'youtube.svg', artworkPath: A+'youtube.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'crunchyroll-premium', brand: 'Crunchyroll', label: 'Crunchyroll', title: 'Crunchyroll Premium Fan', tone: 'crunchyroll', query: 'Crunchyroll', group: 'video', art: 'crunchyroll-premium', icon: A+'crunchyroll.svg', artworkPath: A+'crunchyroll.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'apple-music', brand: 'Apple Music', label: 'Apple Music', title: 'Apple Music Individual', tone: 'applemusic', query: 'Apple Music', group: 'music', art: 'apple-music', icon: A+'apple-music.svg', artworkPath: A+'apple-music.svg', artworkFit: 'contain', background: '#fc3c44' },
  { id: 'microsoft-365', brand: 'Microsoft 365', label: 'Microsoft 365', title: 'Microsoft 365 Personal', tone: 'microsoft365', query: 'Microsoft 365', group: 'software', art: 'microsoft-365', icon: A+'microsoft365.svg', artworkPath: A+'microsoft365.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'canva-pro', brand: 'Canva', label: 'Canva Pro', title: 'Canva Pro', tone: 'canva', query: 'Canva', group: 'software', art: 'canva-pro', icon: A+'canva.svg', artworkPath: A+'canva.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'adobe-creative-cloud', brand: 'Adobe', label: 'Adobe Creative Cloud', title: 'Adobe Creative Cloud Pro', tone: 'adobe', query: 'Adobe', group: 'software', art: 'adobe-creative-cloud', icon: A+'adobe.svg', artworkPath: A+'adobe.svg', artworkFit: 'contain', background: '#fff' },
  { id: 'nordvpn', brand: 'NordVPN', label: 'NordVPN', title: 'NordVPN Basic', tone: 'nordvpn', query: 'NordVPN', group: 'vpn', art: 'nordvpn', icon: A+'nordvpn.svg', artworkPath: A+'nordvpn.svg', artworkFit: 'contain', background: '#fff' },
]

export function subscriptionServiceFor(product) {
  return SUBSCRIPTION_TEMPLATES.find(service => product.brand === service.brand)
    || SUBSCRIPTION_TEMPLATES.find(service => product.title.toLowerCase().includes(service.query.toLowerCase()))
}

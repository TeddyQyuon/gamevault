// Real subscription services sold on marketplaces like G2A.
// Prices are integer cents (SGD). Yearly savings are CALCULATED, never hardcoded.

export const SUBSCRIPTION_PLANS = [
  {
    id: 'game-pass-ultimate', name: 'Xbox Game Pass Ultimate', blurb: 'Hundreds of PC & console games',
    color: '#107C10', badge: 'Most popular', productSlug: 'game-pass-ultimate', art: 'game-pass-ultimate',
    monthlyCents: 1690, yearlyCents: 16900,
    library: '500+', movies: false, music: false, multiplayer: true,
    features: ['Access to 500+ premium games', 'New titles added monthly', 'PC & console library', 'Online multiplayer', 'EA Play included'],
  },
  {
    id: 'playstation-plus', name: 'PlayStation Plus', blurb: 'Online play & monthly games',
    color: '#0070D1', productSlug: 'playstation-plus', art: 'playstation-plus',
    monthlyCents: 1090, yearlyCents: 10900,
    library: '—', movies: false, music: false, multiplayer: true,
    features: ['Online multiplayer access', 'Free monthly games', 'Exclusive member deals', 'Cloud saves', 'Early access to betas'],
  },
  {
    id: 'netflix', name: 'Netflix', blurb: 'Blockbusters, series & originals',
    color: '#E50914', productSlug: 'netflix', art: 'netflix',
    monthlyCents: 1499, yearlyCents: 14990,
    library: '—', movies: 'Thousands', music: false, multiplayer: false,
    features: ['Thousands of movies & TV shows', 'Exclusive originals', 'HD, Full HD & 4K streaming', 'Watch on all your devices', 'Ad-free entertainment'],
  },
  {
    id: 'spotify-premium', name: 'Spotify Premium', blurb: 'Millions of songs. Ad-free.',
    color: '#1DB954', productSlug: 'spotify-premium', art: 'spotify-premium',
    monthlyCents: 1099, yearlyCents: 10990,
    library: '—', movies: false, music: '100M+', multiplayer: false,
    features: ['100M+ songs and playlists', 'Ad-free listening', 'High-quality audio (Lossless)', 'Offline downloads', 'Gaming-focused playlists'],
  },
  {
    id: 'nintendo-switch-online', name: 'Nintendo Switch Online', blurb: 'Play together. Get more.',
    color: '#E60012', productSlug: 'nintendo-switch-online', art: 'nintendo-switch-online',
    monthlyCents: 399, yearlyCents: 3990,
    library: '—', movies: false, music: false, multiplayer: true,
    features: ['Online multiplayer access', 'Classic NES & SNES library', 'Exclusive member deals', 'Cloud saves', 'Premium community features'],
  },
]

/** Equivalent monthly cost + savings for a yearly plan. */
export function yearlyMath(plan) {
  const monthlyTotal = plan.monthlyCents * 12
  const savings = monthlyTotal - plan.yearlyCents
  const pct = Math.round((savings / monthlyTotal) * 100)
  return { monthlyTotal, savings, pct, equivalentMonthly: plan.yearlyCents / 12 }
}

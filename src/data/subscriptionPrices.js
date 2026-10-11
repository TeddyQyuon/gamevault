// Research references, not supplier costs or guaranteed resale margins.
// Account listings, keys and retail plans have different delivery requirements.
export const PRICE_RESEARCH_DATE = '2026-10-08'
export const PRICE_FX = { date: '2026-10-07', usdToSgd: 1.2804, source: 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=SGD' }
const ref = (amount, currency, label, format, region, source) => ({ amount, currency, label, format, region, source, observedAt: PRICE_RESEARCH_DATE, priceCents: Math.round(amount * (currency === 'USD' ? PRICE_FX.usdToSgd : 1) * 100) })
export const SUBSCRIPTION_PRICES = {
  'xbox-game-pass-ultimate': ref(15.29, 'USD', '1 month · Ultimate', 'Key', 'Global listing; check activation countries', 'https://www.g2a.com/category/gaming-subscriptions-c1459'),
  'playstation-plus-essential': ref(56.27, 'USD', '12 months · Essential', 'Account', 'Global account listing', 'https://www.g2a.com/category/gaming-subscriptions-c1459'),
  'nintendo-switch-online': ref(19.99, 'USD', '12 months · Individual', 'Official retail', 'United States retail', 'https://en-americas-support.nintendo.com/app/answers/detail/a_id/41194/p/1096'),
  'ea-play': ref(5.99, 'USD', '1 month · EA Play', 'Official retail', 'United States retail', 'https://www.ea.com/ea-play/faq'),
  'discord-nitro': ref(9.99, 'USD', '1 month · Nitro', 'Official retail', 'United States retail', 'https://support.discord.com/hc/en-us/articles/4407269525911-Nitro-Localized-Pricing-FAQ'),
  'netflix-premium': ref(9, 'USD', '1 month · Premium', 'Account', 'Global account listing', 'https://www.g2a.com/netflix-account-premium-1-month-netflix-account-account-global-i10000337248001'),
  'spotify-premium': ref(4.29, 'USD', '1 month · Individual', 'Account', 'Global account listing', 'https://www.g2a.com/spotify-premium-subscription-card-individual-1-month-spotify-account-account-global-i10000000243146'),
  'disney-plus': ref(7.91, 'USD', '1 month · Premium', 'Account', 'Global listing; United States excluded', 'https://www.g2a.com/disney-plus-p10000325714'),
  'youtube-premium': ref(2.24, 'USD', '1 month · Individual', 'Account', 'Global account listing', 'https://www.g2a.com/youtube-premium-individual-1-month-youtube-account-account-global-i10000337507019'),
  'crunchyroll-premium': ref(16.57, 'USD', '1 month · Fan', 'Key', 'Global key listing', 'https://www.g2a.com/es/crunchyroll-premium-fan-1-month-crunchyroll-key-global-i10000271997006'),
  'apple-music': ref(11.98, 'SGD', '1 month · Individual', 'Official retail', 'Singapore retail', 'https://www.apple.com/sg/apple-music/'),
  'microsoft-365': ref(154.99, 'SGD', '12 months · Personal', 'Official retail', 'Singapore retail', 'https://www.microsoft.com/en-sg/microsoft-365/p/microsoft-365-personal/cfq7ttc0k5bf'),
  'canva-pro': ref(2.85, 'USD', '12 months · Pro', 'Account', 'Global account listing; displayed regular offer', 'https://www.g2a.com/canva-pro-1-year-canva-account-global-i10000503011003'),
  'adobe-creative-cloud': ref(12.48, 'USD', '1 month · Creative Cloud Pro', 'Account', 'Global account listing; regular price', 'https://www.g2a.com/adobe-creative-cloud-pro-pc-1-month-adobe-account-global-i10000195108015'),
  nordvpn: ref(14.99, 'USD', '1 month · Basic', 'Official retail', 'United States retail', 'https://nordvpn.com/pricing/'),
}

// Single source of truth for catalogue data.
// Money is integer cents (SGD). Stock is units per variant (0 = out of stock).
// Variant IDs are the cart identity: same product + different edition = separate lines.

export const CATEGORIES = [
  { slug: 'games', title: 'Games', blurb: 'Keys & top titles' },
  { slug: 'gift-cards', title: 'Gift Cards', blurb: 'Top brands & currencies' },
  { slug: 'streaming', title: 'Streaming', blurb: 'Movies, shows & more' },
  { slug: 'subscriptions', title: 'Subscriptions', blurb: 'Access more games' },
  { slug: 'deals', title: 'Deals', blurb: 'Limited-time offers' },
]

function v(id, label, price, compareAt = null, stock = 999, extra = {}) {
  return { id, label, priceCents: price, compareAtCents: compareAt, stock, ...extra };
}

// Genuine recurring services (Stripe subscription mode). Everything else —
// including fixed-duration gift passes, which are prepaid one-time vouchers —
// checks out in payment mode.
const MONTHLY = { billingType: 'recurring', interval: 'month' };
const YEARLY = { billingType: 'recurring', interval: 'year' };

export const PRODUCTS = [
  {
    id: 'p-stormlands', slug: 'stormlands', title: 'Stormlands', category: 'games',
    tagline: 'PC Game Key', description: 'A breathtaking open-world action RPG on the edge of collapse. Explore ancient ruins, master abilities, and forge your destiny across lush forests and frozen peaks.',
    platforms: ['PC (Steam)'], genres: ['Action', 'RPG', 'Adventure'], regions: ['Global'],
    rating: 4.8, ratingsCount: 12458, art: 'stormlands', featured: true, trending: true,
    features: ['Massive open world', 'Dynamic skill-based combat', 'Choices that shape your journey', 'Stunning next-gen visuals'],
    redemption: ['Purchase your key from GameVault', 'Receive your demo code instantly', 'Open Steam and choose "Activate a Product"', 'Enter the code and download'],
    regionInfo: 'Valid globally. Activates in most regions.',
    requirements: 'Windows 10/11 64-bit, 16 GB RAM, GTX 1060 or better.',
    variants: [
      v('stormlands-standard', 'Standard Edition', 2999, 5999),
      v('stormlands-deluxe', 'Deluxe Edition', 4999, null),
      v('stormlands-ultimate', 'Ultimate Edition', 6999, null),
    ],
  },
  {
    id: 'p-neon-drift', slug: 'neon-drift', title: 'Neon Drift', category: 'games',
    tagline: 'PC Game Key', description: 'High-octane arcade racer through a rain-soaked neon metropolis. Drift, boost and outrun the grid.',
    platforms: ['PC (Steam)', 'PlayStation', 'Xbox'], genres: ['Racing', 'Action'], regions: ['Global', 'Asia'],
    rating: 4.5, ratingsCount: 892, art: 'neon-drift', trending: true, deal: true,
    features: ['60+ neon tracks', 'Online multiplayer', 'Deep car customisation'],
    redemption: ['Receive your demo code instantly', 'Redeem on your platform store', 'Download and play'],
    regionInfo: 'Global key. Some DLC is region-locked.',
    requirements: 'Windows 10 64-bit, 8 GB RAM, GTX 1050 Ti or better.',
    variants: [v('neon-drift-standard', 'Standard Edition', 3499, 4999)],
  },
  {
    id: 'p-shadow-realm', slug: 'shadow-realm', title: 'Shadow Realm', category: 'games',
    tagline: 'PC Game Key', description: 'Dark-fantasy souls-like. Face abyssal knights, cursed cathedrals and bosses that remember you.',
    platforms: ['PC (Steam)', 'PlayStation'], genres: ['RPG', 'Adventure'], regions: ['Global', 'Europe'],
    rating: 4.7, ratingsCount: 3210, art: 'shadow-realm', trending: true,
    features: ['Interconnected cursed world', 'Punishing but fair duels', 'New Game+ modes'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam', 'Download and play'],
    regionInfo: 'Valid globally except sanctioned territories (demo).',
    requirements: 'Windows 10/11, 12 GB RAM, RTX 2060 or better.',
    variants: [v('shadow-realm-standard', 'Standard Edition', 5999, null)],
  },
  {
    id: 'p-galaxy-frontiers', slug: 'galaxy-frontiers', title: 'Galaxy Frontiers', category: 'games',
    tagline: 'PC Game Key', description: 'Chart a living galaxy: trade, dogfight and build colonies across 200+ star systems.',
    platforms: ['PC (Steam)', 'Xbox'], genres: ['Adventure', 'Simulation', 'Strategy'], regions: ['Global'],
    rating: 4.8, ratingsCount: 2100, art: 'galaxy-frontiers', featured: true,
    features: ['Seamless space-to-planet flight', 'Co-op squadrons', 'Player-driven economy'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10/11, 16 GB RAM, RTX 3060 or better.',
    variants: [v('galaxy-frontiers-standard', 'Standard Edition', 4999, null)],
  },
  {
    id: 'p-rivals-arena', slug: 'rivals-arena', title: 'Rivals Arena', category: 'games',
    tagline: 'PC Game Key', description: 'Fast 3v3 arena shooter with destructible cover and 20+ operators.',
    platforms: ['PC (Steam)', 'PlayStation', 'Xbox'], genres: ['Shooter', 'Action'], regions: ['Global', 'North America'],
    rating: 4.4, ratingsCount: 736, art: 'rivals-arena',
    features: ['Ranked seasons', 'Cross-play', 'Custom lobbies'],
    redemption: ['Receive your demo code instantly', 'Redeem on your platform', 'Download and play'],
    regionInfo: 'Matchmaking regions: Global / NA / EU.',
    requirements: 'Windows 10, 8 GB RAM, GTX 1060 or better.',
    variants: [v('rivals-arena-standard', 'Standard Edition', 3999, 4999, 0), v('rivals-arena-deluxe', 'Deluxe Edition', 5999, null)],
  },
  {
    id: 'p-mythic-tales', slug: 'mythic-tales', title: 'Mythic Tales', category: 'games',
    tagline: 'PC Game Key', description: 'Storybook co-op adventure through floating castles, dragon rookeries and sunken libraries.',
    platforms: ['PC (Steam)', 'Nintendo Switch'], genres: ['Adventure', 'RPG', 'Indie'], regions: ['Global'],
    rating: 4.6, ratingsCount: 1900, art: 'mythic-tales', featured: true,
    features: ['2-player story co-op', 'Hand-painted kingdoms', 'Photo mode'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam / eShop (demo key)', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10, 8 GB RAM, GTX 1050 or better.',
    variants: [v('mythic-tales-standard', 'Standard Edition', 4999, null)],
  },
  {
    id: 'p-emberfall', slug: 'emberfall', title: 'Emberfall', category: 'games',
    tagline: 'Action RPG', description: 'Ashen knights, living volcanoes and blade arts. A blazing action RPG from an indie hit-maker.',
    platforms: ['PC (Steam)'], genres: ['Action', 'RPG'], regions: ['Global'],
    rating: 4.7, ratingsCount: 1200, art: 'emberfall', deal: true,
    features: ['Stance-based combat', 'Volcanic open zones', 'Boss rush mode'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10/11, 12 GB RAM, GTX 1660 or better.',
    variants: [v('emberfall-standard', 'Standard Edition', 4999, null)],
  },
  {
    id: 'p-neon-circuit', slug: 'neon-circuit', title: 'Neon Circuit', category: 'games',
    tagline: 'Racing', description: 'Anti-grav league racing at 1,200 km/h. Master magnetic circuits across orbital cities.',
    platforms: ['PC (Steam)', 'PlayStation', 'Xbox'], genres: ['Racing', 'Sports'], regions: ['Global', 'Europe'],
    rating: 4.5, ratingsCount: 892, art: 'neon-circuit', deal: true,
    features: ['32 anti-grav circuits', 'Split-screen + online', 'Track editor'],
    redemption: ['Receive your demo code instantly', 'Redeem on your platform', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10, 8 GB RAM, GTX 1050 Ti or better.',
    variants: [v('neon-circuit-standard', 'Standard Edition', 3499, 4999)],
  },
  {
    id: 'p-starborne', slug: 'starborne', title: 'Starborne', category: 'games',
    tagline: 'Space Adventure', description: 'Single-player odyssey: salvage derelicts, befriend alien crews and outrun the collapse.',
    platforms: ['PC (Steam)', 'Xbox'], genres: ['Adventure', 'RPG'], regions: ['Global'],
    rating: 4.8, ratingsCount: 2100, art: 'starborne', featured: true,
    features: ['Branching odyssey', 'Ship crafting', 'Zero-G exploration'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10/11, 16 GB RAM, RTX 2060 or better.',
    variants: [v('starborne-standard', 'Standard Edition', 5999, null)],
  },
  {
    id: 'p-valkyrie-protocol', slug: 'valkyrie-protocol', title: 'Valkyrie Protocol', category: 'games',
    tagline: 'Tactical Shooter', description: 'Squad tactics meet high-tech infiltration. Plan, breach, extract.',
    platforms: ['PC (Steam)', 'PlayStation', 'Xbox'], genres: ['Shooter', 'Strategy'], regions: ['Global', 'North America'],
    rating: 4.4, ratingsCount: 736, art: 'valkyrie-protocol', deal: true,
    features: ['5-player co-op raids', 'Gadget sandbox', 'Weekly directives'],
    redemption: ['Receive your demo code instantly', 'Redeem on your platform', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10, 12 GB RAM, GTX 1070 or better.',
    variants: [v('valkyrie-protocol-standard', 'Standard Edition', 3999, 4999)],
  },
  {
    id: 'p-pixel-quest', slug: 'pixel-quest', title: 'Pixel Quest', category: 'games',
    tagline: 'Indie Adventure', description: 'Cosy pixel odyssey: farm sky-islands, befriend sprites and rebuild the lighthouse.',
    platforms: ['PC (Steam)', 'Nintendo Switch', 'Mobile'], genres: ['Indie', 'Adventure', 'Puzzle'], regions: ['Global'],
    rating: 4.3, ratingsCount: 512, art: 'pixel-quest', deal: true,
    features: ['Wholesome quests', 'Local co-op', 'Seasonal festivals'],
    redemption: ['Receive your demo code instantly', 'Redeem on your platform', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 7+, 4 GB RAM, any modern GPU.',
    variants: [v('pixel-quest-standard', 'Standard Edition', 1199, 1999)],
  },
  {
    id: 'p-ironclad-tactics', slug: 'ironclad-tactics', title: 'Ironclad Tactics', category: 'games',
    tagline: 'Strategy', description: 'Command diesel-punk mechs in turn-based warfare across a shattered empire.',
    platforms: ['PC (Steam)'], genres: ['Strategy', 'Simulation'], regions: ['Global'],
    rating: 4.5, ratingsCount: 638, art: 'ironclad-tactics',
    features: ['Story campaign + skirmish', 'Mech foundry', 'Async multiplayer'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10, 8 GB RAM, GTX 1050 or better.',
    variants: [v('ironclad-tactics-standard', 'Standard Edition', 2999, null)],
  },
  {
    id: 'p-drift-horizon', slug: 'drift-horizon', title: 'Drift Horizon', category: 'games',
    tagline: 'Racing', description: 'Sunset highways, mountain passes and midnight docks. The definitive drift sandbox.',
    platforms: ['PC (Steam)', 'PlayStation'], genres: ['Racing', 'Sports'], regions: ['Global', 'Asia'],
    rating: 4.6, ratingsCount: 1400, art: 'drift-horizon',
    features: ['Open-road sandbox', 'Drift trials', 'Livery studio'],
    redemption: ['Receive your demo code instantly', 'Redeem on your platform', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10, 8 GB RAM, GTX 1060 or better.',
    variants: [v('drift-horizon-standard', 'Standard Edition', 3999, null)],
  },
  {
    id: 'p-cursed-hollow', slug: 'cursed-hollow', title: 'Cursed Hollow', category: 'games',
    tagline: 'Survival Horror', description: 'A hollow that hungers. Scavenge, hide and decide who the village saves.',
    platforms: ['PC (Steam)', 'Xbox'], genres: ['Adventure', 'Puzzle', 'Indie'], regions: ['Global'],
    rating: 4.4, ratingsCount: 921, art: 'cursed-hollow', deal: true,
    features: ['Dynamic haunting AI', 'Branching endings', 'Lantern co-op'],
    redemption: ['Receive your demo code instantly', 'Activate on Steam', 'Download and play'],
    regionInfo: 'Global key.',
    requirements: 'Windows 10, 8 GB RAM, GTX 1050 Ti or better.',
    variants: [v('cursed-hollow-standard', 'Standard Edition', 2999, 3999)],
  },
  // ---- Gift codes ----
  {
    id: 'p-apex-credits', slug: 'apex-credits', title: 'Apex Credits', category: 'gift-cards',
    tagline: 'Game Currency', description: 'Top up your arena account with Apex Credits. Unlock operators, skins and battle passes. Demo code delivered instantly.',
    platforms: ['PC', 'PlayStation', 'Xbox', 'Mobile'], genres: ['Currency'], regions: ['Global'],
    rating: 4.7, ratingsCount: 5400, art: 'default', featured: true,
    features: ['Instant demo delivery', 'Stacks with promos', 'No expiry in demo'],
    redemption: ['Purchase credit pack', 'Receive DEMO code instantly', 'Redeem in the game store'],
    regionInfo: 'Demo codes are region-free and clearly labelled DEMO.',
    requirements: 'A free game account (demo).',
    variants: [v('apex-10', 'S$10 Pack', 1000, null), v('apex-20', 'S$20 Pack', 2000, null), v('apex-50', 'S$50 Pack', 5000, 5500)],
  },
  {
    id: 'p-battle-points', slug: 'battle-points', title: 'Battle Points Pack', category: 'gift-cards',
    tagline: 'Game Currency', description: 'Fuel your season grind with Battle Points. Tiers, emotes and exclusive drops.',
    platforms: ['PC', 'PlayStation', 'Xbox'], genres: ['Currency'], regions: ['Global'],
    rating: 4.6, ratingsCount: 3100, art: 'default',
    features: ['Instant demo delivery', 'Season-ready'],
    redemption: ['Purchase pack', 'Receive DEMO code instantly', 'Redeem in-game'],
    regionInfo: 'Demo codes are region-free.',
    requirements: 'A free game account (demo).',
    variants: [v('bp-10', 'S$10 Pack', 1000, null), v('bp-25', 'S$25 Pack', 2500, null)],
  },
  {
    id: 'p-game-wallet', slug: 'game-wallet', title: 'GameVault Wallet Top-Up', category: 'gift-cards',
    tagline: 'Store Credit', description: 'Demo store credit for the GameVault catalogue. Great for gifting (simulated).',
    platforms: ['PC'], genres: ['Currency'], regions: ['Global'],
    rating: 4.8, ratingsCount: 1800, art: 'default',
    features: ['Flexible denominations', 'Giftable in demo'],
    redemption: ['Purchase top-up', 'Receive DEMO code instantly', 'Apply at checkout (demo)'],
    regionInfo: 'Demo only. No cash value.',
    requirements: 'A GameVault demo account.',
    variants: [v('wallet-10', 'S$10 Top-Up', 1000, null), v('wallet-25', 'S$25 Top-Up', 2500, null), v('wallet-50', 'S$50 Top-Up', 5000, null)],
  },
  {
    id: 'p-ruby-coins', slug: 'ruby-coins-pack', title: 'Ruby Coins Pack', category: 'gift-cards',
    tagline: 'Virtual Currency', description: 'Glittering Ruby Coins for cosmetics, mounts and housing items across supported demo titles.',
    platforms: ['PC', 'Mobile'], genres: ['Currency'], regions: ['Global', 'Asia'],
    rating: 4.5, ratingsCount: 960, art: 'default', deal: true,
    features: ['Instant demo delivery', 'Bonus coins on S$50'],
    redemption: ['Purchase pack', 'Receive DEMO code instantly', 'Redeem in-game'],
    regionInfo: 'Demo codes are region-free.',
    requirements: 'A free game account (demo).',
    variants: [v('ruby-5', 'S$5 Pack', 500, null), v('ruby-20', 'S$20 Pack', 1999, 2499)],
  },
  // ---- Streaming ----
  {
    id: 'p-netflix-gift', slug: 'netflix-gift-card', title: 'Netflix Gift Card', category: 'streaming',
    tagline: 'Movies, shows & originals', description: 'Gift months of blockbusters, series and originals. HD, Full HD & 4K streaming on all your devices.',
    platforms: ['Smart TV', 'Mobile', 'PC', 'Tablet'], genres: ['Movies', 'TV'], regions: ['Global'],
    rating: 4.7, ratingsCount: 2200, art: 'netflix',
    features: ['4K where available', 'Watch on all devices', 'Ad-free'],
    redemption: ['Purchase the gift card', 'Receive your code instantly', 'Redeem on your Netflix account'],
    regionInfo: 'Global gift card. Redeemable on most Netflix accounts.',
    requirements: 'A Netflix account.',
    variants: [v('netflix-1mo', '1 Month', 1499, null), v('netflix-3mo', '3 Months', 4499, null)],
  },
  {
    id: 'p-spotify-gift', slug: 'spotify-gift-card', title: 'Spotify Premium Gift Card', category: 'streaming',
    tagline: 'Millions of songs. Ad-free.', description: 'Gift ad-free listening, offline downloads and lossless audio.',
    platforms: ['Mobile', 'PC'], genres: ['Music'], regions: ['Global'],
    rating: 4.6, ratingsCount: 1500, art: 'spotify-premium',
    features: ['Lossless audio', 'Offline downloads', 'Gaming playlists'],
    redemption: ['Purchase the gift card', 'Receive your code instantly', 'Redeem on your Spotify account'],
    regionInfo: 'Global gift card.',
    requirements: 'A Spotify account.',
    variants: [v('spotify-1mo', '1 Month', 1099, null), v('spotify-3mo', '3 Months', 3299, null)],
  },
  {
    id: 'p-gamepass-gift', slug: 'game-pass-gift-card', title: 'Xbox Game Pass Ultimate Gift Card', category: 'streaming',
    tagline: 'Play anywhere, anytime', description: 'Gift months of Game Pass Ultimate: 500+ games, online multiplayer and EA Play on console, PC and cloud.',
    platforms: ['PC', 'Xbox', 'Mobile', 'Smart TV'], genres: ['Cloud', 'Membership'], regions: ['Global'],
    rating: 4.5, ratingsCount: 1100, art: 'game-pass-ultimate',
    features: ['500+ games', 'Online multiplayer', 'PC / console / cloud'],
    redemption: ['Purchase the gift card', 'Receive your code instantly', 'Redeem on your Microsoft account'],
    regionInfo: 'Global gift card.',
    requirements: 'A Microsoft account.',
    variants: [v('gamepass-1mo', '1 Month', 1690, null), v('gamepass-3mo', '3 Months', 4990, null)],
  },
  // ---- Subscriptions (also sold as billing-period variants) ----
  {
    id: 'p-sub-game-pass-ultimate', slug: 'game-pass-ultimate', title: 'Xbox Game Pass Ultimate', category: 'subscriptions',
    tagline: 'Hundreds of PC & console games', description: 'Access 500+ premium games with new titles monthly, online multiplayer, EA Play and member discounts.',
    platforms: ['PC', 'Xbox'], genres: ['Membership'], regions: ['Global'],
    rating: 4.9, ratingsCount: 8600, art: 'game-pass-ultimate', featured: true,
    features: ['500+ premium games', 'New titles monthly', 'PC & console library', 'Online multiplayer', 'EA Play included'],
    redemption: ['Choose monthly or yearly', 'Activation is simulated', 'Manage in Account > Subscriptions'],
    regionInfo: 'Global membership.',
    requirements: 'A Microsoft account.',
    variants: [v('game-pass-ultimate-monthly', 'Monthly billing', 1690, null, 999, MONTHLY), v('game-pass-ultimate-yearly', 'Yearly billing', 16900, 20280, 999, YEARLY)],
  },
  {
    id: 'p-sub-playstation-plus', slug: 'playstation-plus', title: 'PlayStation Plus', category: 'subscriptions',
    tagline: 'Online play & exclusive perks', description: 'Online multiplayer, free monthly games and early beta access.',
    platforms: ['PlayStation'], genres: ['Membership'], regions: ['Global'],
    rating: 4.6, ratingsCount: 4300, art: 'playstation-plus',
    features: ['Online multiplayer', 'Free monthly games', 'Early beta access', 'Cloud saves'],
    redemption: ['Choose billing period', 'Activation is simulated', 'Manage in Account'],
    regionInfo: 'Global membership.',
    requirements: 'A PlayStation Network account.',
    variants: [v('playstation-plus-monthly', 'Monthly billing', 1090, null, 999, MONTHLY), v('playstation-plus-yearly', 'Yearly billing', 10900, 13080, 999, YEARLY)],
  },
  // ---- Real-world-style gift cards (demo listings, no affiliation) ----
  {
    id: 'p-psn-sg', slug: 'psn-credit-sg', title: 'PlayStation Store Credit (SG)', category: 'gift-cards',
    tagline: 'Top-up card', description: 'Demo listing inspired by the popular PlayStation Store top-up. No affiliation with Sony; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['PlayStation'], genres: ['Currency'], regions: ['Singapore'],
    rating: 4.9, ratingsCount: 9200, art: 'default', featured: true,
    features: ['Singapore-region demo credit', 'Flexible denominations', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a Singapore PSN account (demo — do not use a real account)'],
    regionInfo: 'Demo listing for Singapore-region credit. Real cards are region-locked; this demo issues no real credit.',
    requirements: 'A PlayStation Network account (demo only).',
    variants: [v('psn-10', 'S$10 Credit', 1000, null), v('psn-20', 'S$20 Credit', 2000, null), v('psn-50', 'S$50 Credit', 5000, 5500), v('psn-100', 'S$100 Credit', 10000, null)],
  },
  {
    id: 'p-xbox-sg', slug: 'xbox-gift-sg', title: 'Xbox Gift Card (SG)', category: 'gift-cards',
    tagline: 'Gift card', description: 'Demo listing inspired by the popular Xbox gift card. No affiliation with Microsoft; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['Xbox'], genres: ['Currency'], regions: ['Singapore'],
    rating: 4.8, ratingsCount: 6100, art: 'default',
    features: ['Singapore-region demo credit', 'Works across demo Xbox stores', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a Singapore Xbox account (demo)'],
    regionInfo: 'Demo listing for Singapore-region credit. Real cards are region-locked; this demo issues no real credit.',
    requirements: 'A Microsoft account (demo only).',
    variants: [v('xbox-10', 'S$10 Card', 1000, null), v('xbox-25', 'S$25 Card', 2500, null), v('xbox-50', 'S$50 Card', 5000, null)],
  },
  {
    id: 'p-steam-sg', slug: 'steam-wallet-sg', title: 'Steam Wallet Code (SG)', category: 'gift-cards',
    tagline: 'Wallet top-up', description: 'Demo listing inspired by the popular Steam Wallet code. No affiliation with Valve; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['PC'], genres: ['Currency'], regions: ['Singapore'],
    rating: 4.9, ratingsCount: 12400, art: 'default', featured: true,
    features: ['Singapore-region demo wallet', 'Flexible denominations', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a Singapore Steam account (demo)'],
    regionInfo: 'Demo listing for Singapore-dollar wallet credit. Steam credit is currency-locked in reality; this demo issues no real credit.',
    requirements: 'A Steam account (demo only).',
    variants: [v('steam-10', 'S$10 Wallet', 1000, null), v('steam-20', 'S$20 Wallet', 2000, null), v('steam-50', 'S$50 Wallet', 5000, null)],
  },
  {
    id: 'p-eshop-us', slug: 'eshop-credit-us', title: 'Nintendo eShop Credit (US)', category: 'gift-cards',
    tagline: 'Top-up card', description: 'Demo listing inspired by the popular Nintendo eShop prepaid card. No affiliation with Nintendo; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['Nintendo Switch'], genres: ['Currency'], regions: ['United States'],
    rating: 4.7, ratingsCount: 4800, art: 'default',
    features: ['US-region demo credit', 'For demo Nintendo accounts set to the US region', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a US-region Nintendo account (demo)'],
    regionInfo: 'Demo listing for US-region eShop credit, priced here in SGD for the demo. Real cards are region-locked.',
    requirements: 'A Nintendo Account set to the US region (demo only).',
    variants: [v('eshop-15', 'S$15 Credit', 1500, null), v('eshop-30', 'S$30 Credit', 3000, null), v('eshop-75', 'S$75 Credit', 7500, null)],
  },
  {
    id: 'p-apple-sg', slug: 'apple-gift-sg', title: 'App Store Gift Card (SG)', category: 'gift-cards',
    tagline: 'Gift card', description: 'Demo listing inspired by the popular App Store gift card. No affiliation with Apple; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['Mobile', 'PC'], genres: ['Currency'], regions: ['Singapore'],
    rating: 4.8, ratingsCount: 7300, art: 'default',
    features: ['Singapore-region demo credit', 'For apps, games and media (demo)', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a Singapore Apple Account (demo)'],
    regionInfo: 'Demo listing for Singapore-region credit. Real cards are region-locked; this demo issues no real credit.',
    requirements: 'An Apple Account (demo only).',
    variants: [v('apple-15', 'S$15 Card', 1500, null), v('apple-30', 'S$30 Card', 3000, null), v('apple-50', 'S$50 Card', 5000, null)],
  },
  {
    id: 'p-gplay-sg', slug: 'googleplay-sg', title: 'Google Play Gift Code (SG)', category: 'gift-cards',
    tagline: 'Gift code', description: 'Demo listing inspired by the popular Google Play gift code. No affiliation with Google; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['Mobile', 'Tablet'], genres: ['Currency'], regions: ['Singapore'],
    rating: 4.7, ratingsCount: 6900, art: 'default',
    features: ['Singapore-region demo credit', 'For apps, games and media (demo)', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a Singapore Google account (demo)'],
    regionInfo: 'Demo listing for Singapore-region credit. Real codes are region-locked; this demo issues no real credit.',
    requirements: 'A Google account (demo only).',
    variants: [v('gplay-10', 'S$10 Code', 1000, null), v('gplay-25', 'S$25 Code', 2500, null), v('gplay-50', 'S$50 Code', 5000, null)],
  },
  {
    id: 'p-roblox-sg', slug: 'roblox-credit-sg', title: 'Roblox Credit (SG)', category: 'gift-cards',
    tagline: 'Game credit', description: 'Demo listing inspired by the popular Roblox gift card. No affiliation with Roblox Corporation; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['PC', 'Mobile'], genres: ['Currency'], regions: ['Singapore'],
    rating: 4.6, ratingsCount: 5400, art: 'default',
    features: ['Demo Robux-style credit', 'Bonus demo item on larger packs', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Redeem on a Roblox account (demo)'],
    regionInfo: 'Demo listing. Real Roblox cards grant Robux plus virtual items; this demo issues no real credit.',
    requirements: 'A Roblox account (demo only).',
    variants: [v('roblox-15', 'S$15 Credit', 1500, null), v('roblox-30', 'S$30 Credit', 3000, 3300)],
  },
  {
    id: 'p-razer-sg', slug: 'razer-gold-sg', title: 'Razer Gold (SG)', category: 'gift-cards',
    tagline: 'Gamer wallet', description: 'Demo listing inspired by the popular Razer Gold PIN. No affiliation with Razer; not an official reseller. Codes are fictional DEMO codes with no value.',
    platforms: ['PC', 'Mobile'], genres: ['Currency'], regions: ['Singapore', 'Malaysia'],
    rating: 4.6, ratingsCount: 3900, art: 'default',
    features: ['SG/MY demo wallet credit', 'For demo game top-ups', 'Instant DEMO delivery'],
    redemption: ['Purchase a denomination', 'Receive a DEMO code instantly', 'Reload a Razer Gold wallet (demo)'],
    regionInfo: 'Demo listing for Singapore/Malaysia-region credit. Real PINs are region-aware; this demo issues no real credit.',
    requirements: 'A Razer Gold account (demo only).',
    variants: [v('razer-10', 'S$10 PIN', 1000, null), v('razer-20', 'S$20 PIN', 2000, null), v('razer-50', 'S$50 PIN', 5000, null)],
  },
  // ---- Prepaid subscription vouchers (ONE-TIME: fixed duration, no auto-renewal) ----
  {
    id: 'p-gpu-1mo', slug: 'game-pass-ultimate-1mo', title: 'Xbox Game Pass Ultimate — 1-Month Prepaid', category: 'subscriptions',
    tagline: 'Prepaid voucher', description: '1-month prepaid membership voucher. No automatic renewal. Redeem on your Microsoft account.',
    platforms: ['PC', 'Xbox'], genres: ['Membership'], regions: ['Global'],
    rating: 4.8, ratingsCount: 5100, art: 'game-pass-ultimate', featured: true,
    features: ['1 month prepaid membership', 'No auto-renewal', 'Stackable durations'],
    redemption: ['Purchase the voucher', 'Receive your code instantly', 'Redeem on your Microsoft account'],
    regionInfo: 'Global voucher. Stacks with existing time.',
    requirements: 'A Microsoft account.',
    variants: [v('gpu-1mo', '1 Month Prepaid', 1690, null)],
  },
  {
    id: 'p-psplus-12mo', slug: 'ps-plus-12mo', title: 'PlayStation Plus Essential — 12-Month Prepaid', category: 'subscriptions',
    tagline: 'Prepaid voucher', description: '12-month prepaid membership voucher. No automatic renewal. Redeem on your PlayStation Network account.',
    platforms: ['PlayStation'], genres: ['Membership'], regions: ['Global'],
    rating: 4.7, ratingsCount: 4200, art: 'playstation-plus',
    features: ['12 months prepaid membership', 'Monthly games', 'No auto-renewal'],
    redemption: ['Purchase the voucher', 'Receive your code instantly', 'Redeem on your PSN account'],
    regionInfo: 'Global voucher.',
    requirements: 'A PlayStation Network account.',
    variants: [v('psplus-12mo', '12 Months Prepaid', 10900, 13080)],
  },
  {
    id: 'p-netflix-1mo', slug: 'netflix-gift-1mo', title: 'Netflix Gift — 1 Month', category: 'streaming',
    tagline: 'Gift card', description: '1-month prepaid Netflix gift card. Redeem on your Netflix account.',
    platforms: ['Smart TV', 'Mobile', 'PC', 'Tablet'], genres: ['Movies', 'TV'], regions: ['Global'],
    rating: 4.6, ratingsCount: 3800, art: 'netflix',
    features: ['1 month prepaid viewing', 'HD streaming', 'Watch on all devices'],
    redemption: ['Purchase the gift card', 'Receive your code instantly', 'Redeem on your Netflix account'],
    regionInfo: 'Global gift card.',
    requirements: 'A Netflix account.',
    variants: [v('netflix-1mo-gift', '1 Month Gift', 1499, null)],
  },
  {
    id: 'p-spotify-1mo', slug: 'spotify-gift-1mo', title: 'Spotify Premium Gift — 1 Month', category: 'streaming',
    tagline: 'Gift card', description: '1-month prepaid Spotify Premium gift card. Redeem on your Spotify account.',
    platforms: ['Mobile', 'PC'], genres: ['Music'], regions: ['Global'],
    rating: 4.7, ratingsCount: 3500, art: 'spotify-premium',
    features: ['1 month prepaid listening', 'Ad-free', 'Offline downloads'],
    redemption: ['Purchase the gift card', 'Receive your code instantly', 'Redeem on your Spotify account'],
    regionInfo: 'Global gift card.',
    requirements: 'A Spotify account.',
    variants: [v('spotify-1mo-gift', '1 Month Gift', 1099, null)],
  },
]

export const PLATFORMS = [...new Set(PRODUCTS.flatMap((p) => p.platforms))].sort()
export const GENRES = [...new Set(PRODUCTS.flatMap((p) => p.genres))].sort()
export const REGIONS = [...new Set(PRODUCTS.flatMap((p) => p.regions))].sort()

export function minPrice(product) {
  return Math.min(...product.variants.map((x) => x.priceCents))
}

export function productInStock(product) {
  return product.variants.some((x) => x.inStock !== undefined ? x.inStock : Number(x.stock) > 0)
}

export function findVariant(variantId) {
  for (const p of runtimeCatalogue ?? PRODUCTS) {
    const variant = p.variants.find((x) => x.id === variantId)
    if (variant) return { product: p, variant }
  }
  return null
}

// Shared current catalogue keeps carts aligned with live prices and stock.
let runtimeCatalogue = null
export function registerCatalogue(products) { runtimeCatalogue = products }
export function currentCatalogue() { return runtimeCatalogue ?? PRODUCTS }

// One-time (Stripe payment mode) vs genuine recurring (subscription mode).
// Fixed-duration gift passes are prepaid vouchers → one-time.
export function variantBilling(variant) {
  return variant && variant.billingType === 'recurring' ? 'recurring' : 'one_time'
}

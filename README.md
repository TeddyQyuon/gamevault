# GameVault

Subscription marketplace built with React/Vite, Express, Sequelize/MySQL and Stripe Checkout.

## Run locally

Configure `server/.env` from `server/.env.example`. Keep secrets local.

```powershell
npm install
npm --prefix server install
npm run db:migrate
npm run catalog:prepare
npm run api
npm run dev
```

Storefront: http://localhost:5173. Staff: http://localhost:5173/admin.

## Sell subscriptions with email delivery

Fifteen popular services have local original brand artwork and editable starter price references. `catalog:prepare` creates manual-delivery drafts and preserves existing merchant products. It does not import codes or publish offers.

1. Sign in with an admin account and open **Staff → Sell subscriptions**.
2. Review price, membership term, supported countries and account requirements for each offer you can fulfill.
3. Select offers and click **Publish selected offers**. Published, available manual offers accept one-time SGD payments without code inventory.
4. When Stripe confirms payment, the order appears in **Paid orders · Email delivery** with customer contact details, items, regions and a one-hour deadline.
5. Compose the email, add the actual subscription details/instructions, send it yourself, then **Mark delivered**. This records the timestamp and staff audit entry. The button does not send email.
6. Pause an offer in Catalogue workflow if you cannot fulfill it.

See [Email delivery operations](docs/MANUAL_DELIVERY.md). The optional encrypted activation-code inventory workflow remains available; see [Prepaid codes](docs/PREPAID_CODES.md).

## Payments and launch

Stripe signed webhooks are the authority for payment confirmation. Prices, permissions and order ownership are enforced server-side. Customer order pages never mark themselves paid. Manual delivery is available for fixed-term, one-time offers; live recurring and demo checkout remain blocked.

Set the live Stripe secret key, the matching webhook signing secret, and the public HTTPS `CLIENT_URL` before accepting live payments. The staff readiness panel shows missing configuration. Deployment startup runs migrations without seeding demo products.

See [Go-live runbook](docs/GO_LIVE.md). No live payment was made during implementation.

## Artwork and prices

Artwork URLs are recorded in `public/assets/storefront/sources.json`. Provider names and logos belong to their owners. Logos retain native colors and proportions. Research prices and their source format/region are in `src/data/subscriptionPrices.js`; they are comparisons rather than supplier costs or guaranteed margins. Your actual delivery terms must be entered before publication.

The storefront uses only published database listings. API failures show an error; no preview products or fake stock are substituted.

## Compile and lint

```powershell
npm run build
npm run lint
npm run api:lint
```

## Adding a product

1. Add native artwork metadata to `src/data/brands.js`: id, name, local logo/cover, original background, fit, padding, tag, group and source. Existing artwork exports and subscription templates derive their presentation metadata from this registry.
2. Save the original logo in `public/assets/storefront/`, or a publisher cover in `public/assets/storefront/games/`. Preserve native proportions and colors; never reconstruct a vendor wordmark.
3. Record the exact source URL and download/review date in `public/assets/storefront/sources.json`. A review date for an existing file is not a claim of a fresh download.
4. Add product data using its registered `art` key and a local `artworkPath`. Review real supply, region and fulfilment separately; a logo is not evidence of stock or authority to sell.
5. Run `npm test`, `npm run lint` and `npm run build`. Artwork tests cover every product and subscription, local files larger than 100 bytes, and source records.

`node scripts/fetch-storefront-assets.mjs` fetches official Steam portrait capsules first and keeps local landscape headers for fallback. Inter is self-hosted with its OFL license under `public/fonts/`. No new application dependencies were added.

### Redesign verification notes

The original test suite contains a Windows-only local-path assertion and requires two Antigravity manifests. Those requirements conflict with portable execution and the requested single GameVault manifest. They remain unchanged pending review. The Game Pass tile uses the native parent Xbox mark instead of the old reconstructed Ultimate wordmark; its legacy SVG-content assertion remains unchanged and requires an approved exact lockup or a reviewed assertion update. `MobileCoder.jsx` is explicitly protected and retains three original literal colors.

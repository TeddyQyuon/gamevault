# Stocking prepaid subscriptions

GameVault sells a prepaid activation code with a one-time payment. The customer redeems it on their own service-provider account. GameVault does not create third-party accounts or manage the resulting membership.

## Local setup

1. MySQL80 on port 3306 is connected through a fresh dedicated app login. The authorized database reset and all migrations have completed. Temporary setup files were removed; the administrator password was not saved in the app configuration.
2. The API is running. For a later restart, use `npm run api`; run `npm run db:migrate` when new migrations are added.
3. Set `CLIENT_URL` to the frontend URL in use. The current design preview runs at `http://localhost:4173`; the usual `npm run dev` uses port 5173.
4. Register your account, then run `npm --prefix server run admin:promote -- your-email@example.com`. Sign in and open `/admin`.
5. Configure a stable `CODES_ENCRYPTION_KEY` locally before importing codes. The existing inventory service requires a 64-character hex key. Keep its backup; changing it makes earlier codes unreadable.

## Create and stock an offer

1. In **New product**, choose **subscriptions** and **code_inventory**.
2. Enter the real title, selling price in SGD, membership duration, redemption region and eligible accounts.
3. Add a direct product image URL or a local `/assets/…` image path. Choose **Show full product image** for packaging and logos.
4. Create the draft. In **Import redeem codes**, select its variant and paste one code per line, or choose a UTF-8 text / single-column CSV file. An optional first-line `code` header is supported.
5. Preview the import and resolve invalid rows. Confirm the import. Inventory is encrypted; duplicates are skipped.
6. In **Catalogue workflow**, review the image, region, term and price, then set **published** and **available**, and save.

The storefront reads the public API. Available code counts determine stock. Reserved and delivered codes do not count as available. Tracking is enforced for code-inventory products. The checkout server reprices purchases and reserves stock before payment; the existing payment webhook delivers the purchased code.

## Existing seed data

`npm run db:seed` prepares four branded prepaid membership starters as drafts with zero inventory and no selling price; other fictional listings stay as non-saleable demo fixtures. The two fictional recurring plans are not seeded. The seed is disabled in production and whenever a live Stripe key is configured. Re-seeding preserves merchant-managed listings and quarantines only old, known fixture rows with no inventory. The local fixture promo is disabled. The seed was not run during this change.

The subscription page also includes starter tiles for Xbox Game Pass, PlayStation Plus, Nintendo Switch Online, EA Play, Discord Nitro, Netflix and Spotify Premium. These are discovery templates, not stocked offers. Confirm supplier authorization, exact duration, region, eligibility and price, then import real codes before making any offer available.

## Preview and payment status

When the API is unavailable, development mode shows clearly labelled brand previews with no price and disabled purchasing. Production does not substitute demo stock.

No real codes were supplied or imported during this change. No payment settings were changed and no payment was made. The API is connected and its health endpoint reports live Stripe mode. The public catalogue currently has zero products. Delivery remains unverified until real offers and codes are stocked. Use the existing production runbook for payment setup.

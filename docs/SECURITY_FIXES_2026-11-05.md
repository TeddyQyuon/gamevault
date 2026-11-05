# Security remediation — 5 November 2026

This change addresses the five application findings in the 5 November source audit. Deployment must use this revision before these protections apply to a live service.

- The Express storefront rejects the entire `/api/coder` namespace with 404. It no longer registers command execution, Git operations, autonomous runs, status, or verification handlers. The controller remains available to trusted local code; it must not be mounted on a public service.
- The Vercel `/api/coder/execute` function returns 404 for POST and makes no provider request. Mobile Coder execution through the public storefront is unavailable. A future privileged tool needs a separate authenticated and isolated service; configuring a Gemini key does not enable this route.
- Order status requires a real Stripe session bound to both the requested order ID and its metadata. Unknown or mismatched orders return 404, unavailable verification returns 503, and unconfirmed payments remain pending. Only a complete, paid Stripe session is displayed as paid. The server and success page no longer fabricate orders, totals, or payment timestamps. Keep the private checkout link confidential: its Stripe session ID grants guest access to that order.
- Vercel checkout and promo preview resolve prices from the catalogue, validate quantities, and enforce the same `GAMER10` rule: S$10 off a subtotal of at least S$50. Browser price fields cannot alter the charge. Coupon creation failure stops checkout.
- Checkout return URLs use a trusted deployment setting, never request `Origin`, `Host`, or `Referer`. Set `CHECKOUT_PUBLIC_URL` to the exact HTTPS storefront origin, for example `https://store.example.com`. `CLIENT_URL` is accepted as a fallback, followed by the existing `https://gamevault-alpha-ten.vercel.app` production origin. Paths, credentials, query strings, and fragments are rejected. HTTP loopback origins are accepted only outside production. Configure an explicit origin for preview deployments. No additional provider credential is required.

The stateless Vercel order function verifies payment directly with Stripe; it does not record fulfilment or claim delivery. The Express backend retains its database-backed order and fulfilment workflow. This change does not migrate existing orders between the two backends.

## Validation

Root tests: 45 passed. Express tests: 65 passed; the optional live MySQL integration suite was not enabled. Security regressions exercise real local Express HTTP routes and fake Stripe clients, including missing, mismatched, pending, expired, unavailable, and paid sessions, ineligible discounts, provider failure, and hostile redirect headers. No real payments or AI provider requests were performed.

Production build and root lint passed. Server lint passed with the existing unused `DataTypes` warning in migration `005_order_snapshots.js`. Existing PWA and coder preset tests now verify the current single GameVault manifest and portable repository configuration; local command tests use the checkout directory instead of machine-specific Windows paths.

Both root and server dependency audits report zero known vulnerabilities after the parallel dependency updates. Sequelize remains on its supported 6.x line, with the vulnerable transitive UUID dependency overridden to compatible 11.1.1; its CommonJS v4 API compatibility check passed.

After publication, deploy the updated Vercel functions and Express service wherever used. Verify the disabled coder routes and payment status behavior in the appropriate provider sandbox before enabling real checkout. Existing deployment credentials and configuration were not changed by this source patch.

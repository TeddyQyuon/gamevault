# GameVault security review — 19 September 2026

## Assessment

Several high-priority application security and payment-integrity defects need remediation before a public launch or growth campaign. Dependency audits alone do not detect these issues. This review found no evidence establishing that a compromise has occurred.

Scope: local frontend/backend source, authentication and authorization, checkout and webhook flows, inventory and transfer logic, Docker/reverse-proxy configuration, package advisory checks, and a redacted credential-pattern scan. No production deployment, real customer database, actual provider transaction, penetration scan, or infrastructure control plane was exercised. Severity is a qualitative remediation priority, not a calculated CVSS score.

## Validation performed

- `npm.cmd audit --json` at the project root: exit 0; 0 reported advisories. Metadata: 369 total dependencies.
- `npm.cmd audit --json` in `server/`: exit 0; 0 reported advisories. Metadata: 196 total dependencies.
- `node docs/security-reproductions.mjs`: completed successfully and reproduced 10 unsafe observations grouped into S01–S09 below. The script imports actual application functions, but database records and all payment-provider calls are mocked. Its assertions confirm the current vulnerable behavior; **a successful script run is not a security pass**. After fixes, convert these cases to regression tests that assert rejection/correct behavior.
- Credential-pattern scan of 114 local text files, including build output and logs, excluding dependencies and agent metadata: one credential-like match in the expected server environment file; no matched values printed or tested online. No matching Stripe/GitHub/private-key patterns were found outside that environment file. This is not a comprehensive secret-detection result or proof of non-exposure.
- Earlier functional baseline: 12 frontend and 46 backend tests passed; live-MySQL integration was skipped. Those tests do not establish security or concurrency safety.

## Findings

### S01 — High: guest checkout ownership is derived from an unverified email and cart

**Locations:** [checkoutService.js](../server/src/services/checkoutService.js), lines 143–198, 261–298 and 349–357; [pricing.js](../server/src/services/pricing.js), `fingerprint`.

Guest attempt lookup uses `userId: null` plus a deterministic fingerprint of product IDs, quantities, promo, and contact email. There is no independent guest-session secret or email verification. An unrelated browser supplying the same email and cart can receive an existing guest's open hosted-checkout URL and order ID. The associated Stripe session ID is also the bearer credential accepted by the guest-order endpoint.

**Confirmed:** the reproduction supplies a different contact name from an unrelated guest request, obtains the original checkout URL, and demonstrates that its session token authorizes the original order's contact details.

**Impact/conditions:** requires an existing open guest checkout and knowledge or a guess of its email/cart/promo. Potential exposure includes contact details and subsequent order access. Existing code-delivery placeholder bugs do not make the authorization design safe. The reproduction models the hosted URL/token association; it does not visit a real hosted checkout page.

**Fix:** bind attempts to a cryptographically random guest-session identity held in a secure HttpOnly cookie. Store only its hash, scope idempotency to that identity, and use separate narrowly scoped, expiring order-access tokens where necessary. Email is contact data, not proof of ownership. Cover one-time and subscription checkout with cross-browser isolation tests.

### S02 — High: destination checkout trusts buyer-supplied financial data; unbound orders accept unrelated paid sessions

**Locations:** [connectController.js](../server/src/controllers/connectController.js), lines 81–105; [connectService.js](../server/src/services/connectService.js), `destinationCheckoutParams`; [webhookService.js](../server/src/services/webhookService.js), lines 166–215.

The destination-checkout endpoint is available to ordinary authenticated customers. It accepts line prices, quantities, platform fees, seller selection, and an arbitrary order ID directly from the request. It does not load/reprice a corresponding catalogue order or establish ownership of that order.

The paid-session webhook accepts the metadata order ID and checks the session ID only when the order already has one. It does not reconcile one-time payment amount/currency/customer against the pending order. An order without a bound session ID can therefore be marked paid by an unrelated paid session naming that order.

**Confirmed:** the actual controller creates mocked checkout parameters for a customer-supplied S$1 price, zero fee, and arbitrary order ID. A subsequent mocked provider event marks a different owner's S$100, session-less order paid from those parameters. Manual fulfilment is queued; the test does not claim actual code delivery or provider exploitation.

**Impact/conditions:** underpayment, payment misattribution, and unsupported checkout creation. The underpayment chain requires the Connect route to be enabled, an eligible connected seller, a customer with a Stripe customer record, and a known pending order with no bound session ID (for example, during session creation or after a failed creation). Orders with a different non-null session ID are rejected by the existing guard. Webhook signature verification remains intact; the concern is a valid provider event for an improperly authorized session, not a forged unsigned webhook.

**Fix:** disable the example destination endpoint until it uses server-owned catalogue pricing, seller mapping, fees, authenticated order ownership, and persisted checkout attempts. Require a verified order/attempt/session association and reconcile the expected one-time payment amount and currency. Handle legitimate event-before-session-persistence races through a recoverable, validated workflow rather than accepting arbitrary metadata.

### S03 — High: buyers control payout recipients and platform fees

**Locations:** [holdCheckoutService.js](../server/src/services/holdCheckoutService.js), lines 91–119 and 133–168; [connectService.js](../server/src/services/connectService.js), `platformFeeForSeparate`.

Separate checkout accepts `percentBps`, `stripeFeeEstimateCents`, `sellerAccountId`, and explicit seller splits from the buyer. Capability checks establish that an account can receive transfers, but do not establish that the account is entitled to revenue from the purchased products. A zero commission is accepted; the percentage also lacks appropriate type/range validation.

**Confirmed:** a normal buyer request persists a zero platform fee and the entire S$100 seller allocation to a buyer-selected connected account.

**Impact/conditions:** commission avoidance and payout diversion if an administrator later releases those allocations. This is not an unauthenticated automatic-transfer vulnerability: recipient accounts must already exist and pass capability checks, and release is admin-only.

**Fix:** derive seller ownership, commission, and split amounts from trusted catalogue/contracts and server-side rules. Reject client-supplied payout configuration. Validate all monetary inputs and persist immutable allocation snapshots before payment.

### S04 — High: separate checkout bypasses the live-mode demo-product restriction

**Locations:** [holdCheckoutService.js](../server/src/services/holdCheckoutService.js), `dbLoaders` and `createSeparateHoldCheckout`; compare [checkoutService.js](../server/src/services/checkoutService.js), `assertSellableInLiveMode`.

The regular one-time and subscription flows reject demo products in live mode. Separate checkout neither applies that guard nor carries the product fulfilment property through its loader.

**Confirmed:** a demo product under a synthetic live-mode configuration reaches the mocked payment-session creation call. No real key or charge is used.

**Impact/conditions:** a customer can enter a real-payment flow for demo inventory through this alternate route when live credentials and a ready connected account are configured. The later fulfilment guard prevents fake-code delivery but leaves a paid, undelivered order; it does not prevent the charge.

**Fix:** centralize the sellability/live-mode check and invoke it from every checkout entry point. Test every public payment route under both test and live-mode configurations.

### S05 — High payment-integrity risk: transfer release is not concurrency-idempotent

**Location:** [connectService.js](../server/src/services/connectService.js), lines 258–305.

Release reads pending transfer rows, calls Stripe, and only then changes row status. It has neither an atomic claim of the row nor a stable provider idempotency key. Two releases can both read the same pending row. A successful provider transfer followed by a failed database write also needs recovery.

**Confirmed:** two concurrent calls submit the same transfer request twice, with no idempotency options. The test deliberately synchronizes the reads and uses a mocked provider.

**Impact/conditions:** duplicate payout attempts from concurrent authorized releases or retries. Release is admin-only. Actual duplicate disbursement depends on provider source-charge/balance constraints and was not tested; do not interpret this as a demonstrated unlimited balance drain.

**Fix:** atomically claim a transfer job, use a stable idempotency key derived from its durable row ID, persist/reconcile the provider result, and make retries recoverable after process/database failure. Apply equivalent retry discipline to reversals.

### S06 — High payment-integrity risk: refund/dispute flags do not block payout release

**Locations:** [webhookService.js](../server/src/services/webhookService.js), lines 125–134; [connectService.js](../server/src/services/connectService.js), `releaseOrderTransfers`.

`flagHoldForReview` returns `{ flagged: true }` but does not persist a review/blocked state, update the payment state, or create a staff notification. The webhook controller discards this outcome apart from successful acknowledgement. Release checks paid/fulfilled state but no refund/dispute hold.

**Confirmed:** processing a dispute event reports a flag while leaving the order paid, fulfilled, and pending release.

**Impact/conditions:** a previously paid order remains eligible for a later authorized release after a refund/dispute event. This requires an admin release; automatic payout was not demonstrated.

**Fix:** persist dispute/refund state and a release block, surface it to staff, and check it atomically before claiming payout work. Reconcile current provider payment state where appropriate, including partial refunds and release/dispute races.

### S07 — Medium: origin validation accepts lookalike hosts

**Location:** [guards.js](../server/src/middleware/guards.js), lines 7–14.

The origin guard uses `startsWith(cfg.clientUrl)`. For a configured `https://shop.example.test`, it accepts `https://shop.example.test.attacker.test`. Missing Origin and Referer also pass.

**Confirmed:** the middleware accepts the lookalike origin.

**Limit:** this is a confirmed origin-validation defect, not a reproduced full browser CSRF exploit. Strict JSON parsing, CORS preflight, and SameSite=Lax cookies constrain exploitation. Auth routes also lack this guard, but a browser-level login-CSRF chain was not established.

**Fix:** parse URLs and compare the complete scheme/host/port origin exactly. Define a fail-closed policy for cookie-authenticated mutations with absent/null/untrusted origin information, using CSRF tokens or Fetch Metadata where appropriate. Test these rules in a real browser. [OWASP CSRF guidance](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html).

### S08 — Medium availability risk: rate limiting is not configured for the deployed proxy topology

**Locations:** [app.js](../server/src/app.js), application setup; [guards.js](../server/src/middleware/guards.js), lines 18–32; [Caddyfile](../deploy/Caddyfile).

The deployment puts Caddy in front of Express, but `trust proxy` remains false. IP-based limits therefore use the proxy peer address instead of individual client addresses. A single client can consume the shared login/checkout allowance in that topology. The default in-memory counters also reset on restart and are independent across replicas.

**Confirmed:** the constructed application reports `trust proxy === false`; both limiters use the default store. The shared-bucket impact is inferred from the supplied deployment and Express behavior, not a live traffic test.

**Fix:** configure trust for the exact proxy topology and ensure the proxy overwrites relevant forwarding headers. Do not blindly trust arbitrary forwarded IPs. Use a shared rate-limit store across replicas and combine account/action limits with IP limits. [Express proxy guidance](https://expressjs.com/en/guide/behind-proxies/), [express-rate-limit store guidance](https://github.com/express-rate-limit/express-rate-limit/blob/main/readme.md).

### S09 — Low information disclosure: public catalogue includes draft/archived products

**Location:** [productsController.js](../server/src/controllers/productsController.js), lines 7–9 and 30–34.

Public list/detail queries have no `publication: 'published'` condition. They expose shop-facing fields of unpublished records. Admin notes and raw inventory codes are not serialized by these handlers.

**Confirmed:** a synthetic draft is returned by the actual public list controller.

**Fix:** filter public list and detail queries to published records, retain access to drafts only behind staff authorization, and test hidden product slugs.

## Additional hardening observations

- Production startup runs migrations and demo seeding on every boot. Besides the existing seed-import failure in the API image, repairing that import alone would activate a known fixture login and overwrite demo catalogue settings in production. Run migrations as a controlled release task; never seed fixture accounts in production.
- The web Docker build copies the whole root context. Root `.dockerignore` excludes `.env` and `server/.env`, but not the documented `deploy/.env.prod` or other `.env.*` files. If present, those files can enter the builder context/cache. This does not demonstrate exposure in the final nginx image, which copies only `dist`. Exclude all secret environment files and minimize build context.
- No explicit frontend CSP/frame-ancestors policy was found in nginx/Caddy configuration. Add a tested policy and other appropriate browser headers; no XSS exploit was demonstrated. Set private/no-store caching for sensitive order/code responses and avoid retaining guest bearer URLs in logs/history/analytics.
- No admin MFA or step-up authentication was found for payout operations. Add it along with immutable, monitored audit records; the current admin audit helper silently ignores write failures.
- Public registration reveals existing emails, and login limits are IP-only. Consider enumeration-resistant responses and account-aware throttling without creating an easy account-lockout attack.
- Production secrets should use a secrets vault with least-privilege access. Prefer restricted Stripe keys after adding explicit `rk_test_`/`rk_live_` support and testing required permissions; the current `sk_`-only mode detection rejects them. No rotation is justified solely by the expected local environment-file match, absent evidence of exposure.
- The API container runs without an explicit non-root user. Add a non-root runtime and appropriate container restrictions as defense in depth.

## Positive controls observed

- Random 32-byte session tokens, hashed server-side, with HttpOnly/SameSite cookies; the supplied production Compose sets Secure cookies.
- User-scoped order reads and server-side staff-role checks on administrative endpoints.
- Raw-body webhook signature verification before business processing.
- Server-side pricing and stock checks in the standard checkout flow.
- AES-256-GCM inventory encryption with random nonces.
- A JSON request-size limit and constrained cart line/quantity counts.
- No request-driven shell execution, dynamic `eval`, or explicit React raw-HTML sink was found in the reviewed source searches. This is not a proof that injection is impossible.

## Remediation order and acceptance checks

1. Contain the exposed example Connect checkout routes until prices, ownership, sellers, and fees are server-authoritative. Repair guest-session ownership and webhook/order binding (S01–S04).
2. Make payout release durable and idempotent, and persist/enforce refund/dispute holds (S05–S06).
3. Correct origin checks, proxy/shared rate limits, and publication filtering (S07–S09).
4. Remove production fixture seeding, harden secrets/build context/browser headers, and add admin step-up controls.
5. Convert the included reproductions into rejection/invariant regression tests. Then validate with isolated MySQL and a payment sandbox: cross-browser guest isolation, unbound/underpaid/mismatched-currency events, concurrent releases, failure between provider success and database commit, refund/dispute races, and browser CSRF scenarios. No production charges are necessary.

Transaction amounts, recipients, identity, and authorization decisions must originate from trusted server state. See [OWASP transaction authorization](https://cheatsheetseries.owasp.org/cheatsheets/Transaction_Authorization_Cheat_Sheet.html) and [business-logic security](https://cheatsheetseries.owasp.org/cheatsheets/Business_Logic_Security_Cheat_Sheet.html).

Application source and deployment configuration were not changed by this review. The only added files are this report and the offline reproduction script.

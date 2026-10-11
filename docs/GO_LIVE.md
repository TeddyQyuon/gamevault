# Go-live runbook (test mode → real money)

Live checkout supports published, available one-time offers fulfilled by manual email delivery or imported activation-code inventory. Manual memberships do not require stored codes. Demo products, unsupported supplier delivery and live recurring checkout remain blocked. See [Email delivery operations](MANUAL_DELIVERY.md).

## 0. Pre-requisites (you)

- [ ] Stripe account **activated** for live payments (payouts enabled).
- [ ] A domain with its DNS A-record pointing at the VPS.
- [ ] Ubuntu 22.04/24.04 VPS with Docker + Compose plugin installed.
- [ ] `CODES_ENCRYPTION_KEY` backed up somewhere safe (losing it orphans
      every imported code — they can never be decrypted again).
- [ ] Refund + Terms pages reviewed for your jurisdiction (scaffold pages are
      your responsibility — a store taking real money needs them).

## 1. Stripe live setup (Dashboard, Live mode toggle on)

1. **API key**: Developers → API keys → copy the **Secret key** (`sk_live_…`).
2. **Webhook endpoint**: Developers → Webhooks → Add endpoint:
   - URL: `https://YOUR-DOMAIN/api/webhooks/stripe`
   - Events to send (minimum): `checkout.session.completed`,
     `checkout.session.async_payment_succeeded`,
     `checkout.session.async_payment_failed`, `checkout.session.expired`.
   - Copy the endpoint's **Signing secret** (`whsec_…`).
3. **Customer Portal**: optional. Prepaid code sales do not need it.
   Enable it only if you offer a genuine GameVault recurring service.

## 2. Deploy

On the VPS (the repo must NOT contain any `.env` files — they stay local):

```bash
git clone <your-repo> gamevault && cd gamevault/deploy
cp .env.prod.example .env.prod
nano .env.prod   # fill DOMAIN, DB_*, SESSION_SECRET, STRIPE_* (live), CODES_*
DOMAIN=your-domain.com docker compose --env-file .env.prod up -d --build
docker compose logs -f api   # expect "Migrations complete" then "GameVault API on ..."
curl https://YOUR-DOMAIN/api/health
# → {"ok":true,"stripe":"live"}
```

The storefront loads at `https://YOUR-DOMAIN`. `/api/health` must say
`"live"` — the shop shows live payment copy only in that case.

## 3. Staff setup (in the live shop)

1. Register your account, then on the VPS:
   `docker compose exec api node src/make-admin.js you@example.com`
2. Log in → **Staff Console** (sidebar) → verify it opens (non-admins get 403).
3. **Archive the demo fixtures**: in Catalogue workflow set every fixture
   product to `archived` (they are `demo_test` listings and can never sell
   live anyway — archiving hides them from the shop).
4. **Sell subscriptions**: review the 15 branded starter offers, enter your actual selling price, term, supported countries and account requirements, select offers, then **Publish selected offers**. They use manual email delivery and require no code inventory.
5. Optional code products: use **New product ? code_inventory**, import real codes under the optional inventory section, then publish and mark available.
6. Confirm the payment readiness panel and `/api/health` report `checkoutReady: true`. This requires the matching webhook signing secret as well as the Stripe key.

## 4. Confirm the payment and delivery flow

Before announcing the shop, verify checkout with Stripe test credentials and a matching signed webhook. Confirm the paid order appears in the staff queue and customer order page, then send its delivery email and mark delivered. Check the live webhook endpoint in Stripe before accepting live orders. Any live purchase or refund requires the merchant's explicit decision and payment details.

Watch for trouble with the webhook ledger:

```sql
SELECT eventId, type, status, attempts, lastError FROM stripe_events
WHERE status != 'processed' ORDER BY receivedAt DESC LIMIT 20;
```

Anything stuck on `failed` means Stripe is retrying — read `lastError`.

## 5. Operating

- **Backups**: nightly `mysqldump` of `gamevault` + the `mysql-data` volume.
  Test a restore once. No backup = no store.
- **Paid-but-unfulfilled** orders (`payStatus=paid`, `fulfilStatus=pending`)
  need human eyes — fulfil or refund same-day.
- **Never** put a live secret in chat, tickets, or git. If one leaks, roll it
  in the Dashboard immediately.
- **Rollback**: point `STRIPE_SECRET_KEY` back at a test key and redeploy —
  the shop returns to test mode; live-mode guards go quiet automatically.

## What the code guarantees (and what it doesn't)

- Guarantees: live checkout accepts available manual email offers and stocked code-inventory products;
  demo/supplier fulfillment and recurring checkout are refused before
  a Stripe session is created. Live and test Stripe clients never mix in one
  process, marketplace Connect example checkout routes stay test-only, order ownership + pricing
  stay server-side, webhook duplicates can't double-deliver.
- Doesn't: tax calculation (none — totals are as listed), chargebacks handling
  (you respond in the Dashboard), legal copy (yours), uptime (yours).

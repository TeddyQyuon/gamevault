# Stripe test-mode guide (GameVault)

Stripe SDK: **`stripe@22.6.1`** (pinned Stripe API version **`2026-08-26.dahlia`**).
Use **test mode** for the scenarios in this guide. The app also supports live payments; production setup and safeguards are documented in [`GO_LIVE.md`](./GO_LIVE.md). Never use a live key for these test scenarios.

## 1. Where test credentials go (local only, never commit)

`server/.env` (copy from `server/.env.example`):

```ini
STRIPE_SECRET_KEY=sk_test_...      # Dashboard → Developers → API keys (test mode)
STRIPE_WEBHOOK_SECRET=whsec_...    # from the Stripe CLI forwarding below
```

You never paste keys into chat, and no `VITE_`-prefixed secret exists — the
browser talks to Stripe only via the redirect URL our server returns.

## 2. Forward webhooks to localhost (Stripe CLI)

Install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and log in, then:

```powershell
stripe login
stripe listen --forward-to localhost:3001/api/webhooks/stripe
# copy the printed whsec_... secret into server/.env as STRIPE_WEBHOOK_SECRET
```

Keep this running while you test. Trigger replays any time with:

```powershell
stripe events trigger checkout.session.completed
stripe events list --limit 5
```

## 3. Customer Portal setup (one-time, Dashboard test mode)

`Manage subscription` needs the portal configured, otherwise Stripe returns an
error the UI surfaces:

1. Dashboard (test mode) → **Settings → Billing → Customer portal**.
2. Enable customer update of **payment methods** at minimum.
3. To allow plan changes/cancellation in the portal, enable
   **Subscriptions → Cancel / Update** (cancellation: “at end of period”
   matches how our webhook sync reads `cancel_at_period_end`).
4. Save. No code change needed — `POST /api/billing/portal` uses your
   server-stored customer id with return URL `/account/subscriptions?portal=return`.

## 4. Test cards (use any future expiry + any CVC)

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Success (one-time + subscription signup) |
| `4000 0000 0000 0002` | Generic decline at Checkout |
| `4000 0000 0000 9995` | Insufficient funds |
| `4000 0027 6000 3184` | 3D Secure challenge |
| `4000 0070 2000 0003` | Singapore-issued test card |
| `4000 0000 0000 0341` | Attaches OK, **fails on later charges** — use in the portal to simulate a failed renewal (`invoice.payment_failed` → `past_due`) |

Full list: https://docs.stripe.com/testing

## 5. Scenarios to run

1. **Success**: cart → checkout → Continue to secure payment → pay with 4242 →
   success page polls `pending → paid → fulfilled` → codes in Library.
2. **Decline**: pay with `...0002` → Stripe shows the error, order stays
   `pending/failed`, cart intact, no codes.
3. **Cancel**: close / back from Checkout → `/checkout/cancel` explains that no
   payment was confirmed and the cart is intact (it never claims “failed”).
4. **Double-click**: hammer the pay button — one attempt, one session (button
   lock + in-flight guard + server fingerprint + Stripe idempotency key).
5. **Replay**: `stripe events trigger` the same event twice, or redeliver from
   Dashboard → exactly one set of codes (event PK + idempotent fulfilment).
6. **Recurring billing**: run only against a genuine first-party recurring service configured for test mode. Retail prepaid membership codes use the one-time purchase flow described in `PREPAID_CODES.md`.
7. **Renewals without waiting**: create a test clock in the Dashboard, attach
   the customer to it, advance a month, and watch `invoice.paid` extend the
   period. Docs: https://docs.stripe.com/billing/testing
8. **Forged success URL**: visit `/orders/GV-XXXX/success` logged in as someone
   else (or logged out) → “No such order”, never a confirmation.

## 6. What the server records per payment

`orders` row: `payStatus` (webhook-only) vs `fulfilStatus` (delivery) separately,
plus `stripeSessionId / stripePaymentIntentId / stripeCustomerId /
stripeSubscriptionId`. `stripe_events` ledgers every delivery with
received → processed/failed. `code_allocations` holds one row per delivered
code (UNIQUE). `checkout_attempts` ties retries to one order + session chain.
Check them in MySQL Workbench after each scenario above.

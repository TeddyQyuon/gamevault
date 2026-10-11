# Backend Milestone — IMPLEMENTED (Express + Sequelize + MySQL + Stripe test mode)

> Status (Sep 2026): the plan below is now built in `server/`. The frontend's
> mock order/payment services are replaced with authenticated API calls.
> Catalogue browsing still uses local fixture data; checkout, pricing, orders,
> codes and subscriptions are server-authoritative. See README.md +
> docs/STRIPE_TESTING.md for setup and verification.

Frontend integration points are already isolated in `src/services/`. Keep page
and component code unchanged; replace each service body with `fetch` calls.

## Proposed REST boundaries (routes → controllers → services/models)

```
GET    /api/products?category=&q=&platform=&genre=&region=&maxPrice=&inStock=&sort=&page=
GET    /api/products/:slug
GET    /api/subscriptions                        # plans + computed yearly math
POST   /api/orders          (auth)               # server recomputes totals from DB prices
GET    /api/orders          (auth)               # own orders only
GET    /api/orders/:id      (auth, owner only)
PATCH  /api/profile         (auth)
POST   /api/auth/register | POST /api/auth/login | POST /api/auth/logout
GET    /api/me              (auth)
```

Suggested server layout:

```
server/
  routes/        products.routes.js, orders.routes.js, auth.routes.js, subs.routes.js
  controllers/   thin: validate input, call services, map errors → HTTP codes
  services/      pricingService (recompute from DB), orderService (idempotency keys),
                 keyService (future fulfilment — NOT in demo)
  models/        User, Product, Variant, Order, OrderItem, Subscription, PromoCode
  middleware/    requireAuth (session/JWT in httpOnly cookie), validate, rateLimit
```

## Auth replacement

- Drop `SessionContext`'s localStorage profile. Use httpOnly session cookies
  (e.g. `express-session` + MySQL store, or short-lived JWT + refresh rotation).
- Never store passwords in plain text (`bcrypt`), never return password hashes.
- Keep the frontend `RequireAuth` redirect pattern, but enforce auth **on the
  server** for every `/api/orders`, `/api/profile`, `/api/me` call.

## Server-side pricing validation (critical)

- Client totals are display-only. `POST /api/orders` must load `Variant` rows
  by ID, check `stock > 0`, recompute `subtotal/discount/total` in integer cents,
  validate the promo (`GAMER10`: active, `minSubtotal`, single-use per order,
  never negative), decrement stock in a transaction, and use an **Idempotency-Key
  header** so retries/double-clicks create exactly one order.

## Database entities (Sequelize → MySQL)

- `User(id, name, email UNIQUE, passwordHash, country, createdAt)`
- `Product(id, slug UNIQUE, title, category, tagline, description, platforms JSON, genres JSON, regions JSON, rating, ratingsCount, artKey, flags JSON)`
- `Variant(id, productId FK, label, priceCents INT, compareAtCents INT NULL, stock INT)`
- `PromoCode(code PK, discountCents, minSubtotalCents, active)`
- `Order(id, userId FK, subtotalCents, discountCents, totalCents, contact JSON, paymentLabel, status, idempotencyKey UNIQUE, createdAt)`
- `OrderItem(id, orderId FK, variantId FK, qty, unitCents, lineTotal, codes JSON)`
- `Subscription(id, userId FK, planId, status, renewsAt)` — cancellation = end-of-period

## What stays future work

Real payment processing (Stripe/PayNow), real key procurement/distribution,
email delivery, and admin catalogue management. The demo's `DEMO-` codes and
“simulated” labels must be replaced by a proper fulfilment service — never
imply the frontend demo issues real keys.

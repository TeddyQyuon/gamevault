# Email delivery operations

## Catalog

The staff console supports Xbox Game Pass, PlayStation Plus, Nintendo Switch Online, EA Play, Discord Nitro, Netflix, Spotify, Disney+, YouTube Premium, Crunchyroll, Apple Music, Microsoft 365, Canva Pro, Adobe Creative Cloud and NordVPN.

`npm run catalog:prepare` is a local preparation command after migrations. It creates missing manual-delivery drafts with researched SGD starter prices and local brand images. Repeating it does not overwrite products or prices. The deployment image does not run this command; its Staff console can create the same offers directly through **Sell subscriptions**.

Each offer needs a positive price, a membership term, supported countries, and actual account requirements. Price references show whether the observed listing is an account, activation key or official retail plan. They are not interchangeable. Enter the terms you will actually supply; do not label an account offer as a code for an existing account.

Publish selected offers to make them available. No code import or stock count is needed. To stop sales, select **Paused** under Catalogue workflow. Manual variants never track inventory. All sales are one-time payments in SGD for the selected term.

## Paid orders

- Stripe verifies the webhook signature and `payment_status=paid` before marking an order paid.
- Checkout snapshots each item's fulfillment method, region and one-hour delivery window. Changing the product later does not change an existing order's delivery method.
- Paid manual items create a pending delivery task. They do not receive generated codes.
- Staff displays paid orders only, with contact details, quantities and deadlines. Overdue tasks are highlighted. The list refreshes every 30 seconds.
- **Compose customer email** opens your mail app with an order template. Fill in the real details and instructions, then send. GameVault does not send or monitor email.
- After sending, click **Mark delivered → Yes, mark delivered**. Only admins can do this, and only for paid manual items in that order. The change and audit entry commit together. Repeating the action does not create another audit entry or reset its delivery time.
- Mixed email/code orders remain pending until all items are delivered. Existing code allocations are reused when another payment event arrives.
- Customers can refresh their private order link or account order page to see delivery status. The private guest link must be kept private.

For an item-specific update, the staff API accepts `POST /api/admin/orders/:id/delivered` with `{ "itemIds": [123] }`. Omitting `itemIds` marks all pending manual items in the order delivered.

## Launch configuration

**Staff → Paid orders** shows payment readiness. Live checkout requires a Stripe secret key and matching `STRIPE_WEBHOOK_SECRET` (`whsec_...`). Register `https://YOUR-DOMAIN/api/webhooks/stripe` with the checkout completion, async success/failure and expiry events. Set `CLIENT_URL` to your public HTTPS storefront and use secure cookies in production. See [Go-live](GO_LIVE.md).

## Customer support and editing offers

- Customers submit messages through **Help & delivery → Contact support**. Requests are stored in the database and receive a reference number; no automatic email is sent.
- Check **Staff → Support inbox** for new requests. Use **Reply by email** to compose your reply in your email app; mark resolved after you send it. Verify customer ownership before sharing private order details. The inbox refreshes every 30 seconds while open.
- **Staff → Subscription offers** supports selecting services, applying shared requirements, and saving unfinished drafts. **Publish selected offers** requires accurate supported regions and account requirements. Saving edits keeps an existing publication and availability state.
- Run `npm run launch:check` from the project root for a read-only summary of configured payment settings, public URL and missing listing details. It does not verify Stripe credentials or endpoint delivery.

A readiness flag confirms configuration is present, not that Stripe endpoint delivery or hosting has been verified. Before launch, perform a complete checkout using Stripe test credentials and a signed webhook. Then verify the live webhook endpoint in Stripe before inviting customers.

// Supplier-adapter boundary. Each adapter implements:
//   checkAvailability({ variant, qty }) -> { available, qty }
//   quote({ variant, qty })             -> { unitCostCents, currency }
//   placeOrder({ item, idempotencyKey }) -> { extRef, status }
//   checkStatus({ extRef })              -> { status, detail }
//
// No supplier account exists, so only the MANUAL adapter is registered: it
// creates a fulfilment job for a human to complete (email the distributor,
// buy from an authorized wholesaler, etc.). External fulfilment must always
// use stable order references + retry rules so the same item is never
// purchased twice — see supplier_orders attempts/nextRetryAt.
//
// To add a real supplier later (e.g. Coda/UniPin for direct top-ups):
//  1. Get official API docs + sandbox + production credentials.
//  2. Implement the four methods above in suppliers/<name>.js (server-side only).
//  3. Store credentials in server/.env (never in code or the database).
//  4. Register the adapter in ADAPTERS below and map product.supplierSku.

export const ADAPTERS = {
  // manual: no external calls. placeOrder just opens a pending job.
  manual: {
    async checkAvailability() {
      return { available: false, qty: 0, reason: 'manual fulfilment has no live stock feed' }
    },
    async quote() {
      throw new Error('Manual fulfilment has no automated quotes.')
    },
    async placeOrder({ item, idempotencyKey }) {
      return { extRef: `manual-${item.id}-${idempotencyKey}`, status: 'pending' }
    },
    async checkStatus() {
      return { status: 'pending', detail: 'Awaiting manual fulfilment by staff.' }
    },
  },
}

export function getAdapter(name) {
  const adapter = ADAPTERS[name || 'manual']
  if (!adapter) throw new Error(`Supplier adapter not configured: ${name}`)
  return adapter
}

export function configuredAdapters() {
  return Object.keys(ADAPTERS)
}

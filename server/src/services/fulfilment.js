import { decryptCode } from './codeCrypto.js'
import { generateDemoCode } from './demoCodes.js'

// Delivery router. Payment success (payStatus) and delivery success
// (fulfilStatus) stay separate: paid-but-undeliverable orders surface as
// "Payment received — delivery pending" for administrators to resolve.
// NEVER generate codes for a paid LIVE order — live delivery only consumes
// imported inventory (or a supplier job). Plaintext codes are never logged.

export async function fulfilOrder(models, order, t, opts = {}) {
  const tx = t ? { transaction: t } : {}
  const live = Boolean(opts.live)
  if (order.fulfilStatus === 'fulfilled') return { alreadyFulfilled: true }
  const items = await models.OrderItem.findAll({ where: { orderId: order.id }, ...tx })
  const attempt = await models.CheckoutAttempt.findOne({ where: { orderId: order.id }, ...tx })

  if (order.mode === 'subscription') {
    // Entitlement is the subscription row (subscriptionService, same flow).
    await order.update({ fulfilStatus: 'fulfilled' }, tx)
    return { alreadyFulfilled: false }
  }

  let allDelivered = true
  for (const it of items) {
    const variant = await models.Variant.findByPk(it.variantId, {
      include: [{ model: models.Product }],
      ...tx,
    })
    const fulfilment = it.fulfilment || variant?.Product?.fulfilment || 'demo_test'
    if (fulfilment === 'demo_test') {
      // LIVE REFUSAL (second line of defence after the checkout guard):
      // never invent TEST- codes for real money. The order stays
      // paid-but-unfulfilled so staff see it and resolve it manually.
      // Never throws — throwing would make Stripe retry forever.
      if (live) {
        allDelivered = false
      } else {
        await deliverTestCodes(models, it, tx)
      }
    } else if (fulfilment === 'code_inventory') {
      // A mixed manual/code order may receive another payment event while
      // waiting for email delivery. Never allocate those codes twice.
      const delivered = await models.CodeAllocation.count({ where: { orderItemId: it.id }, ...tx })
      if (delivered >= it.qty) continue
      const res = await allocateInventory(models, it, attempt?.id, tx, opts)
      if (!res.ok) allDelivered = false
    } else if (fulfilment === 'manual') {
      // Search all states so replaying a payment never recreates a completed job.
      const [job] = await models.SupplierOrder.findOrCreate({
        where: { orderItemId: it.id, adapter: 'manual' },
        defaults: { orderItemId: it.id, adapter: 'manual', status: 'pending' },
        ...tx,
      })
      if (job.status !== 'fulfilled') allDelivered = false
    } else {
      // supplier / manual: open a retryable job for staff; delivery pends.
      await models.SupplierOrder.findOrCreate({
        where: { orderItemId: it.id, status: ['pending', 'placed', 'failed'] },
        defaults: { orderItemId: it.id, adapter: 'manual', status: 'pending' },
        ...tx,
      }).catch(async () => {
        await models.SupplierOrder.create({ orderItemId: it.id, adapter: 'manual', status: 'pending' }, tx)
      })
      allDelivered = false
    }
  }

  await order.update({ fulfilStatus: allDelivered ? 'fulfilled' : 'pending' }, tx)
  return { alreadyFulfilled: false, allDelivered }
}

// Test-mode path: clearly labelled TEST- codes for demo_test products.
// The server only runs Stripe test mode, so this path can never back a live order.
async function deliverTestCodes(models, item, tx) {
  const existing = await models.CodeAllocation.count({ where: { orderItemId: item.id }, ...tx })
  if (existing >= item.qty) return
  const rows = []
  for (let i = existing; i < item.qty; i += 1) {
    rows.push({ orderItemId: item.id, code: generateDemoCode(item.variantId, i) })
  }
  try {
    await models.CodeAllocation.bulkCreate(rows, tx)
  } catch (err) {
    if (err?.name !== 'SequelizeUniqueConstraintError') throw err
    // Partial insert raced — recount next run (idempotent).
  }
}

// Live path: consume this attempt's reservations first (payment/expiry races),
// then free stock. Returns { ok } — false means paid-but-unfulfilled.
async function allocateInventory(models, item, attemptId, tx, _opts = {}) {
  const where = { variantId: item.variantId }
  const take = async (extra, n) => models.InventoryCode.findAll({
    where: { ...where, ...extra }, limit: n, order: [['id', 'ASC']],
    ...(tx.transaction ? { transaction: tx.transaction, lock: 'UPDATE' } : {}),
  })
  let rows = attemptId ? await take({ status: 'reserved', reservedByAttemptId: attemptId }, item.qty) : []
  if (rows.length < item.qty) {
    rows = rows.concat(await take({ status: 'available' }, item.qty - rows.length))
  }
  if (rows.length < item.qty) return { ok: false }
  const allocs = []
  for (const r of rows) {
    await r.update({ status: 'delivered', orderItemId: item.id, reservedByAttemptId: null, reservedUntil: null }, tx)
    // Placeholder text stays unique per row; the real code resolves at read
    // time from the encrypted inventory row (see codesForItem).
    allocs.push({ orderItemId: item.id, code: `INV-${r.id}`, inventoryCodeId: r.id })
  }
  await models.CodeAllocation.bulkCreate(allocs, tx)
  return { ok: true }
}

// Resolve owner-visible codes: decrypt inventory rows, pass through test codes.
export async function codesForItem(models, allocation) {
  if (allocation.inventoryCodeId) {
    const row = await models.InventoryCode.findOne({
      where: { id: allocation.inventoryCodeId, orderItemId: allocation.orderItemId, status: 'delivered' },
    })
    if (!row) return null
    try {
      return decryptCode(row.codeCipher)
    } catch {
      return null
    }
  }
  if (allocation.code && !allocation.code.startsWith('INV-')) return allocation.code
  return null
}

// Paid but genuinely undeliverable: visible marker, never an invented key.
export async function markUnfulfilled(order, t) {
  const tx = t ? { transaction: t } : {}
  if (order.fulfilStatus === 'fulfilled') return
  await order.update({ fulfilStatus: 'unfulfilled' }, tx)
}

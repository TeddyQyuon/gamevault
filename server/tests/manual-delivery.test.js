import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { manualOrdersController } from '../src/controllers/manualOrdersController.js'
import { priceOneTimeCart } from '../src/services/pricing.js'
import { fulfilOrder } from '../src/services/fulfilment.js'

const row = data => ({ ...data, async update(patch) { Object.assign(this, patch); return this } })
function setup({ paid = true, admin = true, codeQty = null } = {}) {
  const order = row({ id: 'GV-MANUAL', mode: 'payment', payStatus: paid ? 'paid' : 'pending', fulfilStatus: 'pending' })
  const items = [row({ id: 1, orderId: order.id, variantId: 'manual', fulfilment: 'manual', region: 'Test region', deliveryWindowMinutes: 60, qty: 1, deliveredAt: null })]
  if (codeQty !== null) items.push(row({ id: 2, orderId: order.id, variantId: 'code', fulfilment: 'code_inventory', qty: 1 }))
  const jobs = new Map()
  const audits = []
  const models = {
    User: { async findByPk() { return { id: 'staff', role: admin ? 'admin' : 'customer' } } },
    Order: { async findByPk(id) { return id === order.id ? order : null } },
    OrderItem: { async findAll() { return items } },
    CheckoutAttempt: { async findOne() { return null } },
    Variant: { async findByPk() { return null } },
    CodeAllocation: { async count() { return codeQty || 0 } },
    SupplierOrder: { async findOrCreate({ where, defaults }) { if (jobs.has(where.orderItemId)) return [jobs.get(where.orderItemId), false]; const job = row(defaults); jobs.set(where.orderItemId, job); return [job, true] } },
    AdminAudit: { async create(data) { audits.push(data) } },
  }
  const sequelize = { async transaction(fn) { return fn({ LOCK: { UPDATE: 'UPDATE' } }) } }
  const controller = manualOrdersController({ models, sequelize, cfg: {} })
  return { order, items, jobs, audits, models, controller }
}
async function deliver(context, body = {}) {
  let result, failure
  await context.controller.markDelivered({ userId: 'staff', params: { id: context.order.id }, body }, { json(data) { result = data } }, error => { failure = error })
  if (failure) throw failure
  return result
}

describe('manual email delivery', () => {
  it('accepts available manual offers with zero stored codes or legacy stock', async () => {
    const result = await priceOneTimeCart({ items: [{ variantId: 'manual', qty: 5 }] }, { findVariant: async () => ({ id: 'manual', label: '1 month', productTitle: 'Membership', priceCents: 1000, active: true, billingType: 'one_time', stock: 0, fulfilment: 'manual', publication: 'published', availability: 'available', trackInventory: true, availableCount: 0, region: 'Test region' }) })
    assert.equal(result.totalCents, 5000)
    assert.equal(result.lines[0].trackInventory, false)
    assert.equal(result.lines[0].deliveryWindowMinutes, 60)
  })
  it('does not make draft offers purchasable', async () => {
    await assert.rejects(priceOneTimeCart({ items: [{ variantId: 'manual', qty: 1 }] }, { findVariant: async () => ({ id: 'manual', active: true, billingType: 'one_time', fulfilment: 'manual', publication: 'draft' }) }), { code: 'PRODUCT_UNAVAILABLE' })
  })
  it('queues paid manual items without inventing codes and reuses the task', async () => {
    const ctx = setup()
    await fulfilOrder(ctx.models, ctx.order, null, { live: true })
    await fulfilOrder(ctx.models, ctx.order, null, { live: true })
    assert.equal(ctx.jobs.size, 1)
    assert.equal(ctx.order.fulfilStatus, 'pending')
    assert.equal(ctx.jobs.get(1).status, 'pending')
  })
  it('rejects delivery confirmation by a non-admin', async () => {
    const ctx = setup({ admin: false })
    await assert.rejects(deliver(ctx), { code: 'FORBIDDEN' })
    assert.equal(ctx.audits.length, 0)
  })
  it('rejects delivery of an unpaid order', async () => {
    const ctx = setup({ paid: false })
    await assert.rejects(deliver(ctx), { code: 'PAYMENT_REQUIRED' })
    assert.equal(ctx.items[0].deliveredAt, null)
  })
  it('records email delivery once and keeps its timestamp on replay', async () => {
    const ctx = setup()
    const first = await deliver(ctx)
    const timestamp = ctx.items[0].deliveredAt
    const second = await deliver(ctx)
    assert.deepEqual(first.deliveredItemIds, [1])
    assert.deepEqual(second.deliveredItemIds, [])
    assert.equal(ctx.order.fulfilStatus, 'fulfilled')
    assert.equal(ctx.jobs.get(1).status, 'fulfilled')
    assert.equal(ctx.items[0].deliveredAt, timestamp)
    assert.equal(ctx.audits.length, 1)
  })
  it('rejects item IDs from another order or code-delivered items', async () => {
    const ctx = setup({ codeQty: 1 })
    await assert.rejects(deliver(ctx, { itemIds: [99] }), { code: 'BAD_ITEMS' })
    await assert.rejects(deliver(ctx, { itemIds: [2] }), { code: 'BAD_ITEMS' })
  })
  it('keeps mixed orders pending until their codes are allocated', async () => {
    const ctx = setup({ codeQty: 0 })
    await deliver(ctx)
    assert.equal(ctx.order.fulfilStatus, 'pending')
    const complete = setup({ codeQty: 1 })
    await deliver(complete)
    assert.equal(complete.order.fulfilStatus, 'fulfilled')
  })
})

import { Op } from 'sequelize'
import { ah, badRequest, notFound } from '../errors.js'
import { stripeConfigured } from '../config.js'
import { requireAdmin } from './adminController.js'

export function manualOrdersController({ models, sequelize, cfg }) {
  return {
    readiness: ah(async (req, res) => {
      await requireAdmin(models, req.userId)
      const publishedOffers = await models.Product.count({ where: { publication: 'published', availability: 'available' } })
      const publicHttps = /^https:\/\//i.test(cfg.clientUrl) && !/^https:\/\/(localhost|127\.0\.0\.1)([:/]|$)/i.test(cfg.clientUrl)
      res.json({
        paymentsConfigured: stripeConfigured(cfg),
        webhookConfigured: Boolean(cfg.stripeWebhookSecret?.startsWith('whsec_')),
        checkoutReady: stripeConfigured(cfg) && Boolean(cfg.stripeWebhookSecret?.startsWith('whsec_')),
        deliveryWindowMinutes: 60,
        clientUrl: cfg.clientUrl,
        publicHttps,
        publishedOffers,
        webhookUrl: publicHttps ? `${cfg.clientUrl}/api/webhooks/stripe` : null,
      })
    }),
    list: ah(async (req, res) => {
      await requireAdmin(models, req.userId)
      const status = req.query.status || 'pending'
      if (!['pending', 'delivered', 'all'].includes(status)) throw badRequest('BAD_STATUS', 'Choose pending, delivered or all orders.')
      const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1))
      const where = { payStatus: 'paid' }
      const itemWhere = { fulfilment: 'manual' }
      if (status !== 'all') itemWhere.deliveredAt = status === 'pending' ? null : { [Op.ne]: null }
      const { rows, count } = await models.Order.findAndCountAll({
        where, distinct: true, limit: 30, offset: (page - 1) * 30,
        order: [['paidAt', 'ASC'], ['createdAt', 'ASC']],
        include: [{ model: models.OrderItem, where: itemWhere, required: true }],
      })
      res.json({ page, total: count, pageSize: 30, orders: rows.map(order => {
        const paidAt = order.paidAt || order.createdAt
        return {
          id: order.id, contactName: order.contactName, contactEmail: order.contactEmail,
          contactCountry: order.contactCountry, totalCents: order.totalCents, currency: order.currency,
          payStatus: order.payStatus, fulfilStatus: order.fulfilStatus, paidAt,
          items: order.OrderItems.map(item => ({
            id: item.id, title: item.productTitle, label: item.variantLabel, region: item.region,
            qty: item.qty, deliveredAt: item.deliveredAt,
            dueAt: new Date(new Date(paidAt).getTime() + (item.deliveryWindowMinutes || 60) * 60000),
          })),
        }
      }) })
    }),
    markDelivered: ah(async (req, res) => {
      const admin = await requireAdmin(models, req.userId)
      const requested = req.body?.itemIds
      if (requested !== undefined && (!Array.isArray(requested) || !requested.length || requested.some(id => !Number.isSafeInteger(id) || id < 1))) {
        throw badRequest('BAD_ITEMS', 'Choose the emailed order items.')
      }
      const result = await sequelize.transaction(async transaction => {
        const order = await models.Order.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE })
        if (!order) throw notFound('ORDER_NOT_FOUND', 'Order not found.')
        if (order.payStatus !== 'paid') throw badRequest('PAYMENT_REQUIRED', 'Only confirmed paid orders can be marked delivered.')
        const items = await models.OrderItem.findAll({ where: { orderId: order.id }, transaction })
        const selected = items.filter(item => item.fulfilment === 'manual' && (!requested || requested.includes(item.id)))
        if (!selected.length || (requested && new Set(requested).size !== selected.length)) throw badRequest('BAD_ITEMS', 'Choose manual email items belonging to this order.')
        const deliveredAt = new Date()
        const changed = []
        for (const item of selected) {
          if (item.deliveredAt) continue
          const [job] = await models.SupplierOrder.findOrCreate({
            where: { orderItemId: item.id, adapter: 'manual' },
            defaults: { orderItemId: item.id, adapter: 'manual', status: 'pending' }, transaction,
          })
          await job.update({ status: 'fulfilled', lastError: null }, { transaction })
          await item.update({ deliveredAt }, { transaction })
          changed.push(item.id)
        }
        let complete = true
        for (const item of items) {
          if (item.fulfilment === 'manual') complete = complete && Boolean(item.deliveredAt)
          else {
            const count = await models.CodeAllocation.count({ where: { orderItemId: item.id }, transaction })
            complete = complete && count >= item.qty
          }
        }
        await order.update({ fulfilStatus: complete ? 'fulfilled' : 'pending' }, { transaction })
        if (changed.length) await models.AdminAudit.create({
          adminUserId: admin.id, entity: 'order', entityId: order.id, action: 'email_delivered',
          diff: { itemIds: changed, deliveredAt: deliveredAt.toISOString() },
        }, { transaction })
        return { ok: true, fulfilStatus: order.fulfilStatus, deliveredItemIds: changed }
      })
      res.json(result)
    }),
  }
}

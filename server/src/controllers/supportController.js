import { randomUUID } from 'node:crypto'
import { ah, badRequest, notFound } from '../errors.js'
import { requireAdmin } from './adminController.js'

const TOPICS = new Set(['delivery', 'payment', 'activation', 'before_purchase', 'other'])
function text(value, max, label, optional = false) {
  if (optional && (value === undefined || value === '')) return ''
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
    throw badRequest('BAD_SUPPORT_REQUEST', `Enter ${label} (up to ${max} characters).`)
  }
  return value.trim()
}

export function supportController({ models, sequelize }) {
  return {
    create: ah(async (req, res) => {
      const body = req.body || {}
      const name = text(body.name, 100, 'your name')
      const email = text(body.email, 254, 'your email').toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw badRequest('BAD_EMAIL', 'Enter a valid email address.')
      if (!TOPICS.has(body.topic)) throw badRequest('BAD_TOPIC', 'Choose a help topic.')
      const message = text(body.message, 4000, 'your message')
      if (message.length < 10) throw badRequest('BAD_MESSAGE', 'Please describe the issue in at least 10 characters.')
      const orderReference = text(body.orderReference, 32, 'an order number', true)
      // The supplied reference is unverified. Never disclose order existence or
      // customer information from this anonymous contact endpoint.
      const id = randomUUID()
      await models.SupportRequest.create({ id, name, email, topic: body.topic, message, orderReference })
      res.status(201).json({ reference: id })
    }),
    list: ah(async (req, res) => {
      await requireAdmin(models, req.userId)
      const status = req.query.status || 'open'
      if (!['open', 'resolved', 'all'].includes(status)) throw badRequest('BAD_STATUS', 'Choose open, resolved or all messages.')
      const page = Math.max(1, Math.min(10000, Number.parseInt(req.query.page, 10) || 1))
      const { rows, count } = await models.SupportRequest.findAndCountAll({
        where: status === 'all' ? {} : { status }, limit: 20, offset: (page - 1) * 20, order: [['createdAt', 'DESC']],
      })
      res.json({ requests: rows, total: count, page, pageSize: 20 })
    }),
    update: ah(async (req, res) => {
      const admin = await requireAdmin(models, req.userId)
      const status = req.body?.status
      if (!['open', 'resolved'].includes(status)) throw badRequest('BAD_STATUS', 'Choose open or resolved.')
      await sequelize.transaction(async transaction => {
        const request = await models.SupportRequest.findByPk(req.params.id, { transaction, lock: transaction.LOCK.UPDATE })
        if (!request) throw notFound('REQUEST_NOT_FOUND', 'Support request not found.')
        if (request.status === status) return
        await request.update({ status, resolvedAt: status === 'resolved' ? new Date() : null }, { transaction })
        await models.AdminAudit.create({ adminUserId: admin.id, entity: 'support', entityId: request.id, action: status, diff: { status } }, { transaction })
      })
      res.json({ ok: true })
    }),
  }
}

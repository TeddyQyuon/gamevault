import { ah, badRequest, forbidden, notFound } from '../errors.js'
import { parseCodeCsv, previewImport, confirmImport } from '../services/inventory.js'

// Staff-only catalogue + inventory operations. Every route sits behind
// [login + sameOrigin] in app.js; requireAdmin adds the role check.
// Public registration can never set role (see authController) — the first
// admin is promoted with `npm run admin:promote -- user@example.com`.
export async function requireAdmin(models, userId) {
  const me = await models.User.findByPk(userId)
  if (!me || me.role !== 'admin') throw forbidden('FORBIDDEN', 'Staff only.')
  return me
}

async function audit(models, adminId, entity, entityId, action, diff) {
  try {
    await models.AdminAudit.create({ adminUserId: adminId, entity, entityId, action, diff })
  } catch {
    // Audit must never block the operation itself.
  }
}

const PUBLICATIONS = new Set(['draft', 'published', 'archived'])
const AVAILABILITIES = new Set(['available', 'out_of_stock', 'coming_soon'])
const FULFILMENTS = new Set(['code_inventory', 'supplier', 'manual', 'demo_test'])
const CATEGORIES = new Set(['streaming', 'music', 'gaming-membership', 'gift-cards', 'game-keys', 'mobile-topup', 'software', 'games', 'subscriptions'])

function metadata(body) {
  const patch = {}
  for (const [key, limit] of Object.entries({ region: 80, brand: 80, description: 10000, tagline: 200, eligibility: 2000, artworkPath: 255 })) {
    if (body[key] === undefined) continue
    if (typeof body[key] !== 'string' || body[key].length > limit) throw badRequest('BAD_DETAILS', `Invalid ${key}.`)
    patch[key] = body[key].trim()
  }
  if (patch.artworkPath && !/^https?:\/\/[^\s]+$/i.test(patch.artworkPath) && !/^\/assets\/[^\s]+$/.test(patch.artworkPath)) {
    throw badRequest('BAD_IMAGE', 'Use an HTTPS image URL or an /assets/ image path.')
  }
  if (body.artworkFit !== undefined) {
    if (!['cover','contain'].includes(body.artworkFit)) throw badRequest('BAD_IMAGE', 'Image fit must be cover or contain.')
    patch.artworkFit = body.artworkFit
  }
  return patch
}
function price(value) {
  const n = Number(value)
  if (!Number.isSafeInteger(n) || n < 1 || n > 10000000) throw badRequest('BAD_PRICE', 'Price must be a positive amount in cents.')
  return n
}

export function adminController({ models, sequelize }) {
  return {
    // GET /api/admin/me — { admin: true } or 403. The admin UI gates on this.
    me: ah(async (req, res) => {
      await requireAdmin(models, req.userId)
      res.json({ admin: true })
    }),

    // GET /api/admin/products — every product with variants + live code counts.
    listProducts: ah(async (req, res) => {
      await requireAdmin(models, req.userId)
      const products = await models.Product.findAll({ order: [['title', 'ASC']] })
      const variants = await models.Variant.findAll({ order: [['productId', 'ASC'], ['priceCents', 'ASC']] })
      const codes = await models.InventoryCode.findAll({ attributes: ['variantId', 'status'] })
      const counts = {}
      for (const c of codes) {
        const e = (counts[c.variantId] = counts[c.variantId] || { available: 0, reserved: 0, delivered: 0 })
        if (e[c.status] !== undefined) e[c.status] += 1
      }
      const byProduct = new Map()
      for (const v of variants) {
        if (!byProduct.has(v.productId)) byProduct.set(v.productId, [])
        byProduct.get(v.productId).push({
          variantId: v.id, label: v.label, priceCents: v.priceCents,
          stock: v.stock, billingType: v.billingType, active: v.active,
          trackInventory: v.trackInventory,
          counts: counts[v.id] || { available: 0, reserved: 0, delivered: 0 },
        })
      }
      res.json({
        products: products.map((p) => ({
          id: p.id, slug: p.slug, title: p.title, category: p.category,
          publication: p.publication, availability: p.availability, fulfilment: p.fulfilment,
          region: p.region, artworkPath: p.artworkPath, artworkFit: p.artworkFit,
          brand: p.brand, description: p.description, eligibility: p.eligibility,
          variants: byProduct.get(p.id) || [],
        })),
      })
    }),

    // PATCH /api/admin/products/:id — workflow fields for go-live:
    // { publication?, availability?, fulfilment?, variants?: [{ variantId, trackInventory?, active? }] }
    updateProduct: ah(async (req, res) => {
      const admin = await requireAdmin(models, req.userId)
      const product = await models.Product.findByPk(req.params.id)
      if (!product) throw notFound('PRODUCT_NOT_FOUND', 'Unknown product.')
      const { publication, availability, fulfilment, variants } = req.body || {}
      const patch = metadata(req.body || {})
      if (publication !== undefined) {
        if (!PUBLICATIONS.has(publication)) throw badRequest('BAD_WORKFLOW', 'Invalid publication state.')
        patch.publication = publication
      }
      if (availability !== undefined) {
        if (!AVAILABILITIES.has(availability)) throw badRequest('BAD_WORKFLOW', 'Invalid availability.')
        patch.availability = availability
      }
      if (fulfilment !== undefined) {
        if (!FULFILMENTS.has(fulfilment)) throw badRequest('BAD_WORKFLOW', 'Invalid fulfilment source.')
        patch.fulfilment = fulfilment
      }
      const effectiveFulfilment = fulfilment || product.fulfilment
      const allVariants = await models.Variant.findAll({ where: { productId: product.id } })
      const effectivePublication = publication ?? product.publication
      const effectiveAvailability = availability ?? product.availability
      if (effectiveFulfilment === 'manual' && allVariants.some(v => v.billingType === 'recurring')) {
        throw badRequest('RECURRING_PRODUCT', 'Email-delivered offers must use a one-time payment for a fixed membership term.')
      }
      if (effectiveFulfilment === 'code_inventory' && allVariants.some(v=>v.billingType==='recurring')) {
        throw badRequest('RECURRING_PRODUCT', 'Create a prepaid product for activation codes. Recurring payment plans cannot use code inventory.')
      }
      const variantUpdates = []
      if (Array.isArray(variants)) {
        for (const v of variants) {
          if (!v?.variantId) continue
          const row = await models.Variant.findByPk(v.variantId)
          if (!row || row.productId !== product.id) continue
          const vp = {}
          if (v.trackInventory !== undefined) vp.trackInventory = Boolean(v.trackInventory)
          if (v.active !== undefined) vp.active = Boolean(v.active)
          if (v.priceCents !== undefined) vp.priceCents = price(v.priceCents)
          if (v.label !== undefined) {
            if (typeof v.label !== 'string' || !v.label.trim() || v.label.length > 100) throw badRequest('BAD_LABEL', 'Enter a membership term or denomination, up to 100 characters.')
            vp.label = v.label.trim()
          }
          if (effectiveFulfilment === 'code_inventory') vp.trackInventory = true
          if (effectiveFulfilment === 'manual') vp.trackInventory = false
          if (Object.keys(vp).length) variantUpdates.push({ variantId: row.id, ...vp })
        }
      }
      if (effectivePublication === 'published' && effectiveAvailability === 'available') {
        const sellableVariants = allVariants.filter((variant) => {
          const update = variantUpdates.find((candidate) => candidate.variantId === variant.id)
          return update?.active ?? variant.active
        })
        if (!sellableVariants.length || sellableVariants.some((variant) => {
          const update = variantUpdates.find((candidate) => candidate.variantId === variant.id)
          return Number(update?.priceCents ?? variant.priceCents) < 1
        })) {
          throw badRequest('PRICE_UNAVAILABLE', 'Set a positive selling price for at least one active variant before publishing.')
        }
      }
      if (availability === 'available' && effectiveFulfilment === 'code_inventory') {
        const sellableVariantIds = allVariants.filter((variant) => {
          const update = variantUpdates.find((candidate) => candidate.variantId === variant.id)
          return update?.active ?? variant.active
        }).map((variant) => variant.id)
        const availableCodes = sellableVariantIds.length
          ? await models.InventoryCode.count({ where: { variantId: sellableVariantIds, status: 'available' } })
          : 0
        if (!availableCodes) throw badRequest('NO_INVENTORY', 'Import at least one valid code before marking a code-inventory product available.')
      }
      if (product.category === 'subscriptions' && effectivePublication === 'published' && effectiveAvailability === 'available') {
        const subscriptionDetails = {
          brand: patch.brand ?? product.brand,
          region: patch.region ?? product.region,
          eligibility: patch.eligibility ?? product.eligibility,
          artworkPath: patch.artworkPath ?? product.artworkPath,
        }
        if (Object.values(subscriptionDetails).some((value) => !String(value || '').trim())) {
          throw badRequest('INCOMPLETE_SUBSCRIPTION', 'Add the brand logo, redemption region and verified account eligibility before publishing a subscription offer.')
        }
      }
      await sequelize.transaction(async transaction => {
        if (Object.keys(patch).length) await product.update(patch, { transaction })
        for (const { variantId, ...vp } of variantUpdates) await models.Variant.update(vp, { where: { id: variantId, productId: product.id }, transaction })
        if (effectiveFulfilment === 'code_inventory') await models.Variant.update({ trackInventory: true }, { where: { productId: product.id }, transaction })
        if (effectiveFulfilment === 'manual') await models.Variant.update({ trackInventory: false }, { where: { productId: product.id }, transaction })
      })
      await audit(models, admin.id, 'product', product.id, 'update', { ...patch, variants: variantUpdates })
      res.json({ ok: true })
    }),

    // POST /api/admin/products — minimal real-product creation for go-live.
    // { title, category, priceCents, fulfilment?, label? } → draft product + one variant.
    // Products are born as drafts so a second pair of eyes publishes them.
    createProduct: ah(async (req, res) => {
      const admin = await requireAdmin(models, req.userId)
      const title = (req.body?.title || '').trim()
      const category = (req.body?.category || '').trim()
      const priceCents = price(req.body?.priceCents)
      const fulfilment = (req.body?.fulfilment || 'manual').trim()
      const label = (req.body?.label || 'Standard').trim() || 'Standard'
      if (label.length > 100) throw badRequest('BAD_LABEL', 'Label must be at most 100 characters.')
      const details = metadata(req.body || {})
      if (title.length < 3 || title.length > 160) throw badRequest('BAD_TITLE', 'Title must be 3–160 characters.')
      if (!CATEGORIES.has(category)) throw badRequest('BAD_CATEGORY', 'Unknown category.')
      if (!Number.isInteger(priceCents) || priceCents < 1) throw badRequest('BAD_PRICE', 'Price must be a positive integer (cents).')
      if (!FULFILMENTS.has(fulfilment) || fulfilment === 'demo_test') {
        throw badRequest('BAD_FULFILMENT', 'New products must use code_inventory, supplier or manual (never demo_test).')
      }
      if (category === 'subscriptions') {
        if (!['code_inventory', 'manual'].includes(fulfilment)) throw badRequest('BAD_FULFILMENT', 'Choose email delivery or activation-code inventory for subscription offers.')
        if (!label || label === 'Standard') throw badRequest('BAD_LABEL', 'Enter the actual membership term or denomination.')
        if (!details.brand || !details.region || !details.eligibility || !details.artworkPath) {
          throw badRequest('INCOMPLETE_SUBSCRIPTION', 'Add the real brand, image, redemption region and supplier-verified account eligibility.')
        }
      }
      const slugBase = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100) || 'product'
      let slug = slugBase
      let n = 1
      while (await models.Product.findOne({ where: { slug } })) {
        n += 1
        slug = `${slugBase}-${n}`
      }
      const id = `p-${slug}`.slice(0, 48)
      const publishNow = req.body?.publishNow === true && fulfilment === 'manual'
      if (await models.Product.findByPk(id)) throw badRequest('SLUG_TAKEN', 'A product with that id already exists.')
      const variant = await sequelize.transaction(async transaction => {
        await models.Product.create({
          id, slug, title, category, ...details, publication: publishNow ? 'published' : 'draft', availability: fulfilment === 'manual' ? 'available' : 'out_of_stock', fulfilment,
          productType: ['subscriptions','gaming-membership','streaming','music'].includes(category) ? 'prepaid_voucher' : 'gift_card',
        }, { transaction })
        return models.Variant.create({
          id: `${slug}-standard`.slice(0, 64), productId: id, label,
          priceCents, stock: fulfilment === 'code_inventory' ? 0 : 999, billingType: 'one_time', active: true, trackInventory: fulfilment === 'code_inventory',
        }, { transaction })
      })
      await audit(models, admin.id, 'product', id, 'create', { title, category, priceCents, fulfilment })
      res.status(201).json({ id, slug, variantId: variant.id })
    }),

    // POST /api/admin/inventory/preview — { variantId, text } → counts + problems.
    // Nothing is written. Plaintext codes are never logged.
    previewInventory: ah(async (req, res) => {
      await requireAdmin(models, req.userId)
      const variantId = (req.body?.variantId || '').trim()
      const text = String(req.body?.text || '')
      if (!variantId) throw badRequest('BAD_VARIANT', 'Choose a variant.')
      if (!text.trim()) throw badRequest('EMPTY_CODES', 'Paste at least one code.')
      if (text.length > 200000) throw badRequest('TOO_LARGE', 'Paste at most ~200KB per import.')
      const variant = await models.Variant.findByPk(variantId, { include: [{ model: models.Product }] })
      if (!variant) throw notFound('VARIANT_NOT_FOUND', 'Unknown variant.')
      if (variant.Product?.fulfilment !== 'code_inventory' || variant.billingType === 'recurring') {
        throw badRequest('WRONG_FULFILMENT', 'Codes can only be imported for code_inventory products. Change fulfilment first.')
      }
      const { rows, errors } = parseCodeCsv(text)
      if (!rows.length) return res.json({ total: 0, valid: 0, duplicates: [], duplicateCount: 0, errors, counts: null })
      const preview = await previewImport(models, variantId, rows.slice(0, 5000))
      res.json({ total: rows.length, ...preview, errors: errors.slice(0, 50) })
    }),

    // POST /api/admin/inventory/confirm — { variantId, text, filename? } → import.
    confirmInventory: ah(async (req, res) => {
      const admin = await requireAdmin(models, req.userId)
      const variantId = (req.body?.variantId || '').trim()
      const text = String(req.body?.text || '')
      const filename = String(req.body?.filename || 'pasted-codes.txt').slice(0, 200)
      if (!variantId || !text.trim()) throw badRequest('BAD_IMPORT', 'Variant and codes are required.')
      if (text.length > 200000) throw badRequest('TOO_LARGE', 'Paste at most ~200KB per import.')
      const variant = await models.Variant.findByPk(variantId, { include: [{ model: models.Product }] })
      if (!variant) throw notFound('VARIANT_NOT_FOUND', 'Unknown variant.')
      if (variant.Product?.fulfilment !== 'code_inventory' || variant.billingType === 'recurring') {
        throw badRequest('WRONG_FULFILMENT', 'Codes can only be imported for code_inventory products.')
      }
      const { rows, errors } = parseCodeCsv(text)
      if (!rows.length) throw badRequest('NO_VALID_CODES', 'No valid codes to import.')
      const result = await confirmImport(models, sequelize, {
        variantId, codes: rows.slice(0, 5000), filename, adminId: admin.id,
      })
      await audit(models, admin.id, 'inventory', variantId, 'import', {
        filename, imported: result.imported, duplicates: result.duplicates, errorRows: errors.length,
      })
      res.status(201).json({ ...result, errorRows: errors.length })
    }),
  }
}

import { Op, fn, col } from 'sequelize'
import { ah, notFound } from '../errors.js'

// Public stock consists of actual available codes. Never expose code values.
export function productsController({ models }) {
  async function stockCounts() {
    const rows = await models.InventoryCode.findAll({
      attributes: ['variantId', [fn('COUNT', col('id')), 'availableCount']],
      where: { status: 'available' }, group: ['variantId'], raw: true,
    })
    return new Map(rows.map((row) => [row.variantId, Number(row.availableCount)]))
  }
  function serialize(p, variants, counts) {
    const vs = variants.filter(v=>p.fulfilment !== 'code_inventory' || v.billingType === 'one_time').map((v) => {
      const onDemand = p.fulfilment === 'manual'
      const available = p.availability === 'available' && v.priceCents > 0 && v.billingType === 'one_time'
      const stock = onDemand ? null : available && p.fulfilment === 'code_inventory' ? (counts.get(v.id) || 0) : 0
      return {
        id: v.id, label: v.label, priceCents: v.priceCents, compareAtCents: v.compareAtCents,
        billingType: v.billingType, billingInterval: v.billingInterval,
        durationLabel: v.durationLabel, stock, stockMode: onDemand ? 'on_demand' : 'codes',
        inStock: available && (onDemand || stock > 0),
      }
    })
    return {
      id: p.id, slug: p.slug, title: p.title, brand: p.brand, category: p.category,
      tagline: p.tagline, description: p.description, artKey: p.artKey,
      artworkPath: p.artworkPath, artworkFit: p.artworkFit, region: p.region,
      redeemSteps: p.redeemSteps, eligibility: p.eligibility, productType: p.productType,
      fulfilment: p.fulfilment, availability: p.availability,
      deliveryWindowMinutes: p.fulfilment === 'manual' ? 60 : null,
      featured: p.featured, trending: p.trending, deal: p.deal,
      rating: p.rating, ratingsCount: p.ratingsCount,
      priceFromCents: vs.length ? Math.min(...vs.map((v) => v.priceCents)) : null,
      inStock: vs.some((v) => v.inStock), variants: vs,
    }
  }
  const publicWhere = { publication: 'published', fulfilment: { [Op.ne]: 'demo_test' } }
  return {
    list: ah(async (_req, res) => {
      const [products, variants, counts] = await Promise.all([
        models.Product.findAll({ where: publicWhere, order: [['title','ASC']] }),
        models.Variant.findAll({ where: { active: true } }), stockCounts(),
      ])
      const byProduct = new Map()
      for (const v of variants) {
        if (!byProduct.has(v.productId)) byProduct.set(v.productId,[])
        byProduct.get(v.productId).push(v)
      }
      res.json({ products: products.map((p) => serialize(p, byProduct.get(p.id) || [], counts)) })
    }),
    getBySlug: ah(async (req, res) => {
      const product = await models.Product.findOne({ where: { ...publicWhere, slug: req.params.slug } })
      if (!product) throw notFound('PRODUCT_NOT_FOUND','Unknown product.')
      const [variants, counts] = await Promise.all([
        models.Variant.findAll({ where: { productId: product.id, active: true }, order: [['priceCents','ASC']] }), stockCounts(),
      ])
      res.json({ product: serialize(product, variants, counts) })
    }),
  }
}

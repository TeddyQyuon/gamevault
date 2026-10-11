// Local preparation only. Does not publish, import codes, or overwrite merchant edits.
import { access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { getSequelize } from './db.js'
import { defineModels } from './models.js'
import { loadConfigStrict } from './config.js'
import { SUBSCRIPTION_TEMPLATES } from '../../src/data/subscriptionServices.js'
import { SUBSCRIPTION_PRICES } from '../../src/data/subscriptionPrices.js'

const db = getSequelize(loadConfigStrict())
const { Product, Variant } = defineModels(db)
let created = 0
try {
  for (const service of SUBSCRIPTION_TEMPLATES) {
    await access(fileURLToPath(new URL(`../../public${service.artworkPath}`, import.meta.url)))
    const existing = await Product.findOne({ where: { brand: service.brand, category: 'subscriptions' } })
    if (existing) continue
    const reference = SUBSCRIPTION_PRICES[service.id]
    await db.transaction(async transaction => {
      const id = `p-${service.id}`
      await Product.create({ id, slug: service.id, title: service.title, brand: service.brand, category: 'subscriptions',
        fulfilment: 'manual', publication: 'draft', availability: 'available', productType: 'prepaid_voucher',
        artKey: service.art, artworkPath: service.artworkPath, artworkFit: 'contain',
        region: '', eligibility: '', tagline: 'Email delivery within 1 hour after confirmed payment',
        description: 'One-time payment for the membership term shown. Your subscription details and activation instructions will be emailed within 1 hour after confirmed payment. Check supported regions and account requirements before ordering.',
        adminNote: JSON.stringify({ priceReference: reference }),
      }, { transaction })
      await Variant.create({ id: `${service.id}-standard`, productId: id, label: reference.label, priceCents: reference.priceCents,
        stock: 999, active: true, trackInventory: false, billingType: 'one_time' }, { transaction })
    })
    created++
  }
  console.log(`Prepared ${created} subscription drafts. Review prices, regions and account requirements in Staff, then publish.`)
} finally { await db.close() }

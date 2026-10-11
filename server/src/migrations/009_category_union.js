import {} from 'sequelize'

// 009 — catalogue category union: migration 004 narrowed the products
// category enum and dropped the storefront's own values ('games',
// 'subscriptions'), so the fixture seed (which mirrors the frontend source
// of truth in src/data/products.js) fails on fresh databases with
// "Data truncated for column 'category'". Widen to the UNION of both sets.
// Non-destructive: every previously valid value stays valid.
export const name = '009_category_union'

const CATEGORIES = [
  'streaming', 'music', 'gaming-membership', 'gift-cards', 'game-keys',
  'mobile-topup', 'software', 'games', 'subscriptions',
]

export async function up(qi) {
  await qi.sequelize.query(`ALTER TABLE \`products\`
    MODIFY COLUMN \`category\` ENUM(${CATEGORIES.map((c) => `'${c}'`).join(',')}) NOT NULL`)
}

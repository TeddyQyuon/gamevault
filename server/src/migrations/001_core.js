import { DataTypes } from 'sequelize'

// 001 — identity + fixture catalogue. No destructive operations.
export const name = '001_core'

export async function up(qi) {
  await qi.createTable('users', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(190), allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    country: { type: DataTypes.STRING(80), allowNull: false, defaultValue: 'Singapore' },
    stripeCustomerId: { type: DataTypes.STRING(64), allowNull: true, unique: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await qi.createTable('sessions', {
    tokenHash: { type: DataTypes.CHAR(64), primaryKey: true },
    userId: {
      type: DataTypes.UUID, allowNull: false,
      references: { model: 'users', key: 'id' }, onDelete: 'CASCADE',
    },
    expiresAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  })

  await qi.createTable('products', {
    id: { type: DataTypes.STRING(48), primaryKey: true },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    category: { type: DataTypes.ENUM('games', 'gift-cards', 'streaming', 'subscriptions'), allowNull: false },
    tagline: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    description: { type: DataTypes.TEXT, allowNull: false },
    artKey: { type: DataTypes.STRING(64), allowNull: false, defaultValue: 'default' },
    featured: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    trending: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    deal: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    rating: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    ratingsCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })

  await qi.createTable('variants', {
    id: { type: DataTypes.STRING(64), primaryKey: true },
    productId: {
      type: DataTypes.STRING(48), allowNull: false,
      references: { model: 'products', key: 'id' }, onDelete: 'CASCADE',
    },
    label: { type: DataTypes.STRING(120), allowNull: false },
    priceCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    compareAtCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 999 },
    billingType: { type: DataTypes.ENUM('one_time', 'recurring'), allowNull: false, defaultValue: 'one_time' },
    billingInterval: { type: DataTypes.ENUM('month', 'year'), allowNull: true },
    stripePriceId: { type: DataTypes.STRING(64), allowNull: true },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('variants', ['productId'])

  await qi.createTable('promo_codes', {
    code: { type: DataTypes.STRING(32), primaryKey: true },
    description: { type: DataTypes.STRING(200), allowNull: false, defaultValue: '' },
    discountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    minSubtotalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    stripeCouponId: { type: DataTypes.STRING(64), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
}

import { DataTypes } from 'sequelize'

// 002 — orders, immutable snapshots, checkout attempts (idempotency).
export const name = '002_orders'

export async function up(qi) {
  await qi.createTable('orders', {
    id: { type: DataTypes.STRING(16), primaryKey: true },
    userId: {
      type: DataTypes.UUID, allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    mode: { type: DataTypes.ENUM('payment', 'subscription'), allowNull: false },
    payStatus: {
      type: DataTypes.ENUM('pending', 'failed', 'expired', 'canceled', 'paid'),
      allowNull: false, defaultValue: 'pending',
    },
    fulfilStatus: {
      type: DataTypes.ENUM('pending', 'fulfilled', 'unfulfilled'),
      allowNull: false, defaultValue: 'pending',
    },
    subtotalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    discountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    totalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'SGD' },
    promoCode: { type: DataTypes.STRING(32), allowNull: true },
    contactName: { type: DataTypes.STRING(160), allowNull: false, defaultValue: '' },
    contactEmail: { type: DataTypes.STRING(190), allowNull: false, defaultValue: '' },
    contactCountry: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
    stripeSessionId: { type: DataTypes.STRING(128), allowNull: true, unique: true },
    stripePaymentIntentId: { type: DataTypes.STRING(64), allowNull: true },
    stripeCustomerId: { type: DataTypes.STRING(64), allowNull: true },
    stripeSubscriptionId: { type: DataTypes.STRING(64), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('orders', ['userId'])

  await qi.createTable('order_items', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderId: {
      type: DataTypes.STRING(16), allowNull: false,
      references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
    },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    productTitle: { type: DataTypes.STRING(160), allowNull: false },
    variantLabel: { type: DataTypes.STRING(120), allowNull: false },
    unitCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    qty: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    lineTotalCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('order_items', ['orderId'])

  await qi.createTable('checkout_attempts', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: {
      type: DataTypes.UUID, allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    orderId: {
      type: DataTypes.STRING(16), allowNull: false, unique: true,
      references: { model: 'orders', key: 'id' },
    },
    fingerprint: { type: DataTypes.CHAR(64), allowNull: false },
    stripeSessionId: { type: DataTypes.STRING(128), allowNull: true },
    version: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 1 },
    status: {
      type: DataTypes.ENUM('open', 'superseded', 'completed', 'expired'),
      allowNull: false, defaultValue: 'open',
    },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('checkout_attempts', { unique: true, fields: ['userId', 'fingerprint'] })
}

import { DataTypes } from 'sequelize'

// 003 — subscriptions, webhook ledger, code allocations.
export const name = '003_billing'

export async function up(qi) {
  await qi.createTable('subscriptions', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    userId: {
      type: DataTypes.UUID, allowNull: false,
      references: { model: 'users', key: 'id' },
    },
    planName: { type: DataTypes.STRING(160), allowNull: false },
    variantId: { type: DataTypes.STRING(64), allowNull: false },
    stripeSubscriptionId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    stripeCustomerId: { type: DataTypes.STRING(64), allowNull: false },
    stripePriceId: { type: DataTypes.STRING(64), allowNull: true },
    interval: { type: DataTypes.ENUM('month', 'year'), allowNull: false },
    status: {
      type: DataTypes.ENUM('active', 'trialing', 'past_due', 'incomplete', 'incomplete_expired', 'unpaid', 'canceled'),
      allowNull: false, defaultValue: 'incomplete',
    },
    currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
    currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
    cancelAtPeriodEnd: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    lastInvoiceId: { type: DataTypes.STRING(64), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('subscriptions', ['userId'])

  await qi.createTable('stripe_events', {
    eventId: { type: DataTypes.STRING(128), primaryKey: true },
    type: { type: DataTypes.STRING(80), allowNull: false },
    status: {
      type: DataTypes.ENUM('received', 'processed', 'failed'),
      allowNull: false, defaultValue: 'received',
    },
    attempts: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    lastError: { type: DataTypes.STRING(500), allowNull: true },
    receivedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    processedAt: { type: DataTypes.DATE, allowNull: true },
  })

  await qi.createTable('code_allocations', {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    orderItemId: {
      type: DataTypes.INTEGER.UNSIGNED, allowNull: false,
      references: { model: 'order_items', key: 'id' }, onDelete: 'CASCADE',
    },
    code: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('code_allocations', ['orderItemId'])
}

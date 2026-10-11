import { DataTypes } from 'sequelize'

// 007 — Connect hold-and-release (separate charges + transfers).
// Platform collects first, transfers to sellers only on manual release
// after fulfilment. NEVER use application_fee_amount on this path.

export const name = '007_connect_hold'

export async function up(qi) {
  await qi.sequelize.query(`ALTER TABLE \`orders\`
    ADD COLUMN \`connectPattern\` VARCHAR(16) NULL AFTER \`stripeSubscriptionId\`,
    ADD COLUMN \`connectTransferStatus\` VARCHAR(24) NULL AFTER \`connectPattern\`,
    ADD COLUMN \`platformFeeCents\` INT UNSIGNED NULL AFTER \`connectTransferStatus\``)

  await qi.createTable('order_transfers', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    orderId: {
      type: DataTypes.STRING(16), allowNull: false,
      references: { model: 'orders', key: 'id' }, onDelete: 'CASCADE',
    },
    stripeAccountId: { type: DataTypes.STRING(64), allowNull: false },
    amountCents: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
    currency: { type: DataTypes.CHAR(3), allowNull: false, defaultValue: 'SGD' },
    status: {
      type: DataTypes.ENUM('pending', 'released', 'reversed', 'failed'),
      allowNull: false, defaultValue: 'pending',
    },
    stripeTransferId: { type: DataTypes.STRING(64), allowNull: true },
    lastError: { type: DataTypes.STRING(500), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('order_transfers', ['orderId'])
  await qi.addIndex('order_transfers', ['stripeAccountId'])
}

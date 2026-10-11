import { DataTypes } from 'sequelize'

export const name = '011_support_requests'

export async function up(qi) {
  const tables = await qi.showAllTables()
  if (tables.includes('support_requests')) return
  await qi.createTable('support_requests', {
    id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
    name: { type: DataTypes.STRING(100), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    orderReference: { type: DataTypes.STRING(32), allowNull: false, defaultValue: '' },
    topic: { type: DataTypes.STRING(32), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    status: { type: DataTypes.ENUM('open', 'resolved'), allowNull: false, defaultValue: 'open' },
    resolvedAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('support_requests', ['status', 'createdAt'])
}

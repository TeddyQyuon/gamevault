import { DataTypes } from 'sequelize'

export const name = '010_manual_delivery'

export async function up(qi) {
  const additions = {
    orders: { paidAt: { type: DataTypes.DATE, allowNull: true } },
    order_items: {
      fulfilment: { type: DataTypes.STRING(32), allowNull: true },
      region: { type: DataTypes.STRING(80), allowNull: false, defaultValue: '' },
      deliveryWindowMinutes: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
    },
  }
  for (const [table, fields] of Object.entries(additions)) {
    const existing = await qi.describeTable(table)
    for (const [column, definition] of Object.entries(fields)) {
      if (!existing[column]) await qi.addColumn(table, column, definition)
    }
  }
  await qi.sequelize.query(`UPDATE order_items i JOIN variants v ON v.id = i.variantId
    JOIN products p ON p.id = v.productId
    SET i.fulfilment = p.fulfilment, i.region = p.region,
      i.deliveryWindowMinutes = CASE WHEN p.fulfilment = 'manual' THEN 60 ELSE NULL END
    WHERE i.fulfilment IS NULL`)
  await qi.sequelize.query("UPDATE orders SET paidAt = updatedAt WHERE payStatus = 'paid' AND paidAt IS NULL")
}

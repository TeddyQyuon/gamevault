import { DataTypes } from 'sequelize'

export const name = '012_key_reveal_audit'

export async function up(qi) {
  const table = 'code_allocations'
  const tables = await qi.showAllTables()
  if (!tables.includes(table)) return

  const existing = await qi.describeTable(table)
  const additions = {
    isRevealed: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    revealedAt: { type: DataTypes.DATE, allowNull: true },
    revealIp: { type: DataTypes.STRING(45), allowNull: true },
    revealUserAgent: { type: DataTypes.STRING(255), allowNull: true },
  }
  for (const [column, definition] of Object.entries(additions)) {
    if (!existing[column]) {
      await qi.addColumn(table, column, definition)
    }
  }
}

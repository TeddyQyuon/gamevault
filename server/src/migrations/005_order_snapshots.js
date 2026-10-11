import { DataTypes } from 'sequelize'

// 005 — order-item snapshots for imagery/history + direct top-up player refs.
// Snapshots keep historical orders stable when catalogue art changes.

export const name = '005_order_snapshots'

export async function up(qi) {
  await qi.sequelize.query(`ALTER TABLE \`order_items\`
    ADD COLUMN \`imagePath\` VARCHAR(255) NULL AFTER \`lineTotalCents\`,
    ADD COLUMN \`productType\` VARCHAR(32) NOT NULL DEFAULT 'gift_card' AFTER \`imagePath\`,
    ADD COLUMN \`playerRef\` VARCHAR(120) NULL AFTER \`productType\``)
  await qi.sequelize.query(`ALTER TABLE \`code_allocations\`
    ADD COLUMN \`inventoryCodeId\` INT UNSIGNED NULL AFTER \`code\``)
  await qi.addIndex('code_allocations', ['inventoryCodeId'])
}

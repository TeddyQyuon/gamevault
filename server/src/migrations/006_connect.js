import { DataTypes } from 'sequelize'

// 006 — Connect platform sellers (Accounts v2).
// One row per connected account. Capability readiness is checked live via
// stripe.v2.core.accounts.retrieve — this table caches routing + status only.

export const name = '006_connect'

export async function up(qi) {
  await qi.createTable('connected_accounts', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    sellerUserId: { type: DataTypes.UUID, allowNull: true },
    stripeAccountId: { type: DataTypes.STRING(64), allowNull: false, unique: true },
    dashboard: { type: DataTypes.ENUM('express', 'full', 'none'), allowNull: false, defaultValue: 'express' },
    feesCollector: { type: DataTypes.ENUM('stripe', 'application'), allowNull: false, defaultValue: 'application' },
    lossesCollector: { type: DataTypes.ENUM('stripe', 'application'), allowNull: false, defaultValue: 'application' },
    chargePattern: { type: DataTypes.ENUM('destination', 'direct', 'separate'), allowNull: false, defaultValue: 'destination' },
    status: { type: DataTypes.ENUM('onboarding', 'active', 'restricted', 'closed'), allowNull: false, defaultValue: 'onboarding' },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  })
  await qi.addIndex('connected_accounts', ['sellerUserId'])
}

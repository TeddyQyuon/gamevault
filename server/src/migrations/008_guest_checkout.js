import { DataTypes } from 'sequelize'

// 008 — guest checkout: orders, attempts and subscriptions can belong to a
// logged-out shopper (userId NULL). Guest rows are claimed via the Stripe
// session id on the success page; logged-in ownership checks are unchanged.
export const name = '008_guest_checkout'

export async function up(qi) {
  await qi.changeColumn('orders', 'userId', {
    type: DataTypes.UUID, allowNull: true,
  })
  await qi.changeColumn('checkout_attempts', 'userId', {
    type: DataTypes.UUID, allowNull: true,
  })
  await qi.changeColumn('subscriptions', 'userId', {
    type: DataTypes.UUID, allowNull: true,
  })
}

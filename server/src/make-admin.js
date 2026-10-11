// Promote a user to staff admin: `node src/make-admin.js user@example.com`
// Run from server/ so server/.env loads. Public registration can never set
// role — this script is the only way to create the first admin.

import 'dotenv/config'
import { loadConfigStrict } from './config.js'
import { getSequelize } from './db.js'
import { defineModels } from './models.js'

const email = (process.argv[2] || '').trim().toLowerCase()
if (!email) {
  console.error('Usage: node src/make-admin.js user@example.com')
  process.exit(1)
}

const cfg = loadConfigStrict()
const models = defineModels(getSequelize(cfg))
const user = await models.User.findOne({ where: { email } })
if (!user) {
  console.error(`No account found for ${email}. Register it first, then promote.`)
  process.exit(1)
}
await user.update({ role: 'admin' })
console.log(`Promoted ${email} to admin. Staff UI: /admin (after login).`)
await getSequelize(cfg).close()

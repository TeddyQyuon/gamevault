// Minimal migration runner: applies pending files in order and records them.
// No destructive sync anywhere — schema only changes through these files.

import mysql from 'mysql2/promise'
import { Sequelize } from 'sequelize'
import { loadConfigStrict } from './config.js'
import * as m001 from './migrations/001_core.js'
import * as m002 from './migrations/002_orders.js'
import * as m003 from './migrations/003_billing.js'
import * as m004 from './migrations/004_catalogue.js'
import * as m005 from './migrations/005_order_snapshots.js'
import * as m006 from './migrations/006_connect.js'
import * as m007 from './migrations/007_connect_hold.js'
import * as m008 from './migrations/008_guest_checkout.js'
import * as m009 from './migrations/009_category_union.js'
import * as m010 from './migrations/010_manual_delivery.js'
import * as m011 from './migrations/011_support_requests.js'
import * as m012 from './migrations/012_key_reveal_audit.js'

const MIGRATIONS = [m001, m002, m003, m004, m005, m006, m007, m008, m009, m010, m011, m012]

async function main() {
  const cfg = loadConfigStrict()

  // Create the database if it is missing (needs CREATE privilege; the
  // documented setup grants it, otherwise create it manually first).
  const admin = await mysql.createConnection({
    host: cfg.db.host, port: cfg.db.port, user: cfg.db.user, password: cfg.db.password,
  })
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.db.name}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await admin.end()

  const sequelize = new Sequelize(cfg.db.name, cfg.db.user, cfg.db.password, {
    host: cfg.db.host, port: cfg.db.port, dialect: 'mysql', logging: false,
  })
  const qi = sequelize.getQueryInterface()

  await qi.sequelize.query(
    'CREATE TABLE IF NOT EXISTS `schema_migrations` (`name` VARCHAR(64) PRIMARY KEY, `appliedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)',
  )
  const [rows] = await qi.sequelize.query('SELECT `name` FROM `schema_migrations`')
  const applied = new Set(rows.map((r) => r.name))

  for (const m of MIGRATIONS) {
    if (applied.has(m.name)) {
      console.log(`- ${m.name} (already applied)`)
      continue
    }
    console.log(`+ applying ${m.name}...`)
    await m.up(qi)
    await qi.sequelize.query('INSERT INTO `schema_migrations` (`name`) VALUES (?)', {
      replacements: [m.name],
    })
    console.log(`  ${m.name} done`)
  }
  await sequelize.close()
  console.log('Migrations complete.')
}

main().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})

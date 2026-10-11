import fs from 'node:fs/promises'
import crypto from 'node:crypto'
import mysql from '../server/node_modules/mysql2/index.js'
import mysqlPromise from '../server/node_modules/mysql2/promise.js'
import dotenv from '../server/node_modules/dotenv/lib/main.js'

const envFile = new URL('../server/.env', import.meta.url)
const localDir = new URL('../server/.local/', import.meta.url)
const pendingFile = new URL('mysql80-reset-pending.json', localDir)
const sqlFile = new URL('mysql80-reset.sql', localDir)
const newline = String.fromCharCode(10)
const mode = process.argv[2]
let envText = await fs.readFile(envFile, 'utf8')
const cfg = dotenv.parse(envText)
const database = cfg.DATABASE_NAME || 'gamevault'
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Invalid database name.')

function sqlFor(plan) {
  const name = mysql.escapeId(plan.database)
  return [
    '-- Authorized reset: deletes this database and ALL its stored data.',
    '-- Execute on localhost:3306 while signed in as a MySQL administrator.',
    '-- Contains private app credentials. Do not share this file.',
    'DROP DATABASE IF EXISTS ' + name + ';',
    'CREATE DATABASE ' + name + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
    mysql.format('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?;', [plan.user, 'localhost', plan.password]),
    'GRANT ALL PRIVILEGES ON ' + name + '.* TO ' + mysql.escape(plan.user) + '@' + mysql.escape('localhost') + ';',
  ]
}

if (mode === '--prepare') {
  const plan = {
    database, user: 'gamevault_app_' + crypto.randomBytes(4).toString('hex'),
    password: crypto.randomBytes(32).toString('hex'),
  }
  await fs.mkdir(localDir, { recursive: true })
  await fs.writeFile(pendingFile, JSON.stringify(plan), { mode: 0o600 })
  await fs.writeFile(sqlFile, sqlFor(plan).join(newline) + newline, { mode: 0o600 })
  console.log('Prepared server/.local/mysql80-reset.sql with fresh app credentials. The database has NOT been deleted yet.')
  process.exit(0)
}
if (!['--execute', '--activate'].includes(mode)) throw new Error('Use --prepare, --execute, or --activate.')
const plan = JSON.parse(await fs.readFile(pendingFile, 'utf8'))
if (plan.database !== database) throw new Error('The prepared database target does not match the current configuration.')
let admin
let app
try {
  if (mode === '--execute') {
    const adminUser = cfg.MYSQL_ADMIN_USER || process.env.MYSQL_ADMIN_USER
    const adminPassword = cfg.MYSQL_ADMIN_PASSWORD || process.env.MYSQL_ADMIN_PASSWORD
    if (!adminUser || !adminPassword) {
      console.log('Reset blocked: no MySQL administrator credentials are configured. Run server/.local/mysql80-reset.sql in your root Workbench connection, then use --activate.')
      process.exit(1)
    }
    admin = await mysqlPromise.createConnection({ host: '127.0.0.1', port: 3306, user: adminUser, password: adminPassword, connectTimeout: 5000 })
    for (const statement of sqlFor(plan).filter(line => !line.startsWith('--'))) await admin.query(statement)
    console.log('Authorized database reset executed.')
  }
  app = await mysqlPromise.createConnection({ host: '127.0.0.1', port: 3306, user: plan.user, password: plan.password, database: plan.database, connectTimeout: 5000 })
  const values = {
    DATABASE_HOST: '127.0.0.1', DATABASE_PORT: '3306', DATABASE_NAME: plan.database,
    DATABASE_USER: plan.user, DATABASE_PASSWORD: plan.password,
  }
  for (const [key, value] of Object.entries(values)) {
    const pattern = new RegExp('^' + key + '=.*$', 'm')
    const line = key + '=' + value
    envText = pattern.test(envText) ? envText.replace(pattern, () => line) : envText.trimEnd() + newline + line + newline
  }
  envText = envText.split(newline).filter(line => !/^MYSQL_ADMIN_(USER|PASSWORD)=/.test(line.trim())).join(newline)
  await fs.writeFile(envFile, envText)
  for (const file of [pendingFile, sqlFile, new URL('mysql80-setup.sql', localDir)]) await fs.rm(file, { force: true })
  console.log('Fresh app login connected and saved. Temporary credential files were removed. The API can now run migrations.')
} catch (error) {
  console.error('Reset/activation did not complete (' + (error.code || 'configuration error') + '). Configuration was not switched to an unverified login.')
  process.exitCode = 1
} finally {
  if (app) await app.end()
  if (admin) await admin.end()
}

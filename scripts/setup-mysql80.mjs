import fs from 'node:fs/promises'
import mysql from '../server/node_modules/mysql2/promise.js'
import dotenv from '../server/node_modules/dotenv/lib/main.js'

const envPath = new URL('../server/.env', import.meta.url)
let content = await fs.readFile(envPath, 'utf8')
const cfg = dotenv.parse(content)
function setValue(name, value) {
  const pattern = new RegExp(`^${name}=.*$`, 'm')
  const line = `${name}=${value}`
  content = pattern.test(content) ? content.replace(pattern, () => line) : `${content.trimEnd()}\n${line}\n`
}
setValue('DATABASE_PORT', '3306')
await fs.writeFile(envPath, content)
if (process.argv.includes('--configure-port')) {
  console.log('GameVault is configured for MySQL80 on port 3306. Credentials were preserved.')
  process.exit(0)
}
const database = cfg.DATABASE_NAME || 'gamevault'
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Use a database name containing letters, numbers and underscores.')
const password = cfg.DATABASE_PASSWORD || ''
if (!password) throw new Error('Set DATABASE_PASSWORD locally before provisioning the app user.')
if (process.argv.includes('--use-workbench-account')) {
  let connection
  try {
    connection = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: 'gamevault_app', password, database, connectTimeout: 5000 })
    setValue('DATABASE_HOST', '127.0.0.1')
    setValue('DATABASE_USER', 'gamevault_app')
    await fs.writeFile(envPath, content)
    await fs.rm(new URL('../server/.local/mysql80-setup.sql', import.meta.url), { force: true })
    console.log('Dedicated MySQL80 app account connected. Configuration saved and the temporary SQL file removed.')
  } catch (error) {
    console.error('Dedicated app account is not ready (' + (error.code || 'configuration error') + ').')
    process.exitCode = 1
  } finally {
    if (connection) await connection.end()
  }
  process.exit(process.exitCode || 0)
}
const adminUser = cfg.MYSQL_ADMIN_USER || process.env.MYSQL_ADMIN_USER
const adminPassword = cfg.MYSQL_ADMIN_PASSWORD || process.env.MYSQL_ADMIN_PASSWORD
if (!adminUser || !adminPassword) throw new Error('Set MYSQL_ADMIN_USER and MYSQL_ADMIN_PASSWORD locally in server/.env, then run this script again.')

let admin
let app
try {
  admin = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user: adminUser, password: adminPassword, connectTimeout: 5000 })
  // Dedicated app account: do not alter another project's existing gv login.
  const user = 'gamevault_app'
  const [existing] = await admin.query('SELECT User FROM mysql.user WHERE User = ? AND Host = ?', [user, 'localhost'])
  if (existing.length) {
    // Check credentials before granting permissions; never reset existing passwords.
    app = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user, password, connectTimeout: 5000 })
  }
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  if (!existing.length) await admin.query('CREATE USER ?@? IDENTIFIED BY ?', [user, 'localhost', password])
  await admin.query(`GRANT ALL PRIVILEGES ON \`${database}\`.* TO ?@?`, [user, 'localhost'])
  if (!app) app = await mysql.createConnection({ host: '127.0.0.1', port: 3306, user, password, database, connectTimeout: 5000 })
  setValue('DATABASE_HOST', '127.0.0.1')
  setValue('DATABASE_USER', user)
  content = content.replace(/^MYSQL_ADMIN_(USER|PASSWORD)=.*(?:\r?\n|$)/gm, '')
  await fs.writeFile(envPath, content)
  console.log('MySQL80 database and dedicated GameVault app account are ready. Temporary administrator settings were removed.')
} catch (error) {
  console.error(`MySQL80 setup did not complete (${error.code || 'configuration error'}). No existing account passwords were changed.`)
  process.exitCode = 1
} finally {
  if (app) await app.end()
  if (admin) await admin.end()
}

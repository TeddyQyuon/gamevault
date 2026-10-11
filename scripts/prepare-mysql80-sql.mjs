import fs from 'node:fs/promises'
import mysql from '../server/node_modules/mysql2/index.js'
import dotenv from '../server/node_modules/dotenv/lib/main.js'

const envPath = new URL('../server/.env', import.meta.url)
const config = dotenv.parse(await fs.readFile(envPath, 'utf8'))
const database = config.DATABASE_NAME || 'gamevault'
if (!/^[a-zA-Z0-9_]+$/.test(database)) throw new Error('Invalid database name.')
if (!config.DATABASE_PASSWORD) throw new Error('Set the app password locally first.')
const user = 'gamevault_app'
const statements = [
  '-- Run in MySQL Workbench on localhost:3306 while signed in as root.',
  '-- Contains the local app password. Keep this file private.',
  '-- Existing user passwords and existing database contents are preserved.',
  'CREATE DATABASE IF NOT EXISTS ' + mysql.escapeId(database) + ' CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;',
  mysql.format('CREATE USER IF NOT EXISTS ?@? IDENTIFIED BY ?;', [user, 'localhost', config.DATABASE_PASSWORD]),
  'GRANT ALL PRIVILEGES ON ' + mysql.escapeId(database) + '.* TO ' + mysql.escape(user) + '@' + mysql.escape('localhost') + ';',
  'SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ' + mysql.escape(database) + ';',
]
const directory = new URL('../server/.local/', import.meta.url)
await fs.mkdir(directory, { recursive: true })
await fs.writeFile(new URL('mysql80-setup.sql', directory), statements.join(String.fromCharCode(10)) + String.fromCharCode(10), { mode: 0o600 })
console.log('Prepared server/.local/mysql80-setup.sql for MySQL Workbench. No password was printed.')

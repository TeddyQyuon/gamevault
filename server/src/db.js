import { Sequelize } from 'sequelize'

let instance = null

// Single shared Sequelize instance (lazy so tests can import models without a DB).
export function getSequelize(cfg) {
  if (instance) return instance
  instance = new Sequelize(cfg.db.name, cfg.db.user, cfg.db.password, {
    host: cfg.db.host,
    port: cfg.db.port,
    dialect: 'mysql',
    logging: false,
    timezone: '+00:00',
    define: { charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  })
  return instance
}

// Used by tests to inject a fresh instance.
export function resetSequelize() {
  instance = null
}

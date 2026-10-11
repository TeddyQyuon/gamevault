import { randomUUID } from 'node:crypto'
import { Op } from 'sequelize'
import { badRequest } from '../errors.js'
import { encryptCode, hashCode, maskCode } from './codeCrypto.js'

// Reservation window: stock is held from session creation until payment or
// expiry. Lazy expiry (no cron): expired holds are released whenever we
// create sessions or process webhooks.
export const RESERVE_MINUTES = 45

// Parse + validate a CSV upload. Expected: one code per line, optional header
// ("code"), UTF-8. Returns { rows, errors } — never throws on bad content.
export function parseCodeCsv(text, { minLen = 4, maxLen = 128 } = {}) {
  const lines = String(text || '').split(/\r?\n/)
  const rows = []
  const errors = []
  const seen = new Set()
  lines.forEach((raw, i) => {
    const lineNo = i + 1
    const code = raw.trim().replace(/^"|"$/g, '').trim()
    if (!code) return
    if (/^code$/i.test(code) && i === 0) return // header row
    if (code.length < minLen || code.length > maxLen || /[\s,]/.test(code)) {
      errors.push({ line: lineNo, code: code.slice(0, 24), error: 'Invalid format (4–128 chars, no spaces/commas).' })
      return
    }
    const key = code.toUpperCase()
    if (seen.has(key)) {
      errors.push({ line: lineNo, code: maskCode(code), error: 'Duplicate within file.' })
      return
    }
    seen.add(key)
    rows.push(code)
  })
  return { rows, errors }
}

// Preview an import: counts + per-row problems, duplicates vs the database.
// Nothing is written. The confirm step re-validates (stateless, safe to retry).
export async function previewImport(models, variantId, codes) {
  const hashes = codes.map(hashCode)
  const existing = await models.InventoryCode.findAll({
    attributes: ['codeHash'],
    where: { codeHash: hashes },
  })
  const dupes = new Set(existing.map((r) => r.codeHash))
  const valid = []
  const duplicates = []
  codes.forEach((code) => {
    if (dupes.has(hashCode(code))) duplicates.push(maskCode(code))
    else valid.push(code)
  })
  return { total: codes.length, valid: valid.length, duplicates, duplicateCount: duplicates.length }
}

// Atomic confirm: skips DB duplicates, records the batch. Caller re-sends the
// file (preview wrote nothing), so interrupted imports can simply be retried.
export async function confirmImport(models, sequelize, { variantId, codes, filename, adminId }) {
  return sequelize.transaction(async (t) => {
    const batchId = randomUUID()
    const { duplicates } = await previewImport(models, variantId, codes)
    const dupeSet = new Set(duplicates)
    const fresh = codes.filter((c) => !dupeSet.has(maskCode(c)))
    // Re-check inside the tx to close the race (UNIQUE(codeHash) backstops).
    const rows = fresh.map((code) => ({
      variantId, codeCipher: encryptCode(code), codeHash: hashCode(code),
      codeMasked: maskCode(code), status: 'available', batchId,
    }))
    if (rows.length) await models.InventoryCode.bulkCreate(rows, { transaction: t, ignoreDuplicates: true })
    const inserted = await models.InventoryCode.count({ where: { batchId }, transaction: t })
    await models.CodeImport.create({
      variantId, filename, totalRows: codes.length, importedRows: inserted,
      duplicateRows: codes.length - inserted, errorRows: 0, errors: null, createdBy: adminId,
    }, { transaction: t })
    return { batchId, imported: inserted, duplicates: codes.length - inserted }
  })
}

export async function inventoryCounts(models, variantId) {
  const all = await models.InventoryCode.findAll({ where: { variantId } })
  const out = { available: 0, reserved: 0, delivered: 0, invalidated: 0 }
  for (const r of all) {
    if (out[r.status] !== undefined) out[r.status] += 1
  }
  return out
}

// Release expired holds (called lazily on session create + webhook handling).
export async function releaseExpired(models, now = new Date()) {
  const [n] = await models.InventoryCode.update(
    { status: 'available', reservedByAttemptId: null, reservedUntil: null },
    { where: { status: 'reserved', reservedUntil: { [Op.lt]: now } } },
  )
  return n
}

// Reserve qty codes for an attempt (inside the order-creation transaction).
export async function reserveForAttempt(models, variantId, qty, attemptId, t) {
  await releaseExpired(models)
  const rows = await models.InventoryCode.findAll({
    where: { variantId, status: 'available' }, limit: qty,
    order: [['id', 'ASC']], transaction: t, lock: t.LOCK.UPDATE,
  })
  if (rows.length < qty) {
    throw badRequest('OUT_OF_STOCK', 'Not enough stock for this variant right now.')
  }
  const until = new Date(Date.now() + RESERVE_MINUTES * 60 * 1000)
  for (const r of rows) {
    await r.update({ status: 'reserved', reservedByAttemptId: attemptId, reservedUntil: until }, { transaction: t })
  }
  return rows.map((r) => r.id)
}

// Release one attempt's holds (cancel, expiry, supersede).
export async function releaseAttempt(models, attemptId, t) {
  const tx = t ? { transaction: t } : {}
  await models.InventoryCode.update(
    { status: 'available', reservedByAttemptId: null, reservedUntil: null },
    { where: { reservedByAttemptId: attemptId, status: 'reserved' }, ...tx },
  )
}

import crypto from 'node:crypto'

// AES-256-GCM code encryption at rest. Key = 64-hex-char CODES_ENCRYPTION_KEY
// in server/.env (generated once, backed up securely, never committed).
// Plaintext codes are NEVER logged, NEVER stored, and only decrypted for the
// paying order owner at delivery time.

function key() {
  const hex = process.env.CODES_ENCRYPTION_KEY || ''
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error('CODES_ENCRYPTION_KEY must be 64 hex chars. Generate: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"')
  }
  return Buffer.from(hex, 'hex')
}

export function hashCode(plain) {
  return crypto.createHash('sha256').update(String(plain)).digest('hex')
}

export function maskCode(plain) {
  const s = String(plain)
  if (s.length <= 6) return `${s.slice(0, 2)}•••`
  return `${s.slice(0, 4)}•••${s.slice(-2)}`
}

export function encryptCode(plain) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

export function decryptCode(cipherB64) {
  const buf = Buffer.from(String(cipherB64), 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const enc = buf.subarray(28)
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
}

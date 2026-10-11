import crypto from 'node:crypto'
import { unauthorized } from '../errors.js'

export const COOKIE_NAME = 'gv_session'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function cookieOptions(cfg) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: cfg.cookieSecure, // true behind HTTPS in production
    path: '/',
    maxAge: SESSION_TTL_MS,
  }
}

// Creates a DB session + sets the HttpOnly cookie. The raw token never
// touches the database — only its hash — and never localStorage.
export async function createSession(models, res, cfg, userId) {
  const token = crypto.randomBytes(32).toString('hex')
  await models.Session.create({
    tokenHash: hashToken(token),
    userId,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  })
  res.cookie(COOKIE_NAME, token, cookieOptions(cfg))
}

export async function destroySession(models, req, res) {
  const token = req.cookies?.[COOKIE_NAME]
  if (token) await models.Session.destroy({ where: { tokenHash: hashToken(token) } })
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

// Ownership root: every protected route gets req.userId from the SERVER-side
// session. A browser-supplied userId / customerId is never trusted.
export function requireAuth(models) {
  return async (req, _res, next) => {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) throw unauthorized()
    const row = await models.Session.findOne({
      where: { tokenHash: hashToken(token) },
      include: [{ model: models.User, attributes: ['id', 'name', 'email', 'country'] }],
    })
    if (!row || row.expiresAt.getTime() < Date.now()) {
      if (row) await row.destroy()
      throw unauthorized('Your session expired. Please log in again.')
    }
    req.sessionRow = row
    req.userId = row.userId
    req.user = row.User
    next()
  }
}

// Guest-checkout root: same session resolution, but guests pass through with
// req.userId = null instead of a 401. Checkout + promo routes use this so
// logged-out shoppers can pay; ownership checks happen per-order.
export function optionalAuth(models) {
  return async (req, _res, next) => {
    const token = req.cookies?.[COOKIE_NAME]
    if (!token) {
      req.sessionRow = null
      req.userId = null
      req.user = null
      return next()
    }
    const row = await models.Session.findOne({
      where: { tokenHash: hashToken(token) },
      include: [{ model: models.User, attributes: ['id', 'name', 'email', 'country'] }],
    })
    if (!row || row.expiresAt.getTime() < Date.now()) {
      if (row) await row.destroy().catch(() => {})
      req.sessionRow = null
      req.userId = null
      req.user = null
      return next()
    }
    req.sessionRow = row
    req.userId = row.userId
    req.user = row.User
    return next()
  }
}

import rateLimit from 'express-rate-limit'
import { forbidden } from '../errors.js'

// Same-origin guard for cookie-authenticated writes: the Origin/Referer must
// match our own CLIENT_URL. (SameSite=Lax already blocks cross-site cookie
// sends; this is defence in depth and easy to reason about.)
export function sameOrigin(cfg) {
  return (req, _res, next) => {
    if (req.method === 'GET' || req.method === 'HEAD') return next()
    const origin = req.get('origin') || req.get('referer') || ''
    if (origin) {
      let matches = false
      try { matches = new URL(origin).origin === new URL(cfg.clientUrl).origin } catch { /* Reject malformed origins. */ }
      if (!matches) throw forbidden('FORBIDDEN_ORIGIN', 'Cross-origin requests are not allowed.')
    } else if (cfg.nodeEnv === 'production') {
      // In production, reject state-changing browser requests that omit origin headers
      throw forbidden('FORBIDDEN_ORIGIN', 'Cross-origin requests without origin are not allowed.')
    }
    next()
  }
}

export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 login/register attempts per minute per IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many attempts. Please wait a minute.' } },
})

export const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many checkout attempts. Please wait a minute.' } },
})

export const supportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Too many messages. Please try again in 15 minutes.' } },
})

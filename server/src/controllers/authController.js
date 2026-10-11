import bcrypt from 'bcryptjs'
import { ah, badRequest, conflict, unauthorized } from '../errors.js'
import { createSession, destroySession } from '../middleware/auth.js'

const EMAIL_RE = /^\S+@\S+\.\S+$/

function publicUser(u) {
  return { id: u.id, name: u.name, email: u.email, country: u.country }
}

export function authController({ models, cfg }) {
  return {
    register: ah(async (req, res) => {
      const name = (req.body?.name || '').trim()
      const email = (req.body?.email || '').trim().toLowerCase()
      const password = req.body?.password || ''
      const country = (req.body?.country || 'Singapore').trim() || 'Singapore'
      if (name.length < 2) throw badRequest('BAD_NAME', 'Please enter your name.')
      if (!EMAIL_RE.test(email)) throw badRequest('BAD_EMAIL', 'Please enter a valid email address.')
      if (password.length < 8) throw badRequest('WEAK_PASSWORD', 'Password must be at least 8 characters.')
      if (await models.User.findOne({ where: { email } })) {
        throw conflict('EMAIL_TAKEN', 'An account with that email already exists. Try logging in.')
      }
      const user = await models.User.create({
        name, email, country, passwordHash: await bcrypt.hash(password, 10),
      })
      await createSession(models, res, cfg, user.id)
      res.status(201).json({ user: publicUser(user) })
    }),

    login: ah(async (req, res) => {
      const email = (req.body?.email || '').trim().toLowerCase()
      const password = req.body?.password || ''
      const user = await models.User.findOne({ where: { email } })
      // Same generic message either way — don't reveal which accounts exist.
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        throw unauthorized('Invalid email or password.')
      }
      await createSession(models, res, cfg, user.id)
      res.json({ user: publicUser(user) })
    }),

    logout: ah(async (req, res) => {
      await destroySession(models, req, res)
      res.json({ ok: true })
    }),

    me: ah(async (req, res) => {
      res.json({ user: publicUser(req.user) })
    }),

    // PATCH /api/me — display profile only (email is the login identity).
    updateMe: ah(async (req, res) => {
      const name = (req.body?.name || '').trim()
      const country = (req.body?.country || '').trim()
      if (name && name.length < 2) throw badRequest('BAD_NAME', 'Please enter your name.')
      const user = await models.User.findByPk(req.userId)
      await user.update({
        ...(name ? { name } : {}),
        ...(country ? { country } : {}),
      })
      res.json({ user: publicUser(user) })
    }),
  }
}

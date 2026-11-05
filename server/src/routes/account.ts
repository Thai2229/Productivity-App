import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import { APIError } from 'better-auth/api'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../lib/auth.js'
import { requireUser } from '../lib/session.js'

export const accountRouter = Router()

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 128
// Same rule as deleting an account: you must have logged in within the last day
const RECENT_LOGIN_MS = 24 * 60 * 60 * 1000

accountRouter.use(requireUser)

// Setting a password is rare, so allow only a few tries per account
const setPasswordLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (_request, response) => response.locals.userId,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many tries. Wait a few minutes and try again.' },
})

// People who signed up with Google have no password. This lets them add one,
// so they can also log in with their email and password.
accountRouter.post('/set-password', setPasswordLimit, async (request, response) => {
  const newPassword = request.body?.newPassword
  if (
    typeof newPassword !== 'string' ||
    newPassword.length < MIN_PASSWORD_LENGTH ||
    newPassword.length > MAX_PASSWORD_LENGTH
  ) {
    response.status(400).json({ error: 'Password must be 8 to 128 characters.' })
    return
  }

  const headers = fromNodeHeaders(request.headers)
  const session = await auth.api.getSession({ headers })
  if (!session || Date.now() - new Date(session.session.createdAt).getTime() > RECENT_LOGIN_MS) {
    response.status(403).json({
      error: 'For your safety, log out and log back in, then set your password.',
      code: 'LOGIN_NOT_RECENT',
    })
    return
  }

  try {
    await auth.api.setPassword({ body: { newPassword }, headers })
  } catch (error) {
    if (error instanceof APIError && error.body?.code === 'PASSWORD_ALREADY_SET') {
      response.status(400).json({ error: 'This account already has a password.', code: 'PASSWORD_ALREADY_SET' })
      return
    }
    throw error
  }

  response.json({ ok: true })
})

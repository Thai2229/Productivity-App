import type { NextFunction, Request, Response } from 'express'
import { rateLimit } from 'express-rate-limit'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from './auth.js'

// Every protected route runs this first: no session, no data.
// The user id comes from the session cookie, never from the request body,
// so nobody can ask for someone else's data.
export async function requireUser(request: Request, response: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })

  if (!session) {
    response.status(401).json({ error: 'Not logged in' })
    return
  }

  response.locals.userId = session.user.id
  next()
}

// At most 120 requests a minute per account: plenty for clicking around,
// but stops a script from flooding the database. Use after requireUser.
export function perUserLimit() {
  return rateLimit({
    windowMs: 60 * 1000,
    limit: 120,
    keyGenerator: (_request, response) => response.locals.userId,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please slow down' },
  })
}

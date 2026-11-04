import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import helmet from 'helmet'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { prisma } from './lib/prisma.js'
import { internshipsRouter } from './routes/internships.js'

// Stop right away with a clear message if a required setting is missing,
// instead of starting up half-configured (for example with CORS open to everyone)
for (const name of ['DATABASE_URL', 'BETTER_AUTH_SECRET', 'BETTER_AUTH_URL']) {
  if (!process.env[name]) {
    throw new Error('Missing environment variable ' + name)
  }
}

const app = express()
const PORT = 3001

// Security headers on every response, and hides the "X-Powered-By: Express" header
app.use(helmet())

// Only the site itself may call this API from a browser, with cookies
app.use(cors({ origin: process.env.BETTER_AUTH_URL, credentials: true }))

// Better Auth must come before express.json(), or its requests hang
app.all('/api/auth/*splat', toNodeHandler(auth))

// Refuse oversized request bodies (a job entry is well under 10 KB)
app.use(express.json({ limit: '10kb' }))

// Says whether the server and database are up, without revealing anything else
app.get('/api/health', async (_request, response) => {
  try {
    await prisma.user.count()
    response.json({ status: 'ok' })
  } catch (error) {
    console.error(error)
    response.status(500).json({ status: 'error' })
  }
})

app.get('/api/me', async (request, response) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })

  if (!session) {
    response.status(401).json({ error: 'Not logged in' })
    return
  }

  response.json({ user: session.user })
})

app.use('/api/internships', internshipsRouter)

// Anything else under /api is a plain 404, not Express's default HTML page
app.use('/api', (_request, response) => {
  response.status(404).json({ error: 'Not found' })
})

// Catches any error a route didn't handle, so the server answers instead of hanging.
// Only a generic message goes back; the details stay in the server log.
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error)
  let status = 500
  let message = 'Something went wrong'
  const httpError = error as { status?: number; type?: string }
  if (httpError.type === 'entity.too.large' || httpError.type === 'entity.parse.failed') {
    status = httpError.status ?? 400
    message = 'Request was not valid'
  }
  response.status(status).json({ error: message })
})

// On Vercel, the exported app is run for each request; locally, we start a server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT)
  })
}

export default app

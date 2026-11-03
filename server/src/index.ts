import 'dotenv/config'
import cors from 'cors'
import express, { type NextFunction, type Request, type Response } from 'express'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { prisma } from './lib/prisma.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: process.env.BETTER_AUTH_URL, credentials: true }))

// Better Auth must come before express.json(), or its requests hang
app.all('/api/auth/*splat', toNodeHandler(auth))

app.use(express.json())

app.get('/api/health', async (_request, response) => {
  try {
    const userCount = await prisma.user.count()
    response.json({ status: 'ok', users: userCount })
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

// Catches any error a route didn't handle, so the server answers instead of hanging
app.use((error: unknown, _request: Request, response: Response, _next: NextFunction) => {
  console.error(error)
  response.status(500).json({ error: 'Something went wrong' })
})

// On Vercel, the exported app is run for each request; locally, we start a server
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('Server running on http://localhost:' + PORT)
  })
}

export default app
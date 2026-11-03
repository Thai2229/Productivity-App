import cors from 'cors'
import express from 'express'
import { fromNodeHeaders, toNodeHandler } from 'better-auth/node'
import { auth } from './lib/auth.js'
import { prisma } from './lib/prisma.js'

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))

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

app.listen(PORT, () => {
  console.log('Server running on http://localhost:' + PORT)
})
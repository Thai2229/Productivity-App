import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from './prisma.js'

// Names are only ever shown as text, but there's no reason to accept huge ones
function checkName(name: unknown) {
  if (typeof name === 'string' && (name.trim() === '' || name.length > 100)) {
    throw new APIError('BAD_REQUEST', { message: 'Name must be 1 to 100 characters' })
  }
}

// BETTER_AUTH_URL is the address people visit: http://localhost:5173 in development,
// your Vercel site in production. Better Auth only accepts requests from that address.
export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  // Limits how fast anyone can hit the login endpoints. Counts are kept in the
  // database so they hold across Vercel's separate server instances.
  // Sign-in and sign-up have a stricter built-in limit of 3 tries per 10 seconds.
  rateLimit: {
    enabled: true,
    storage: 'database',
    window: 60,
    max: 100,
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          checkName(user.name)
          // The app has no profile pictures, so never store a picture link
          return { data: { ...user, image: null } }
        },
      },
      update: {
        before: async (user) => {
          checkName(user.name)
          return { data: { ...user, image: null } }
        },
      },
    },
  },
})

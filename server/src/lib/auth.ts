import { betterAuth } from 'better-auth'
import { APIError } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { captcha } from 'better-auth/plugins'
import { sendPasswordResetEmail } from './mailer.js'
import { prisma } from './prisma.js'

// Cloudflare Turnstile: sign-ups must pass a "real person" check first.
// Only switched on when the secret key is set, so a missing key can't take the site down.
function botCheckPlugins() {
  const secretKey = process.env.TURNSTILE_SECRET_KEY
  if (!secretKey) {
    console.warn('TURNSTILE_SECRET_KEY is not set, so sign-up has no bot check')
    return []
  }
  return [
    captcha({
      provider: 'cloudflare-turnstile',
      secretKey,
      endpoints: ['/sign-up/email'],
    }),
  ]
}

// "Continue with Google": only switched on when both Google keys are set
function googleProvider() {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are not set, so Google sign-in is off')
    return {}
  }
  return {
    google: {
      clientId,
      clientSecret,
      // Always let people pick which Google account to use
      prompt: 'select_account' as const,
    },
  }
}

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
    // "Forgot password?": emails a link that works once and expires after an hour.
    // Resetting signs the account out everywhere, in case someone else was logged in.
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail(user.email, user.name, url)
    },
    resetPasswordTokenExpiresIn: 60 * 60,
    revokeSessionsOnPasswordReset: true,
  },
  socialProviders: googleProvider(),
  // Signing in with Google using the same email as an existing account opens that account.
  // Google has already confirmed the person owns that email.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
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
  plugins: botCheckPlugins(),
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

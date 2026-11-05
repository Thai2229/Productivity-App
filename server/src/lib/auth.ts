import { betterAuth } from 'better-auth'
import { APIError, createAuthMiddleware, getSessionFromCtx } from 'better-auth/api'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { captcha, emailOTP } from 'better-auth/plugins'
import { sendPasswordResetEmail, sendVerificationCodeEmail } from './mailer.js'
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

// 6-digit email codes that prove someone owns their email. Sent after signing up with a
// password, and when someone with an unconfirmed email logs in. Google accounts skip this,
// since Google has already confirmed the email.
function emailCodePlugin() {
  return emailOTP({
    overrideDefaultEmailVerification: true,
    // Codes only confirm emails here; they can't create accounts or log anyone in by themselves
    disableSignUp: true,
    otpLength: 6,
    expiresIn: 10 * 60,
    allowedAttempts: 5,
    sendVerificationOTP: async ({ email, otp, type }) => {
      if (type === 'email-verification') {
        await sendVerificationCodeEmail(email, otp)
      }
    },
  })
}

// Names are only ever shown as text, but there's no reason to accept huge ones
function checkName(name: unknown) {
  if (typeof name === 'string' && (name.trim() === '' || name.length > 100)) {
    throw new APIError('BAD_REQUEST', { message: 'Name must be 1 to 100 characters' })
  }
}

// Extra checks that run before Better Auth handles a request.
// 1. Sign up with an email that already has an account: say so plainly instead of pretending it worked.
//    This runs after Cloudflare's bot check, so bots can't use it to test which emails are signed up.
// 2. Deleting an account that has a password always needs that password, so someone using a
//    logged-in laptop that was left open can't wipe the account.
const extraChecks = createAuthMiddleware(async (ctx) => {
  if (ctx.path === '/delete-user') {
    let password = ''
    if (typeof ctx.body?.password === 'string') {
      password = ctx.body.password
    }
    const session = await getSessionFromCtx(ctx)
    if (session && password === '') {
      const passwordAccount = await prisma.account.findFirst({
        where: { userId: session.user.id, providerId: 'credential' },
        select: { id: true },
      })
      if (passwordAccount) {
        throw new APIError('BAD_REQUEST', { code: 'PASSWORD_REQUIRED', message: 'Enter your password to delete your account.' })
      }
    }
    return
  }

  if (ctx.path !== '/sign-up/email') {
    return
  }
  let email = ''
  if (typeof ctx.body?.email === 'string') {
    email = ctx.body.email.trim().toLowerCase()
  }
  if (email === '') {
    return
  }
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } })
  if (existing) {
    throw new APIError('UNPROCESSABLE_ENTITY', {
      code: 'USER_ALREADY_EXISTS',
      message: 'An account with this email already exists.',
    })
  }
})

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
    // A reset link only reaches the real inbox owner, so finishing one also confirms the email
    onPasswordReset: async ({ user }) => {
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: true } })
    },
    // Password accounts must confirm their email with a code before they can log in
    requireEmailVerification: true,
  },
  // "Delete account" in Settings. Jobs, habits and roadmaps are removed along with the account.
  // People without a password (Google sign-ins) must have logged in within the last day.
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    // Entering the right code logs you straight in
    autoSignInAfterVerification: true,
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
  hooks: {
    before: extraChecks,
  },
  plugins: [...botCheckPlugins(), emailCodePlugin()],
  // The email code plugin also offers code-based log in, password reset and email change.
  // This app doesn't use those, so they're switched off.
  disabledPaths: [
    '/sign-in/email-otp',
    '/email-otp/check-verification-otp',
    '/email-otp/request-password-reset',
    '/forget-password/email-otp',
    '/email-otp/reset-password',
    '/email-otp/request-email-change',
    '/email-otp/change-email',
  ],
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

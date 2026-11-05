import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'

// With no baseURL, requests go to /api/auth on this site, which Vite forwards to the server.
// emailOTPClient adds the calls for checking and resending 6-digit email codes.
export const authClient = createAuthClient({
  plugins: [emailOTPClient()],
})

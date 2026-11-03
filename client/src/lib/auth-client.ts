import { createAuthClient } from 'better-auth/react'

// With no baseURL, requests go to /api/auth on this site, which Vite forwards to the server
export const authClient = createAuthClient()
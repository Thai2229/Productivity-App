import type { NextFunction, Request, Response } from 'express'

// Security headers on every API response (the same set the helmet package sends).
// Written out here instead of using helmet, whose import breaks Vercel's TypeScript build.
const HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Referrer-Policy': 'no-referrer',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'X-XSS-Protection': '0',
}

export function securityHeaders(_request: Request, response: Response, next: NextFunction) {
  for (const [name, value] of Object.entries(HEADERS)) {
    response.setHeader(name, value)
  }
  next()
}

/**
 * Base URL for x402 Pages Functions.
 * - Production (Cloudflare Pages): '' (same origin)
 * - Local Nuxt `npm run dev`: http://127.0.0.1:8788 (`npm run pages:dev`)
 */
export function getX402Base(): string {
  const config = useRuntimeConfig()
  const base = String(config.public.x402Base || '').replace(/\/$/, '')
  return base
}

/** Build an absolute or same-origin x402 path, e.g. `/api/x402/auth-bridge`. */
export function x402Url(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getX402Base()}${normalized}`
}

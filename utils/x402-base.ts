/**
 * Base URL for x402 Pages Functions.
 * - Production (Cloudflare Pages): '' (same origin)
 * - Local Nuxt `npm run dev`: http://<same-hostname>:8788 (`npm run pages:dev`)
 *
 * Hostname is forced to match the page (localhost vs 127.0.0.1) so the
 * auth-bridge cookie and paywall navigation stay same-site.
 */
export function getX402Base(): string {
  const config = useRuntimeConfig()
  let base = String(config.public.x402Base || '').replace(/\/$/, '')
  if (!base) return ''

  if (import.meta.client && typeof window !== 'undefined') {
    try {
      const u = new URL(base)
      u.hostname = window.location.hostname || u.hostname
      base = u.origin
    } catch {
      /* keep configured base */
    }
  }
  return base
}

/** Build an absolute or same-origin x402 path, e.g. `/api/x402/auth-bridge`. */
export function x402Url(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${getX402Base()}${normalized}`
}

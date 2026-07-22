// Shared Cloudflare Pages Function environment bindings for /api/x402/*.
// This is the ONLY place x402 talks to saturnator-api (Strapi): a scoped
// server-side API token, never a user JWT, never a secret in wrangler.toml.
export interface Env {
  X402_ENABLED?: string;
  X402_NETWORK?: string;
  X402_FACILITATOR_URL?: string;
  X402_DEFAULT_RECEIVER?: string;
  X402_LICENSE_MIN_USD?: string;
  X402_SPOTLIGHT_PRICE_USD?: string;
  X402_SPOTLIGHT_WINDOW_HOURS?: string;
  X402_SIGNED_DOWNLOAD_TTL_SECONDS?: string;
  /** Comma-separated allowed CORS origins for payment header exposure. */
  X402_CORS_ORIGINS?: string;
  // Secrets — set via `wrangler pages secret put`, never in wrangler.toml.
  STRAPI_URL?: string;
  STRAPI_API_TOKEN?: string;
}

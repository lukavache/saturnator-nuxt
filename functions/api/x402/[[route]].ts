// Cloudflare Pages Function: Hono sub-app mounted at /api/x402/*.
// This is the ONLY server runtime in Saturnator's frontend deployment.
// Nuxt stays statically generated; Strapi (separate repo) keeps auth/CMS/DB/storage.
import { Hono } from 'hono'
import { handle } from 'hono/cloudflare-pages'
import { cors } from 'hono/cors'
import { paymentMiddleware, x402ResourceServer } from '@x402/hono'
import { HTTPFacilitatorClient } from '@x402/core/server'
import { ExactSvmScheme } from '@x402/svm/exact/server'

interface Env {
  X402_ENABLED?: string
  X402_NETWORK?: string
  X402_FACILITATOR_URL?: string
  X402_DEFAULT_RECEIVER?: string
  // Future (Phase 1+): STRAPI_URL, STRAPI_API_TOKEN (secret) for offer/settlement ops.
}

const DEFAULTS = {
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1', // Solana Devnet
  facilitatorUrl: 'https://x402.org/facilitator',
  payTo: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU', // Devnet test receiver (public)
}

// Memoize per isolate so we don't rebuild the resource server / re-sync per request.
let cachedApp: Hono | null = null

function buildApp(env: Env): Hono {
  const network = env.X402_NETWORK || DEFAULTS.network
  const facilitatorUrl = env.X402_FACILITATOR_URL || DEFAULTS.facilitatorUrl
  const payTo = env.X402_DEFAULT_RECEIVER || DEFAULTS.payTo

  const facilitator = new HTTPFacilitatorClient({ url: facilitatorUrl })
  const resourceServer = new x402ResourceServer(facilitator).register(
    network,
    new ExactSvmScheme(),
  )

  const app = new Hono().basePath('/api/x402')

  // Ensure x402 headers are readable by browser JS and survive same-origin/CORS.
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-payment', 'payment-signature'],
      exposeHeaders: ['payment-required', 'payment-response', 'x-payment-response'],
    }),
  )

  // paymentMiddleware lazily awaits resourceServer.initialize() on first paid request
  // (syncFacilitatorOnStart defaults to true).
  app.use(
    paymentMiddleware(
      {
        'GET /api/x402/health': {
          accepts: {
            scheme: 'exact',
            price: '$0.001',
            network,
            payTo,
          },
          description: 'x402 Cloudflare Pages runtime smoke test',
          mimeType: 'application/json',
        },
      },
      resourceServer,
    ),
  )

  // Only reached AFTER a valid x402 payment is verified/settled.
  app.get('/health', (c) =>
    c.json({ ok: true, message: 'x402 payment verified — access granted' }),
  )

  return app
}

export const onRequest = (context: { env: Env }) => {
  if (!cachedApp) cachedApp = buildApp(context.env)
  // @ts-expect-error hono's handle returns a PagesFunction-compatible handler
  return handle(cachedApp)(context)
}

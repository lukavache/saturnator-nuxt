// Cloudflare Pages Function: Hono sub-app mounted at /api/x402/*.
// This is the ONLY server runtime in Saturnator's frontend deployment.
// Nuxt stays statically generated; Strapi (separate repo) keeps auth/CMS/DB/storage.
//
// Phase 2 adds the two real payment routes on top of the Phase 0/0.5
// smoke-test route:
//   GET  /api/x402/license/:trackId   — buy a track+sample-pack license
//   POST /api/x402/sponsor/:artistId  — sponsor an artist (Spotlight boost)
// Both resolve payTo/price dynamically against saturnator-api (Strapi) and
// record settlement idempotently via onAfterSettle (see _lib/x402-server.ts).
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { paymentMiddleware } from '@x402/hono';
import type { RoutesConfig } from '@x402/core/server';
import type { Network } from '@x402/core/types';

import type { Env } from './_lib/types';
import { resolveX402Config, X402ConfigError } from './_lib/config';
import { getX402Server } from './_lib/x402-server';
import { resolveLicenseAttempt, resolveSponsorshipAttempt, consumeLicenseAttempt, consumeSponsorshipAttempt } from './_lib/attempt-resolution';
import { OfferResolutionError } from './_lib/offers';
import { StrapiRequestError } from './_lib/strapi-client';
import { SettlementMismatchError } from './_lib/settlement';

// Memoize per isolate so we don't rebuild the resource server / re-sync per request.
let cachedApp: Hono | null = null;
let cachedForToken: string | null = null;

const OFFER_ERROR_STATUS: Record<string, 400 | 401 | 404 | 409> = {
  track_not_found: 404,
  artist_not_found: 404,
  track_not_licensable: 409,
  wallet_not_verified: 409,
  wallet_network_mismatch: 409,
  unsupported_network: 400,
  unauthenticated: 401,
};

function buildApp(env: Env): Hono {
  const config = resolveX402Config(env);
  const resourceServer = getX402Server(config);
  const network = config.network as Network;

  const app = new Hono().basePath('/api/x402');

  // Ensure x402 headers are readable by browser JS and survive same-origin/CORS.
  app.use(
    '*',
    cors({
      origin: '*',
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-payment', 'payment-signature'],
      exposeHeaders: ['payment-required', 'payment-response', 'x-payment-response'],
    }),
  );

  // Business-rule failures (not found, not licensable, unauthenticated,
  // wallet not verified, settlement mismatch) get clean, specific responses
  // instead of a generic 500 — payTo/price hooks and onAfterSettle can only
  // throw, they can't shape an HTTP response directly.
  app.onError((error, c) => {
    if (error instanceof OfferResolutionError) {
      const status = OFFER_ERROR_STATUS[error.code] ?? 400;
      return c.json({ error: error.code, message: error.message }, status);
    }
    if (error instanceof SettlementMismatchError) {
      // eslint-disable-next-line no-console
      console.error('[x402] settlement mismatch (possible tampering)', error.message);
      return c.json({ error: 'settlement_mismatch', message: error.message }, 409);
    }
    if (error instanceof StrapiRequestError) {
      // eslint-disable-next-line no-console
      console.error('[x402] upstream Strapi error', error.status, error.message);
      return c.json({ error: 'upstream_error', message: 'saturnator-api request failed' }, 502);
    }
    // eslint-disable-next-line no-console
    console.error('[x402] unhandled error', error);
    return c.json({ error: 'internal_error', message: 'Unexpected x402 error' }, 500);
  });

  const routes: RoutesConfig = {
    'GET /api/x402/health': {
      accepts: {
        scheme: 'exact',
        price: '$0.001',
        network,
        payTo: config.defaultReceiver || '11111111111111111111111111111111',
      },
      description: 'x402 Cloudflare Pages runtime smoke test',
      mimeType: 'application/json',
    },
    'GET /api/x402/license/:trackId': {
      accepts: {
        scheme: 'exact',
        payTo: async (context) => (await resolveLicenseAttempt(config, context)).offer.payTo,
        price: async (context) => `$${(await resolveLicenseAttempt(config, context)).offer.priceUsd}`,
        network,
      },
      description: 'Purchase a reusable track + sample-pack license via x402',
      mimeType: 'application/json',
    },
    'POST /api/x402/sponsor/:artistId': {
      accepts: {
        scheme: 'exact',
        payTo: async (context) => (await resolveSponsorshipAttempt(config, context)).offer.payTo,
        price: async (context) => `$${(await resolveSponsorshipAttempt(config, context)).offer.priceUsd}`,
        network,
      },
      description: 'Sponsor an artist onto the transparent Spotlight leaderboard via x402',
      mimeType: 'application/json',
    },
  };

  app.use(paymentMiddleware(routes, resourceServer));

  // Only reached AFTER a valid x402 payment is verified/settled.
  app.get('/health', (c) => c.json({ ok: true, message: 'x402 payment verified — access granted' }));

  app.get('/license/:trackId', async (c) => {
    const paymentHeader = c.req.header('x-payment');
    const attempt = await consumeLicenseAttempt(paymentHeader);
    if (!attempt) {
      // Extremely unlikely (cache evicted between settle and here within
      // the same request), but fail closed rather than claim success.
      return c.json({ error: 'attempt_expired', message: 'Payment settled but offer snapshot expired; contact support' }, 500);
    }
    const { offer } = attempt;
    return c.json({
      ok: true,
      license: {
        trackId: offer.trackId,
        trackTitle: offer.trackTitle,
        licenseType: offer.licenseType,
        licenseVersion: offer.licenseVersion,
        priceUsd: offer.priceUsd,
      },
      // Signed download delivery is Phase 3 scope.
      message: 'License purchased and recorded. Download delivery lands in Phase 3.',
    });
  });

  app.post('/sponsor/:artistId', async (c) => {
    const paymentHeader = c.req.header('x-payment');
    const attempt = await consumeSponsorshipAttempt(paymentHeader);
    if (!attempt) {
      return c.json({ error: 'attempt_expired', message: 'Payment settled but offer snapshot expired; contact support' }, 500);
    }
    const { offer } = attempt;
    return c.json({
      ok: true,
      sponsorship: {
        artistId: offer.artistId,
        artistUsername: offer.artistUsername,
        priceUsd: offer.priceUsd,
      },
      // Leaderboard aggregation/display is Phase 4 scope.
      message: 'Sponsorship recorded. Spotlight leaderboard lands in Phase 4.',
    });
  });

  return app;
}

export const onRequest = (context: { env: Env }) => {
  // Rebuild if config-relevant env changed (relevant for local dev where
  // wrangler can hot-reload with different vars) — cheap string compare.
  const tokenKey = `${context.env.X402_NETWORK}:${context.env.STRAPI_URL}`;
  try {
    if (!cachedApp || cachedForToken !== tokenKey) {
      cachedApp = buildApp(context.env);
      cachedForToken = tokenKey;
    }
  } catch (error) {
    if (error instanceof X402ConfigError) {
      // Task 2.1: fail loudly and visibly rather than silently serving a
      // half-broken payment flow.
      // eslint-disable-next-line no-console
      console.error('[x402] refusing to start: invalid configuration:', error.message);
      return new Response(JSON.stringify({ error: 'x402_misconfigured', message: error.message }), {
        status: 500,
        headers: { 'content-type': 'application/json' },
      });
    }
    throw error;
  }
  // @ts-expect-error hono's handle returns a PagesFunction-compatible handler
  return handle(cachedApp)(context);
};

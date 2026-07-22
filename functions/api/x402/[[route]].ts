// Cloudflare Pages Function: Hono sub-app mounted at /api/x402/*.
// Phase 2: health + license + sponsor payment routes.
// Phase 3: owned skip-charge, license receipt, download proxy, auth-cookie
// bridge for the official x402 Solana HTML paywall.
import { Hono } from 'hono';
import { handle } from 'hono/cloudflare-pages';
import { cors } from 'hono/cors';
import { setCookie } from 'hono/cookie';
import {
  paymentMiddlewareFromHTTPServer,
  x402HTTPResourceServer,
} from '@x402/hono';
import type { RoutesConfig, HTTPRequestContext } from '@x402/core/server';
import type { Network } from '@x402/core/types';

import type { Env } from './_lib/types';
import { resolveX402Config, X402ConfigError } from './_lib/config';
import { getX402Server } from './_lib/x402-server';
import {
  resolveLicenseAttempt,
  resolveSponsorshipAttempt,
  consumeLicenseAttempt,
  consumeSponsorshipAttempt,
} from './_lib/attempt-resolution';
import { OfferResolutionError } from './_lib/offers';
import { StrapiRequestError } from './_lib/strapi-client';
import { SettlementMismatchError } from './_lib/settlement';
import { extractJwtFromContext, extractJwtFromHono, AUTH_COOKIE } from './_lib/auth';
import { findOwnedPurchase, findOwnedPurchaseByApiToken } from './_lib/ownership';
import { buildLicenseReceipt, strapiPurchaseDownloadPath } from './_lib/receipt';
import { extractRouteParams } from './_lib/route-params';
import { verifyStrapiJwt } from './_lib/strapi-client';
import { fetchArtistRank, fetchSpotlightBoard } from './_lib/spotlight';
import { newRequestId, x402Log } from './_lib/logger';
import { checkRateLimit } from './_lib/rate-limit';

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

const OFFER_USER_MESSAGES: Record<string, string> = {
  track_not_found: 'This track is no longer available.',
  artist_not_found: 'This artist is no longer available for sponsorship.',
  track_not_licensable: 'Licensing is not enabled for this track.',
  wallet_not_verified: 'Artist payout wallet is not verified yet.',
  wallet_network_mismatch: 'Artist wallet is on the wrong Solana network (Devnet required).',
  unsupported_network: 'Only Solana Devnet USDC is supported.',
  unauthenticated: 'Sign in required.',
};

function clientIp(c: { req: { header: (name: string) => string | undefined } }): string {
  return (
    c.req.header('cf-connecting-ip') ||
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
    'unknown'
  );
}

function buildApp(env: Env): Hono {
  const config = resolveX402Config(env);
  const resourceServer = getX402Server(config);
  const network = config.network as Network;

  const app = new Hono().basePath('/api/x402');

  const corsOrigins = (env.X402_CORS_ORIGINS || 'https://saturnator.pages.dev,http://localhost:3000,http://localhost:8788')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use('*', async (c, next) => {
    const requestId = c.req.header('x-request-id') || newRequestId();
    c.set('requestId' as never, requestId as never);
    c.header('x-request-id', requestId);
    await next();
  });

  app.use(
    '*',
    cors({
      origin: (origin) => {
        if (!origin) return corsOrigins[0] || 'http://localhost:3000';
        if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return origin;
        // Same-origin Pages Function calls often omit Origin; allow listed preview hosts.
        if (/^https:\/\/[a-z0-9-]+\.saturnator\.pages\.dev$/i.test(origin)) return origin;
        return origin;
      },
      credentials: true,
      allowMethods: ['GET', 'POST', 'OPTIONS'],
      allowHeaders: ['content-type', 'authorization', 'x-payment', 'payment-signature', 'x-request-id'],
      exposeHeaders: ['payment-required', 'payment-response', 'x-payment-response', 'x-request-id'],
    }),
  );

  // Rate limits: offer discovery / sponsorship / download / auth-bridge.
  app.use('*', async (c, next) => {
    const path = c.req.path;
    const method = c.req.method;
    if (method === 'OPTIONS') return next();

    let limit = 120;
    let windowMs = 60_000;
    if (path.includes('/license/') || path.includes('/sponsor')) {
      limit = 30;
    } else if (path.includes('/download') || path.includes('/auth-bridge')) {
      limit = 40;
    } else if (path.includes('/spotlight')) {
      limit = 60;
    }

    const key = `${clientIp(c)}:${method}:${path.split('/').slice(0, 5).join('/')}`;
    const result = checkRateLimit(key, limit, windowMs);
    c.header('x-ratelimit-remaining', String(result.remaining));
    if (!result.allowed) {
      const requestId = (c.get('requestId' as never) as string) || newRequestId();
      x402Log('warn', {
        requestId,
        status: 'rate_limited',
        path,
        httpStatus: 429,
        message: 'rate limit exceeded',
      });
      return c.json(
        {
          error: 'rate_limited',
          message: 'Too many requests. Wait a moment and retry.',
          requestId,
        },
        429,
      );
    }
    return next();
  });

  app.onError((error, c) => {
    const requestId = (c.get('requestId' as never) as string) || newRequestId();
    if (error instanceof OfferResolutionError) {
      const status = OFFER_ERROR_STATUS[error.code] ?? 400;
      x402Log('warn', {
        requestId,
        status: 'offer_rejected',
        code: error.code,
        path: c.req.path,
        httpStatus: status,
        message: error.message,
      });
      return c.json(
        {
          error: error.code,
          message: OFFER_USER_MESSAGES[error.code] || error.message,
          requestId,
        },
        status,
      );
    }
    if (error instanceof SettlementMismatchError) {
      x402Log('error', {
        requestId,
        status: 'error',
        code: 'settlement_mismatch',
        path: c.req.path,
        httpStatus: 409,
        message: error.message,
      });
      return c.json(
        {
          error: 'settlement_mismatch',
          message:
            'Payment details did not match the server offer. No entitlement was created — check Explorer before retrying.',
          requestId,
        },
        409,
      );
    }
    if (error instanceof StrapiRequestError) {
      x402Log('error', {
        requestId,
        status: 'error',
        code: 'upstream_error',
        httpStatus: 502,
        message: error.message,
        path: c.req.path,
      });
      return c.json({ error: 'upstream_error', message: 'Backend temporarily unavailable. Retry shortly.', requestId }, 502);
    }
    x402Log('error', {
      requestId,
      status: 'error',
      code: 'internal_error',
      path: c.req.path,
      httpStatus: 500,
      message: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'internal_error', message: 'Unexpected payment error. Do not pay again until you check ownership.', requestId }, 500);
  });

  // Bridge: SPA stores JWT in localStorage; the official HTML paywall navigates
  // without an Authorization header. Set a short-lived HttpOnly cookie so the
  // subsequent GET /license/:id can authenticate the buyer.
  app.post('/auth-bridge', async (c) => {
    const jwt = extractJwtFromHono(c);
    if (!jwt) return c.json({ error: 'unauthenticated', message: 'Bearer token required' }, 401);
    const user = await verifyStrapiJwt(config, jwt);
    if (!user) return c.json({ error: 'unauthenticated', message: 'Invalid JWT' }, 401);

    setCookie(c, AUTH_COOKIE, jwt, {
      httpOnly: true,
      sameSite: 'Lax',
      path: '/api/x402',
      maxAge: 10 * 60,
      secure: c.req.url.startsWith('https://'),
    });
    return c.json({ ok: true, userId: user.id });
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
    // Plan alias (same handler semantics).
    'POST /api/x402/artists/:artistId/sponsor': {
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

  // Skip charging when the buyer already holds a settled entitlement.
  const httpServer = new x402HTTPResourceServer(resourceServer, routes).onProtectedRequest(
    async (context: HTTPRequestContext, routeConfig) => {
      if (!routeConfig || !String(context.routePattern || '').includes('/license/')) return;
      const jwt = extractJwtFromContext(context);
      if (!jwt) return;
      const { trackId } = extractRouteParams(context.routePattern, context.path);
      if (!trackId) return;
      const owned = await findOwnedPurchase(config, jwt, trackId);
      if (owned) return { grantAccess: true as const };
    },
  );

  app.use(paymentMiddlewareFromHTTPServer(httpServer));

  app.get('/health', (c) => c.json({ ok: true, message: 'x402 payment verified — access granted' }));

  app.get('/license/:trackId', async (c) => {
    const trackId = c.req.param('trackId');
    const jwt = extractJwtFromHono(c);
    if (!jwt) {
      return c.json({ error: 'unauthenticated', message: 'Missing Authorization bearer token (Strapi JWT)' }, 401);
    }

    // Already owned (grantAccess path) — return receipt, never charge again.
    const owned = await findOwnedPurchase(config, jwt, trackId);
    if (owned) {
      return c.json({
        ok: true,
        ...buildLicenseReceipt(config, owned, true),
        message: 'License already owned — no charge.',
      });
    }

    // Fresh settlement path.
    const paymentHeader = c.req.header('x-payment') || c.req.header('PAYMENT-SIGNATURE');
    const attempt = await consumeLicenseAttempt(paymentHeader);
    if (!attempt) {
      return c.json(
        { error: 'attempt_expired', message: 'Payment settled but offer snapshot expired; contact support' },
        500,
      );
    }

    const purchase =
      (await findOwnedPurchase(config, attempt.buyerJwt, trackId)) ||
      (await findOwnedPurchaseByApiToken(config, attempt.buyerId, trackId));

    if (!purchase) {
      // Settlement recorded asynchronously or briefly delayed — return offer
      // facts so the UI can poll / for-track without inviting a second payment.
      return c.json({
        ok: true,
        purchaseId: null,
        assetId: attempt.offer.trackId,
        assetTitle: attempt.offer.trackTitle,
        licenseType: attempt.offer.licenseType,
        licenseVersion: attempt.offer.licenseVersion,
        amountUsd: attempt.offer.priceUsd,
        transactionSignature: null,
        explorerUrl: null,
        downloadUrl: null,
        alreadyOwned: false,
        pending: true,
        message:
          'Payment settled on-chain; entitlement is still writing. Poll ownership — do not pay again.',
      });
    }

    return c.json({
      ok: true,
      ...buildLicenseReceipt(config, purchase, false),
      message: 'License purchased and recorded.',
    });
  });

  // Same-origin download proxy: validates buyer JWT, then asks Strapi for
  // short-lived signed file URLs (never logs those URLs).
  app.get('/licenses/:purchaseId/download', async (c) => {
    const jwt = extractJwtFromHono(c);
    if (!jwt) return c.json({ error: 'unauthenticated', message: 'Authentication required' }, 401);

    const purchaseId = c.req.param('purchaseId');
    const upstream = await fetch(`${config.strapiUrl}${strapiPurchaseDownloadPath(purchaseId)}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });

    const body = await upstream.json().catch(() => ({ error: 'upstream_error' }));
    if (!upstream.ok) {
      return c.json(body, upstream.status as 400 | 401 | 403 | 404 | 500);
    }
    return c.json(body);
  });

  async function sponsorshipReceipt(c: any, artistId: string) {
    const paymentHeader = c.req.header('x-payment') || c.req.header('PAYMENT-SIGNATURE');
    const attempt = await consumeSponsorshipAttempt(paymentHeader);
    if (!attempt) {
      return c.json(
        { error: 'attempt_expired', message: 'Payment settled but offer snapshot expired; contact support' },
        500,
      );
    }

    // Rank is computed only AFTER settlement was recorded by onAfterSettle.
    // Never invent a speculative rank for the UI.
    let rankPayload: Awaited<ReturnType<typeof fetchArtistRank>> | null = null;
    try {
      rankPayload = await fetchArtistRank(config, attempt.offer.artistId);
    } catch (error) {
      console.error('[x402] failed to load post-settlement rank', error);
    }

    return c.json({
      ok: true,
      sponsorship: {
        artistId: attempt.offer.artistId,
        artistUsername: attempt.offer.artistUsername,
        priceUsd: attempt.offer.priceUsd,
        payTo: attempt.offer.payTo,
      },
      rank: rankPayload?.rank ?? null,
      score: rankPayload?.entry?.score ?? null,
      uniqueSupporters: rankPayload?.entry?.uniqueSupporters ?? null,
      totalUsd: rankPayload?.entry?.totalUsd ?? null,
      explorerUrl: rankPayload?.entry?.latestExplorerUrl ?? null,
      transactionSignature: rankPayload?.entry?.latestTransactionSignature ?? null,
      message: 'Sponsorship recorded. Spotlight rank updates only after confirmed settlement.',
    });
  }

  app.post('/sponsor/:artistId', (c) => sponsorshipReceipt(c, c.req.param('artistId')));
  app.post('/artists/:artistId/sponsor', (c) => sponsorshipReceipt(c, c.req.param('artistId')));

  // Same-origin Spotlight proxy (public) — keeps the SPA on one origin for
  // Cloudflare preview; also usable if Strapi CORS is tight.
  app.get('/spotlight', async (c) => {
    const window = c.req.query('window') || '24h';
    const limit = Number(c.req.query('limit') || 20);
    try {
      const board = await fetchSpotlightBoard(config, { window, limit });
      return c.json(board);
    } catch (error) {
      console.error('[x402] spotlight proxy failed', error);
      return c.json({ error: 'upstream_error', message: 'Could not load Spotlight' }, 502);
    }
  });

  return app;
}

export const onRequest = (context: { env: Env }) => {
  const tokenKey = `${context.env.X402_NETWORK}:${context.env.STRAPI_URL}`;
  try {
    if (!cachedApp || cachedForToken !== tokenKey) {
      cachedApp = buildApp(context.env);
      cachedForToken = tokenKey;
    }
  } catch (error) {
    if (error instanceof X402ConfigError) {
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

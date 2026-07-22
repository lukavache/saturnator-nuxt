// Ties together offer resolution (Task 2.3), buyer/sponsor identity
// (verified via Strapi JWT — the existing app identity system), and the
// per-attempt cache, so:
//   - `payTo` and `price` dynamic functions observe one consistent snapshot
//     per payment attempt, and
//   - `onAfterSettle` can recover that SAME snapshot to record settlement,
//     without re-querying Strapi and risking a race against a change made
//     mid-flight (e.g. the artist edits their price/wallet).
//
// `HTTPRequestContext` (the type the x402 SDK passes into payTo/price) has
// no generic header accessor, but it does carry `adapter` — the concrete
// HonoAdapter wrapping the real Hono `Context` — so `context.adapter
// .getHeader('authorization')` is how we read the caller's Strapi JWT from
// inside these hooks (confirmed via @x402/hono's HonoAdapter.getHeader).
import type { HTTPRequestContext } from '@x402/core/server';
import type { X402Config } from './config';
import { getLicenseOffer, getSponsorshipOffer, OfferResolutionError, type LicenseOffer, type SponsorshipOffer } from './offers';
import { verifyStrapiJwt } from './strapi-client';
import { cacheOffer, consumeCachedOffer, getCachedOffer } from './offer-cache';
import { extractRouteParams } from './route-params';

export interface LicenseAttempt {
  kind: 'license';
  offer: LicenseOffer;
  buyerId: number;
}

export interface SponsorshipAttempt {
  kind: 'sponsorship';
  offer: SponsorshipOffer;
  sponsorId: number | null;
}

function bearerToken(context: HTTPRequestContext): string | undefined {
  const header = context.adapter.getHeader('authorization');
  if (!header) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1] : undefined;
}

async function requireBuyer(config: X402Config, context: HTTPRequestContext): Promise<number> {
  const token = bearerToken(context);
  if (!token) throw new OfferResolutionError('unauthenticated', 'Missing Authorization bearer token (Strapi JWT)');
  const user = await verifyStrapiJwt(config, token);
  if (!user) throw new OfferResolutionError('unauthenticated', 'Invalid or expired Strapi JWT');
  return user.id;
}

async function optionalSponsor(config: X402Config, context: HTTPRequestContext): Promise<number | null> {
  const token = bearerToken(context);
  if (!token) return null; // anonymous sponsorship is allowed
  const user = await verifyStrapiJwt(config, token);
  return user?.id ?? null;
}

/**
 * Resolve (or reuse the cached in-flight resolution of) the license offer +
 * buyer identity for this payment attempt. Only cached when a `paymentHeader`
 * is present (i.e. this is an actual payment attempt, not the initial
 * unpaid 402 probe) — see offer-cache.ts.
 */
export function resolveLicenseAttempt(config: X402Config, context: HTTPRequestContext): Promise<LicenseAttempt> {
  const key = context.paymentHeader;
  if (key) {
    const cached = getCachedOffer<Promise<LicenseAttempt>>(key);
    if (cached) return cached;
  }

  const { trackId } = extractRouteParams(context.routePattern, context.path);
  const promise = (async (): Promise<LicenseAttempt> => {
    const [offer, buyerId] = await Promise.all([
      getLicenseOffer(config, trackId),
      requireBuyer(config, context),
    ]);
    return { kind: 'license', offer, buyerId };
  })();

  if (key) cacheOffer(key, promise);
  return promise;
}

export function resolveSponsorshipAttempt(config: X402Config, context: HTTPRequestContext): Promise<SponsorshipAttempt> {
  const key = context.paymentHeader;
  if (key) {
    const cached = getCachedOffer<Promise<SponsorshipAttempt>>(key);
    if (cached) return cached;
  }

  const { artistId } = extractRouteParams(context.routePattern, context.path);
  const promise = (async (): Promise<SponsorshipAttempt> => {
    const [offer, sponsorId] = await Promise.all([
      getSponsorshipOffer(config, artistId),
      optionalSponsor(config, context),
    ]);
    return { kind: 'sponsorship', offer, sponsorId };
  })();

  if (key) cacheOffer(key, promise);
  return promise;
}

// `onAfterSettle` fires BEFORE the downstream route handler runs (payment is
// verified+settled, then the middleware calls `next()`). So onAfterSettle
// must only PEEK the cached attempt (settlement recording needs it) and the
// downstream handler — which runs after and wants to render a response from
// the same resolved offer — is what finally CONSUMES (evicts) it.
export function peekLicenseAttempt(paymentHeader: string | undefined): Promise<LicenseAttempt> | undefined {
  return getCachedOffer<Promise<LicenseAttempt>>(paymentHeader);
}

export function peekSponsorshipAttempt(paymentHeader: string | undefined): Promise<SponsorshipAttempt> | undefined {
  return getCachedOffer<Promise<SponsorshipAttempt>>(paymentHeader);
}

export function consumeLicenseAttempt(paymentHeader: string | undefined): Promise<LicenseAttempt> | undefined {
  return consumeCachedOffer<Promise<LicenseAttempt>>(paymentHeader);
}

export function consumeSponsorshipAttempt(paymentHeader: string | undefined): Promise<SponsorshipAttempt> | undefined {
  return consumeCachedOffer<Promise<SponsorshipAttempt>>(paymentHeader);
}

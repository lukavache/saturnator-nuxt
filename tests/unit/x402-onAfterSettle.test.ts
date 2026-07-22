import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SettleResultContext } from '@x402/core/server';
import { buildOnAfterSettleHook } from '../../functions/api/x402/_lib/x402-server';
import { cacheOffer, __resetOfferCacheForTests } from '../../functions/api/x402/_lib/offer-cache';
import type { X402Config } from '../../functions/api/x402/_lib/config';
import type { LicenseOffer } from '../../functions/api/x402/_lib/offers';

const CONFIG: X402Config = {
  enabled: true,
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  facilitatorUrl: 'https://x402.org/facilitator',
  defaultReceiver: '',
  licenseMinUsd: '0.01',
  spotlightPriceUsd: '0.10',
  spotlightWindowHours: 24,
  signedDownloadTtlSeconds: 60,
  strapiUrl: 'https://api.example.com',
  strapiApiToken: 'internal-token',
};

const LICENSE_OFFER: LicenseOffer = {
  trackId: '10',
  sellerId: 5,
  trackTitle: 'Test Track',
  payTo: 'ArtistWallet11111111111111111111111111111',
  network: CONFIG.network,
  assetMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  priceUsd: '0.10',
  amountAtomic: '100000',
  licenseType: 'non_exclusive_commercial',
  licenseVersion: 'saturnator-license-v1',
};

function fakeSettleContext(overrides: {
  success: boolean;
  payTo?: string;
  amount?: string;
  paymentHeader?: string;
}): SettleResultContext {
  return {
    paymentPayload: {} as never,
    declaredExtensions: {},
    requirements: {
      scheme: 'exact',
      network: CONFIG.network,
      asset: LICENSE_OFFER.assetMint,
      amount: overrides.amount ?? LICENSE_OFFER.amountAtomic,
      payTo: overrides.payTo ?? LICENSE_OFFER.payTo,
      maxTimeoutSeconds: 60,
      extra: {},
    },
    result: {
      success: overrides.success,
      transaction: 'sig-1',
      payer: 'BuyerWallet11111111111111111111111111111',
      network: CONFIG.network,
    },
    transportContext: {
      request: {
        adapter: {} as never,
        path: '/api/x402/license/10',
        method: 'GET',
        paymentHeader: overrides.paymentHeader ?? 'attempt-key-1',
        routePattern: 'GET /api/x402/license/:trackId',
      },
    },
  } as unknown as SettleResultContext;
}

describe('buildOnAfterSettleHook', () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    __resetOfferCacheForTests();
    fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ data: { id: 1 } }) }));
    (globalThis as any).fetch = fetchMock;
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('creates no entitlement/boost when settlement failed', async () => {
    const hook = buildOnAfterSettleHook(CONFIG);
    cacheOffer('attempt-key-1', Promise.resolve({ kind: 'license', offer: LICENSE_OFFER, buyerId: 99, buyerJwt: 'jwt' }));

    await hook(fakeSettleContext({ success: false }));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('records a license purchase once settlement succeeds', async () => {
    const hook = buildOnAfterSettleHook(CONFIG);
    cacheOffer('attempt-key-1', Promise.resolve({ kind: 'license', offer: LICENSE_OFFER, buyerId: 99, buyerJwt: 'jwt' }));

    await hook(fakeSettleContext({ success: true }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://api.example.com/api/license-purchases');
  });

  it('a duplicate settlement callback for the same attempt calls through twice with the same payment ID (server-side idempotency dedupes to one record)', async () => {
    const hook = buildOnAfterSettleHook(CONFIG);
    cacheOffer('attempt-key-1', Promise.resolve({ kind: 'license', offer: LICENSE_OFFER, buyerId: 99, buyerJwt: 'jwt' }));

    await hook(fakeSettleContext({ success: true }));
    await hook(fakeSettleContext({ success: true }));

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    const secondBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(firstBody.data.x402PaymentId).toBe(secondBody.data.x402PaymentId);
  });

  it('rejects and alerts on a recipient mismatch without persisting anything', async () => {
    const hook = buildOnAfterSettleHook(CONFIG);
    cacheOffer('attempt-key-1', Promise.resolve({ kind: 'license', offer: LICENSE_OFFER, buyerId: 99, buyerJwt: 'jwt' }));

    await hook(fakeSettleContext({ success: true, payTo: 'AttackerWallet111111111111111111111111111' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('rejects a price mismatch without persisting anything', async () => {
    const hook = buildOnAfterSettleHook(CONFIG);
    cacheOffer('attempt-key-1', Promise.resolve({ kind: 'license', offer: LICENSE_OFFER, buyerId: 99, buyerJwt: 'jwt' }));

    await hook(fakeSettleContext({ success: true, amount: '1' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('logs a warning and records nothing when no attempt was cached (expired/evicted)', async () => {
    const hook = buildOnAfterSettleHook(CONFIG);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await hook(fakeSettleContext({ success: true, paymentHeader: 'never-cached' }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();
  });
});

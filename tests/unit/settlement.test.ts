import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { recordLicenseSettlement, recordSponsorshipSettlement, SettlementMismatchError, type SettledPaymentFacts } from '../../functions/api/x402/_lib/settlement';
import type { X402Config } from '../../functions/api/x402/_lib/config';
import type { LicenseOffer, SponsorshipOffer } from '../../functions/api/x402/_lib/offers';

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

const SETTLED: SettledPaymentFacts = {
  transactionSignature: 'sig-1',
  payerWallet: 'BuyerWallet11111111111111111111111111111',
  payTo: LICENSE_OFFER.payTo,
  network: LICENSE_OFFER.network,
  assetMint: LICENSE_OFFER.assetMint,
  amountAtomic: LICENSE_OFFER.amountAtomic,
};

describe('recordLicenseSettlement', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ data: { id: 1 } }),
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls saturnator-api with a deterministic x402PaymentId when terms match the offer', async () => {
    await recordLicenseSettlement(CONFIG, LICENSE_OFFER, 99, SETTLED);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.example.com/api/license-purchases');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.data.buyer).toBe(99);
    expect(body.data.seller).toBe(LICENSE_OFFER.sellerId);
    expect(body.data.x402PaymentId).toMatch(/^[0-9a-f]{64}$/);
  });

  it('derives the SAME x402PaymentId for a duplicate settlement callback (idempotency)', async () => {
    await recordLicenseSettlement(CONFIG, LICENSE_OFFER, 99, SETTLED);
    await recordLicenseSettlement(CONFIG, LICENSE_OFFER, 99, SETTLED);
    const [, firstInit] = fetchMock.mock.calls[0];
    const [, secondInit] = fetchMock.mock.calls[1];
    const firstBody = JSON.parse((firstInit as RequestInit).body as string);
    const secondBody = JSON.parse((secondInit as RequestInit).body as string);
    expect(firstBody.data.x402PaymentId).toBe(secondBody.data.x402PaymentId);
  });

  it('rejects (and never calls Strapi) when the settled recipient does not match the offer', async () => {
    await expect(
      recordLicenseSettlement(CONFIG, LICENSE_OFFER, 99, { ...SETTLED, payTo: 'AttackerWallet111111111111111111111111111' }),
    ).rejects.toThrow(SettlementMismatchError);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects (and never calls Strapi) when the settled amount does not match the offer price', async () => {
    await expect(recordLicenseSettlement(CONFIG, LICENSE_OFFER, 99, { ...SETTLED, amountAtomic: '1' })).rejects.toThrow(
      SettlementMismatchError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('recordSponsorshipSettlement', () => {
  const SPONSOR_OFFER: SponsorshipOffer = {
    artistId: '3',
    artistUsername: 'artist',
    payTo: 'ArtistWallet11111111111111111111111111111',
    network: CONFIG.network,
    assetMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
    priceUsd: '0.10',
    amountAtomic: '100000',
  };

  beforeEach(() => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true, json: async () => ({ data: { id: 2 } }) }));
  });

  it('allows a null sponsor (anonymous sponsorship)', async () => {
    await expect(
      recordSponsorshipSettlement(CONFIG, SPONSOR_OFFER, null, {
        transactionSignature: 'sig-2',
        payTo: SPONSOR_OFFER.payTo,
        network: SPONSOR_OFFER.network,
        assetMint: SPONSOR_OFFER.assetMint,
        amountAtomic: SPONSOR_OFFER.amountAtomic,
      }),
    ).resolves.toEqual({ created: true });
  });

  it('rejects a network mismatch defensively before calling Strapi', async () => {
    const fetchMock = (globalThis as any).fetch as ReturnType<typeof vi.fn>;
    await expect(
      recordSponsorshipSettlement(CONFIG, SPONSOR_OFFER, null, {
        transactionSignature: 'sig-3',
        payTo: SPONSOR_OFFER.payTo,
        network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
        assetMint: SPONSOR_OFFER.assetMint,
        amountAtomic: SPONSOR_OFFER.amountAtomic,
      }),
    ).rejects.toThrow(SettlementMismatchError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

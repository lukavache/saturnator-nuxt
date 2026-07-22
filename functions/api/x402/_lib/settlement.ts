// Task 2.4: durable, idempotent settlement recording.
//
// Called from `onAfterSettle` only, i.e. only after the facilitator has
// already confirmed the on-chain payment matches the PaymentRequirements we
// issued. This module's job is narrower: (1) double-check the settled terms
// against our own resolved offer snapshot (defense in depth — see
// `settlement-validation.ts`), (2) derive the deterministic payment ID, and
// (3) call saturnator-api's API-token-gated, idempotent create endpoints.
//
// saturnator-api's controllers (`license-purchase`/`artist-sponsorship`)
// already collapse a duplicate `x402PaymentId`/`transactionSignature` into
// "return the existing record" (200) rather than creating a second row
// (201) — see saturnator-api Phase 2 controller wiring. This module simply
// has to call them; it must NOT attempt its own separate dedupe, since that
// would just be a second, potentially-inconsistent source of truth.
import type { X402Config } from './config';
import type { LicenseOffer, SponsorshipOffer } from './offers';
import { derivePaymentId } from './payment-id';
import { strapiFetch } from './strapi-client';
import { verifySettlementMatchesOffer, type SettledTerms } from './settlement-validation';

export interface SettledPaymentFacts {
  transactionSignature: string;
  payerWallet?: string;
  payTo: string;
  network: string;
  assetMint: string;
  amountAtomic: string;
}

export class SettlementMismatchError extends Error {
  constructor(public readonly reason: string) {
    super(`Settlement terms do not match the resolved offer: ${reason}`);
  }
}

function assertSettlementMatchesOffer(offer: SettledTerms, settled: SettledPaymentFacts) {
  const check = verifySettlementMatchesOffer(offer, {
    payTo: settled.payTo,
    network: settled.network,
    assetMint: settled.assetMint,
    amountAtomic: settled.amountAtomic,
  });
  if (!check.ok) throw new SettlementMismatchError(check.reason);
}

export async function recordLicenseSettlement(
  config: X402Config,
  offer: LicenseOffer,
  buyerId: number,
  settled: SettledPaymentFacts,
): Promise<{ created: boolean }> {
  assertSettlementMatchesOffer(offer, settled);

  const x402PaymentId = derivePaymentId({
    network: settled.network,
    transactionSignature: settled.transactionSignature,
    payTo: settled.payTo,
    amountAtomic: settled.amountAtomic,
    assetMint: settled.assetMint,
  });

  const response = await strapiFetch<{ data: { id: number } }>(config, '/api/license-purchases', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        buyer: buyerId,
        seller: offer.sellerId,
        track: Number(offer.trackId),
        buyerWalletAddress: settled.payerWallet ?? null,
        sellerWalletAddress: offer.payTo,
        network: offer.network,
        assetMint: offer.assetMint,
        amountAtomic: offer.amountAtomic,
        amountUsd: offer.priceUsd,
        transactionSignature: settled.transactionSignature,
        x402PaymentId,
        licenseType: offer.licenseType,
        licenseVersion: offer.licenseVersion,
        settledAt: new Date().toISOString(),
      },
    }),
  });

  return { created: Boolean(response?.data?.id) };
}

export async function recordSponsorshipSettlement(
  config: X402Config,
  offer: SponsorshipOffer,
  sponsorId: number | null,
  settled: SettledPaymentFacts,
): Promise<{ created: boolean }> {
  assertSettlementMatchesOffer(offer, settled);

  const x402PaymentId = derivePaymentId({
    network: settled.network,
    transactionSignature: settled.transactionSignature,
    payTo: settled.payTo,
    amountAtomic: settled.amountAtomic,
    assetMint: settled.assetMint,
  });

  const response = await strapiFetch<{ data: { id: number } }>(config, '/api/artist-sponsorships', {
    method: 'POST',
    body: JSON.stringify({
      data: {
        sponsor: sponsorId,
        artist: Number(offer.artistId),
        artistWalletAddress: offer.payTo,
        amountAtomic: offer.amountAtomic,
        amountUsd: offer.priceUsd,
        network: offer.network,
        transactionSignature: settled.transactionSignature,
        x402PaymentId,
        sponsoredAt: new Date().toISOString(),
      },
    }),
  });

  return { created: Boolean(response?.data?.id) };
}

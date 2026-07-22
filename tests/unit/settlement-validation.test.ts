import { describe, expect, it } from 'vitest';
import { verifySettlementMatchesOffer, type OfferSnapshot } from '../../functions/api/x402/_lib/settlement-validation';

const OFFER: OfferSnapshot = {
  payTo: 'ArtistWallet11111111111111111111111111111',
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  assetMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  amountAtomic: '100000',
};

describe('verifySettlementMatchesOffer', () => {
  it('accepts settlement terms that match the offer exactly', () => {
    expect(verifySettlementMatchesOffer(OFFER, { ...OFFER })).toEqual({ ok: true });
  });

  it('rejects a recipient mismatch (e.g. offer changed mid-flight)', () => {
    expect(verifySettlementMatchesOffer(OFFER, { ...OFFER, payTo: 'AttackerWallet111111111111111111111111111' })).toEqual({
      ok: false,
      reason: 'recipient_mismatch',
    });
  });

  it('rejects a network mismatch', () => {
    expect(
      verifySettlementMatchesOffer(OFFER, { ...OFFER, network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' }),
    ).toEqual({ ok: false, reason: 'network_mismatch' });
  });

  it('rejects an asset/mint mismatch', () => {
    expect(
      verifySettlementMatchesOffer(OFFER, { ...OFFER, assetMint: 'SomeOtherMint1111111111111111111111111111' }),
    ).toEqual({ ok: false, reason: 'asset_mismatch' });
  });

  it('rejects a price/amount mismatch', () => {
    expect(verifySettlementMatchesOffer(OFFER, { ...OFFER, amountAtomic: '1' })).toEqual({
      ok: false,
      reason: 'amount_mismatch',
    });
  });
});

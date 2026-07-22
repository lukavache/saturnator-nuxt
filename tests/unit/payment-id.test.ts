import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { derivePaymentId, type PaymentIdComponents } from '../../functions/api/x402/_lib/payment-id';

const BASE: PaymentIdComponents = {
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  transactionSignature: '5x7pZ...devnetSignature',
  payTo: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
  amountAtomic: '100000',
  assetMint: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
};

describe('derivePaymentId', () => {
  it('is deterministic for identical settlement facts (duplicate settlement guarantee)', () => {
    expect(derivePaymentId(BASE)).toBe(derivePaymentId({ ...BASE }));
  });

  it('produces a 64-char lowercase hex sha256 digest', () => {
    const id = derivePaymentId(BASE);
    expect(id).toMatch(/^[0-9a-f]{64}$/);
  });

  it('matches an independently computed sha256 of the canonical pipe-joined string', () => {
    const canonical = [BASE.network, BASE.transactionSignature, BASE.payTo, BASE.amountAtomic, BASE.assetMint].join('|');
    const expected = createHash('sha256').update(canonical, 'utf8').digest('hex');
    expect(derivePaymentId(BASE)).toBe(expected);
  });

  it('changes when the transaction signature changes', () => {
    expect(derivePaymentId(BASE)).not.toBe(derivePaymentId({ ...BASE, transactionSignature: 'different-sig' }));
  });

  it('changes when the recipient (payTo) changes', () => {
    expect(derivePaymentId(BASE)).not.toBe(
      derivePaymentId({ ...BASE, payTo: '11111111111111111111111111111111' }),
    );
  });

  it('changes when the amount changes', () => {
    expect(derivePaymentId(BASE)).not.toBe(derivePaymentId({ ...BASE, amountAtomic: '999999' }));
  });

  it('changes when the network changes', () => {
    expect(derivePaymentId(BASE)).not.toBe(
      derivePaymentId({ ...BASE, network: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' }),
    );
  });
});

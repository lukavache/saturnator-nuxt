// Deterministic x402 payment ID — MUST stay byte-for-byte identical to
// saturnator-api's `src/utils/payment-id.ts` (same field order, same
// separator, same SHA-256 hex encoding), since both sides derive the same
// ID independently and Strapi's `license-purchase`/`artist-sponsorship`
// idempotency is keyed on it. Uses `node:crypto` (available via the
// `nodejs_compat` Workers compatibility flag already required by @x402/*)
// so the hashing primitive matches saturnator-api's Node implementation.
import { createHash } from 'node:crypto';

export interface PaymentIdComponents {
  network: string;
  transactionSignature: string;
  payTo: string;
  amountAtomic: string;
  assetMint: string;
}

export function derivePaymentId(components: PaymentIdComponents): string {
  const canonical = [
    components.network,
    components.transactionSignature,
    components.payTo,
    components.amountAtomic,
    components.assetMint,
  ].join('|');

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

// Pure settlement-vs-offer consistency check (Task 2.4 guardrail):
// "Verify the settlement's network, recipient, asset mint, and amount
// match the server-resolved offer snapshot." Even though the facilitator
// only settles payments matching the PaymentRequirements we generated, the
// offer used to resolve those requirements can be a fresh re-fetch (e.g.
// the payTo/price cache entry expired) — so we still defensively re-check
// that the ultimately-settled terms match what our current offer snapshot
// says they should be before ever recording a purchase/sponsorship.
export interface OfferSnapshot {
  payTo: string;
  network: string;
  assetMint: string;
  amountAtomic: string;
}

export interface SettledTerms {
  payTo: string;
  network: string;
  assetMint: string;
  amountAtomic: string;
}

export type SettlementMismatchReason =
  | 'recipient_mismatch'
  | 'network_mismatch'
  | 'asset_mismatch'
  | 'amount_mismatch';

export type SettlementValidationResult =
  | { ok: true }
  | { ok: false; reason: SettlementMismatchReason };

export function verifySettlementMatchesOffer(
  offer: OfferSnapshot,
  settled: SettledTerms,
): SettlementValidationResult {
  if (offer.payTo !== settled.payTo) return { ok: false, reason: 'recipient_mismatch' };
  if (offer.network !== settled.network) return { ok: false, reason: 'network_mismatch' };
  if (offer.assetMint !== settled.assetMint) return { ok: false, reason: 'asset_mismatch' };
  if (offer.amountAtomic !== settled.amountAtomic) return { ok: false, reason: 'amount_mismatch' };
  return { ok: true };
}

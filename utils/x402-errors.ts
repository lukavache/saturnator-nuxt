/**
 * Map x402 / wallet / offer errors to actionable user copy (Phase 5).
 * Never surface stack traces.
 */

const CODE_MESSAGES: Record<string, string> = {
  unauthenticated: 'Sign in to continue, then retry the payment.',
  wallet_not_verified:
    'This artist has not linked a verified Solana payout wallet yet. Ask them to verify in Settings.',
  wallet_network_mismatch:
    'Artist wallet is on the wrong Solana network. Switch wallets/apps to Devnet and re-verify.',
  track_not_found: 'This track is no longer available. Refresh the catalog and try another.',
  artist_not_found: 'This artist is no longer available for sponsorship.',
  track_not_licensable: 'Licensing is not enabled for this track.',
  unsupported_network: 'Saturnator x402 currently supports Solana Devnet USDC only.',
  settlement_mismatch: 'Payment details did not match the offer. No entitlement was created — contact support with your Explorer tx.',
  attempt_expired: 'Payment settled but the session expired. Check Ownership / Spotlight before paying again.',
  rate_limited: 'Too many requests. Wait a moment and retry.',
  facilitator_unavailable: 'The payment facilitator is temporarily unavailable. Retry in a minute.',
  settlement_timeout: 'Settlement is taking longer than expected. Do not pay again — refresh ownership or Spotlight shortly.',
  pending_entitlement:
    'Payment confirmed on-chain; entitlement is still writing. We will keep checking — do not pay again.',
  duplicate_payment: 'This payment was already recorded. Refresh to see Owned / updated rank.',
  insufficient_funds: 'Insufficient Devnet USDC or SOL for fees. Use the Circle USDC and Solana SOL faucets, then retry.',
  wrong_network: 'Wallet is on the wrong network. Switch Phantom/Solflare to Solana Devnet and retry.',
  no_wallet: 'No Solana wallet found. Install Phantom or Solflare, unlock it, then retry.',
  signature_rejected: 'Wallet signature was rejected. Approve the request in your wallet to continue.',
  asset_removed: 'This asset was removed or unpublished during payment. Do not retry the same purchase.',
};

const PATTERN_MESSAGES: Array<{ re: RegExp; message: string }> = [
  { re: /no solana wallet|wallet not found|phantom|solflare/i, message: CODE_MESSAGES.no_wallet },
  { re: /user rejected|denied|cancelled|canceled/i, message: CODE_MESSAGES.signature_rejected },
  { re: /insufficient|not enough.*(sol|usdc)|0x1/i, message: CODE_MESSAGES.insufficient_funds },
  { re: /wrong network|devnet|mainnet-beta|cluster/i, message: CODE_MESSAGES.wrong_network },
  { re: /facilitator|fetch failed|502|503|ECONNREFUSED/i, message: CODE_MESSAGES.facilitator_unavailable },
  { re: /timeout|timed out/i, message: CODE_MESSAGES.settlement_timeout },
];

export function mapX402UserError(error: unknown, fallback = 'Something went wrong. Try again, or check your receipt before paying twice.'): string {
  if (!error) return fallback;

  const anyErr = error as { code?: string; error?: string; message?: string; status?: number };
  const code = anyErr.code || anyErr.error;
  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code];

  const message = String(anyErr.message || error || '');
  if (!message) return fallback;

  for (const { re, message: mapped } of PATTERN_MESSAGES) {
    if (re.test(message)) return mapped;
  }

  // Never dump stacks / huge JSON
  if (message.includes('\n') || message.length > 180) return fallback;
  return message;
}

export function userMessageForOfferCode(code: string): string {
  return CODE_MESSAGES[code] || CODE_MESSAGES.track_not_licensable;
}

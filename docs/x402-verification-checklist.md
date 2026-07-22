# Saturnator x402 — Verification Checklist (Phase 5.4)

Run repository equivalents of lint/typecheck/test/build, then walk the manual matrix.

## Automated (local)

```bash
# saturnator-web
cd saturnator-web
npm test
npm run typecheck
npm run probe:x402
npm run generate

# saturnator-api
cd saturnator-api
npm test
npm run typecheck
```

> Full Playwright wallet E2E is **manual** for this MVP (Phantom/Solflare cannot be reliably automated in CI without a funded Devnet wallet). Use the steps below in a clean browser profile.

## Manual Devnet matrix

1. Sign in (or use seed user `demo_nova_pulse` when `SEED_X402_DEMO=true`).
2. Artist: Settings → Connect Phantom/Solflare on **Devnet** → sign nonce → verified.
3. Artist: Upload / enable license at `$0.01`–`$0.10` USDC (seed includes **Neon Drift (Demo)** at `$0.01`).
4. Buyer: open track → free preview plays.
5. Buyer: Buy license → official x402 paywall → Phantom/Solflare.
6. Settlement confirms on Solana Devnet.
7. Receipt shows Explorer tx URL.
8. Download originals via gated HMAC URLs (short TTL).
9. Refresh → **Owned**; buy again must **not** charge.
10. Fan: Spotlight → Support artist → paywall → settle.
11. Rank changes **only after** settlement (spinner OK; no optimistic rank).
12. Organic likes/trending unchanged by sponsorship.
13. Repeat 4–11 on Cloudflare Pages preview (`nodejs_compat` on).

## Faucets

- SOL: https://faucet.solana.com/
- USDC (Circle test): https://faucet.circle.com/

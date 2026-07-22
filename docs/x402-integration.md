# Saturnator x402 — Integration Guide

Status: **Phases 0–5 complete** locally (`feature/x402-phase5`). Devnet-only; mainnet not enabled.

Canonical architecture map: [`x402-implementation-map.md`](./x402-implementation-map.md).  
Security review: [`x402-security-review.md`](./x402-security-review.md).  
Manual verification: [`x402-verification-checklist.md`](./x402-verification-checklist.md).

## Architecture and request flow

```
Browser (Phantom / Solflare)
   │  static Nuxt assets              │  same-origin /api/x402/*
   ▼                                  ▼
Cloudflare Pages (nuxt generate)   Pages Functions (Hono + @x402/* + nodejs_compat)
                                        │ validate Strapi JWT / auth-bridge cookie
                                        │ resolve offer (price + payTo) from Strapi
                                        │ 402 → facilitator settle → onAfterSettle
                                        ▼
                                   Strapi (saturnator-api): purchases, sponsorships,
                                   downloads (HMAC), Spotlight ranking
```

### License purchase flow
1. Buyer signs in (Strapi JWT in localStorage).
2. SPA `POST /api/x402/auth-bridge` → short-lived HttpOnly cookie.
3. Navigate to `GET /api/x402/license/:trackId` → unpaid request returns **402** with `payment-required`.
4. Official x402 HTML paywall / wallet pays **Devnet USDC** to the artist wallet from the server offer.
5. Facilitator settles → `onAfterSettle` writes idempotent `license-purchase`.
6. Handler returns receipt (Explorer URL + download proxy). Owned buyers get `grantAccess` (no second charge).

### Sponsorship / Spotlight flow
1. Logged-in fan opens `/spotlight` or track Support CTA.
2. `POST /api/x402/artists/:artistId/sponsor` (paywall) → settle → sponsorship row.
3. Receipt includes **post-settlement** rank only. Leaderboard: `GET /api/spotlight` (proxied at `/api/x402/spotlight`).

## Pinned package versions

| Package | Version |
|---|---|
| `@x402/core` | `2.19.0` |
| `@x402/svm` | `2.19.0` |
| `@x402/hono` | `2.19.0` |
| `hono` | `^4.12.31` |

Protocol: **x402 v2** · Network: **Solana Devnet** (`solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`) · Asset: **USDC**.

## Environment variables

### Pages Function (non-secret → `wrangler.toml [vars]`)
`X402_ENABLED`, `X402_NETWORK`, `X402_FACILITATOR_URL`, `X402_DEFAULT_RECEIVER` (health only),
`X402_LICENSE_MIN_USD`, `X402_SPOTLIGHT_PRICE_USD`, `X402_SPOTLIGHT_WINDOW_HOURS`,
`X402_SIGNED_DOWNLOAD_TTL_SECONDS`, `X402_CORS_ORIGINS`.

### Pages secrets (`.dev.vars` locally — never commit)
`STRAPI_URL`, `STRAPI_API_TOKEN`.

### Strapi
`LICENSE_DOWNLOAD_SECRET` (or fallback `APP_KEYS`), optional `SEED_X402_DEMO=true`,
`X402_SPOTLIGHT_WINDOW_HOURS`, `X402_SPOTLIGHT_PRICE_USD`.

## Devnet faucet setup

1. Install [Phantom](https://phantom.com/) or [Solflare](https://www.solflare.com/); switch to **Devnet**.
2. SOL: https://faucet.solana.com/
3. Test USDC: https://faucet.circle.com/
4. Facilitator: https://x402.org/facilitator

## Dynamic recipient / price resolution

- **License:** Strapi track must be `x402Enabled`, approved/published, with decimal `licensePriceUsd`.
  `payTo` = owner’s **verified** `payoutWalletAddress` on Devnet.
- **Sponsorship:** price from `X402_SPOTLIGHT_PRICE_USD`; `payTo` = artist user’s verified wallet.
- Browser-supplied price/`payTo` are **ignored**. Settlement is re-checked against the cached offer
  (`settlement-validation.ts`).

## Idempotency rules

- Unique constraints / lookup on `x402PaymentId` and `transactionSignature`.
- `decideIdempotentSettlement`: same ids → return existing; conflicting signature → 409.
- Spotlight ranks **settled** rows only (pending/failed never score).

## Reconcile paid-but-unrecorded settlement

See [`x402-security-review.md`](./x402-security-review.md#reconciliation-paid-but-unrecorded).
Structured logs include `requestId`, `trackId`/`artistId`, `transactionSignature`, status — never JWTs or full payment headers.

## Local demo seed

```bash
cd saturnator-api
SEED_X402_DEMO=true npm run develop
```

Creates 3 demo artists, ≥5 preview tracks, one **$0.01** licensable track (`Neon Drift (Demo)`).
Marked `x402-demo-local`. **No fabricated on-chain txs.** Example login: `demo_nova_pulse` / `DemoLocal!x402`.

## Observability and user-safe errors

- Every `/api/x402/*` response sets `x-request-id`.
- JSON logs via `functions/api/x402/_lib/logger.ts`.
- Isolate rate limits on license/sponsor/download/auth-bridge/spotlight.
- UI maps codes (no wallet, wrong network, insufficient funds, rejected signature, facilitator down, delayed entitlement) via `utils/x402-errors.ts`.

## Mainnet migration checklist (NOT enabled)

- [ ] Change `X402_NETWORK` to mainnet SVM id; USDC mint follows scheme defaults.
- [ ] Artists re-verify wallets on mainnet (`payoutWalletNetwork=mainnet`).
- [ ] Replace faucet docs; remove demo seed; rotate API tokens.
- [ ] Confirm facilitator production URL / fees.
- [ ] Legal / tax / ToS for paid licenses.
- [ ] Private object storage ACLs for paid originals.
- [ ] Edge WAF rate limits + monitoring alerts on `settlement_failed`.

**Do not enable mainnet until the above is complete.**

## Known limitations

- Official HTML paywall (not a custom Wallet Standard Vue modal).
- One license covers track + sample pack.
- `/uploads` may remain publicly reachable if URLs leak; downloads are ownership-gated.
- Isolate rate limits are not a global edge limit.
- Live wallet E2E is manual (see verification checklist).
- Organic likes stay separate from Spotlight score.

## Scripts

```bash
# web
npm test                 # Vitest
npm run typecheck        # tsc functions + nuxi typecheck
npm run probe:x402       # unpaid 402 smoke
npm run generate         # static build for Pages

# api
npm test
npm run typecheck
```

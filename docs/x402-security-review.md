# Saturnator x402 — Security Review Notes (Phase 5.3)

Status: reviewed against the Phase 5 checklist. Items marked **mitigated** are enforced in code; **known** items are documented limitations.

| Check | Status | Notes |
|---|---|---|
| Price / `payTo` never taken from browser | **Mitigated** | `offers.ts` resolves from Strapi/config; settlement validation rejects mismatched settle facts |
| Auth on purchase / download | **Mitigated** | JWT or auth-bridge cookie; download routes owner-scoped + HMAC file tokens |
| Originals private | **Known** | Delivery gated by ownership + TTL HMAC; Strapi `/uploads` may still be public if URL is leaked — Spaces private ACL is a follow-up |
| Signed URLs expire | **Mitigated** | `X402_SIGNED_DOWNLOAD_TTL_SECONDS` (default 60s) |
| Payment / tx IDs unique + replay safe | **Mitigated** | Unique `x402PaymentId` + `transactionSignature`; `decideIdempotentSettlement` |
| Facilitator settlement cache not bypassed | **Mitigated** | Official `@x402` HTTPFacilitatorClient + middleware |
| CORS exposes payment headers only where needed | **Mitigated** | Pages Function CORS; `X402_CORS_ORIGINS` allowlist |
| Rate limits | **Mitigated (isolate)** | In-function sliding window; add Cloudflare WAF for edge-wide limits |
| No secrets / full payment headers in logs | **Mitigated** | Structured `x402Log` redacts Authorization / payment headers |
| CSP for wallet/paywall | **Mitigated** | `public/_headers` allows x402 + wallet connect targets |

## Reconciliation (paid but unrecorded)

1. Find `transactionSignature` in Explorer (Devnet).
2. Search Cloudflare logs for `settlement_failed` / `missing_offer_attempt` JSON lines (`paymentId` / `trackId` / `artistId`).
3. Replay settlement into Strapi via API token `POST /api/license-purchases` or `/api/artist-sponsorships` with the same `x402PaymentId` + signature (idempotent).
4. Never ask the user to pay again until ownership/Spotlight confirms absence of a settled row.

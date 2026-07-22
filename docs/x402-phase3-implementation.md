# Saturnator x402 — Phase 3 Implementation (paid sample/track licensing)

Status: **Phase 3 complete** locally. Branches: `feature/x402-phase3` on both
`saturnator-web` and `saturnator-api`. Not pushed.

## What shipped

### Task 3.1 — Protected license purchase route (hardened)
- Existing `GET /api/x402/license/:trackId` now:
  - Uses `x402HTTPResourceServer.onProtectedRequest` to **grantAccess** when the
    buyer already has a settled purchase (no second charge).
  - Returns a full **receipt** (`purchaseId`, license meta, `transactionSignature`,
    Solana Explorer URL, same-origin `downloadUrl`) after settlement or on owned skip.
  - Supports JWT via `Authorization` **or** short-lived HttpOnly cookie set by
    `POST /api/x402/auth-bridge` (so the official x402 HTML paywall can authenticate
    after the SPA stores the JWT in localStorage).

### Task 3.2 — Secure download
- **saturnator-api**
  - `GET /api/license-purchases/for-track/:trackId` — ownership lookup
  - `GET /api/license-purchases/:id/download` — owner-only; mints short-lived HMAC file tokens
  - `GET /api/license-downloads/:token` — streams one file (`Content-Disposition: attachment`,
    `Cache-Control: private, no-store`); re-checks purchase + file membership
- **saturnator-web**
  - `GET /api/x402/licenses/:purchaseId/download` — same-origin proxy that forwards the
    buyer JWT to Strapi and returns the signed file list (never logs URLs)

HMAC utility: `saturnator-api/src/utils/download-token.ts` (secret from
`LICENSE_DOWNLOAD_SECRET` or fallback `APP_KEYS`).

### Task 3.3 — Artist upload UI
- `pages/upload.vue`: toggle **Sell licenses with Solana USDC**, price (D.DD), license type,
  wallet-verified gate with link to Settings.
- Backend lifecycle still rejects `x402Enabled` without a verified payout wallet.

### Task 3.3/3.4 — Wallet verification UI
- `pages/settings.vue`: Connect Phantom/Solflare → sign nonce challenge →
  `POST /api/wallet-verification/generate|verify`. Never requests private keys.

### Task 3.4 — Buyer UI
- `components/payments/LicensePurchaseButton.vue` + `PaymentReceiptModal.vue`
- Wired into `pages/track/[id].vue`
- Flow: Preview (free audio) → Sign in → Buy license (official paywall) → Owned · Download / Receipt
- `stores/license.ts` owns ownership check, paywall session, download bundle fetch

## Tests
- saturnator-api: 26 Jest tests (includes download-token)
- saturnator-web: Vitest receipt builder + prior Phase 2 suite
- `tsc -p functions/tsconfig.json --noEmit` clean

## Known limitations / follow-ups
- Live Devnet settlement still needs a real wallet + USDC (Phase 5 demo).
- Storage remains the Strapi **local** provider; downloads are **gated by ownership + TTL
  tokens**, not by making the `/uploads` tree private. Wiring Spaces + private ACLs is a
  follow-up when DO Spaces is enabled in `plugins.ts`.
- No separate track **edit** page yet (`/track/:id/edit` is linked from uploads but missing);
  licensing fields are on **upload** for MVP.
- Preview `<audio>` still uses public media URLs (by design for free preview).

## Scope cuts applied (per plan)
- Official x402 HTML paywall (not a custom Wallet Standard Vue payment modal).
- One license covers track + sample pack (no per-sample marketplace).

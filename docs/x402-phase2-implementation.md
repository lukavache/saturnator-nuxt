# Saturnator x402 — Phase 2 Implementation (shared x402 server module)

Status: **Phase 2 complete**, verified locally end-to-end against a real (throwaway) Strapi
instance and the real `x402.org` facilitator's unpaid-request path. Not deployed. Branch:
`feature/x402-phase2` (saturnator-web), `feature/x402-phase2` (saturnator-api, small wiring fix
only — see "saturnator-api change" below).

## Scope recap

Phase 2 = Task 2.1–2.4 from the plan, entirely inside `saturnator-web`'s Cloudflare Pages
Functions (`functions/api/x402/`). No `@x402/*` packages were added to `saturnator-api`. No
Nuxt SSR conversion. No new UI.

## Files added (`saturnator-web/functions/api/x402/_lib/`)

| File | Responsibility |
|---|---|
| `types.ts` | `Env` bindings (non-secret vars + `STRAPI_URL`/`STRAPI_API_TOKEN` secrets). |
| `config.ts` | Task 2.1 — validated runtime config. Throws `X402ConfigError` (fail-fast, HTTP 500 with a clear message) if x402 is enabled and any required value is missing/malformed. |
| `x402-server.ts` | Task 2.2 — one `x402ResourceServer`/`HTTPFacilitatorClient` singleton per isolate, `ExactSvmScheme` registered once, `onAfterSettle` registered once (`buildOnAfterSettleHook`, exported standalone for unit testing). |
| `route-params.ts` | Pure `:param` extraction from `(routePattern, path)` — the x402 SDK's dynamic `payTo`/`price` hooks only receive `HTTPRequestContext` (`path`, `method`, `routePattern`, `paymentHeader`, `adapter`), **no** parsed framework params (confirmed by reading `@x402/core`'s `.d.ts`). |
| `attempt-resolution.ts` | Ties offer resolution + buyer/sponsor identity (Strapi JWT, read via `context.adapter.getHeader('authorization')`) into one cached-per-attempt resolution, keyed by the request's `X-PAYMENT` header value. |
| `offer-cache.ts` | Per-attempt, TTL + size-capped in-memory cache (60s / 200 entries) so `payTo`, `price`, `onAfterSettle`, and the final route handler all observe **one** resolved offer snapshot per payment attempt — never re-querying Strapi mid-flight. |
| `offers.ts` | Task 2.3 — `getLicenseOffer(trackId)` / `getSponsorshipOffer(artistId)`. Loads from Strapi via the API token, enforces `trackStatus==='approved'`, `x402Enabled`, verified payout wallet + matching network; never trusts client-supplied price/payTo. |
| `money.ts` | Decimal-safe (`BigInt`, no floats) USD → atomic USDC (6-decimal) conversion. |
| `settlement-validation.ts` | Pure `verifySettlementMatchesOffer()` — defense-in-depth recipient/network/asset/amount check between the resolved offer and the actually-settled terms. |
| `settlement.ts` | Task 2.4 — `recordLicenseSettlement` / `recordSponsorshipSettlement`: derive the deterministic `x402PaymentId`, then POST to saturnator-api's (now-idempotent) `license-purchases` / `artist-sponsorships` endpoints via the scoped API token. |
| `payment-id.ts` | `derivePaymentId()` — **byte-for-byte identical algorithm** to `saturnator-api/src/utils/payment-id.ts` (same field order/separator, SHA-256 hex via `node:crypto`, available through `nodejs_compat`). Both sides derive the same ID independently. |
| `strapi-client.ts` | Thin fetch wrapper (`strapiFetch`, `verifyStrapiJwt`) using the scoped API token / a caller-supplied JWT respectively. |

`functions/api/x402/[[route]].ts` was rewritten to:
- keep the Phase 0.5 `GET /api/x402/health` smoke-test route unchanged in behavior,
- add `GET /api/x402/license/:trackId` (dynamic `payTo`/`price` via `resolveLicenseAttempt`),
- add `POST /api/x402/sponsor/:artistId` (dynamic `payTo`/`price` via `resolveSponsorshipAttempt`, fixed `X402_SPOTLIGHT_PRICE_USD`),
- add `app.onError(...)` mapping `OfferResolutionError` / `SettlementMismatchError` / `StrapiRequestError` to clean 401/404/409/502 JSON responses instead of a generic 500,
- share one `x402ResourceServer` (via `getX402Server`) across all three routes.

`functions/tsconfig.json` — new, standalone `tsc --noEmit` config for the Pages Functions tree (the root `tsconfig.json` only covers the Nuxt app via `.nuxt/tsconfig.json` and does not include `functions/`).

## Key design decisions / SDK findings

1. **No framework params in dynamic hooks.** `DynamicPayTo`/`DynamicPrice` receive
   `HTTPRequestContext = { adapter, path, method, paymentHeader?, routePattern? }` — confirmed by
   reading `@x402/core`'s shipped `.d.ts`, not assumed. `:trackId`/`:artistId` are recovered by
   diffing `routePattern` against `path` (`route-params.ts`).
2. **Reading the buyer's Strapi JWT inside a dynamic hook.** `HTTPRequestContext.adapter` is the
   real `HonoAdapter`, which has `getHeader(name)`. This is how `attempt-resolution.ts` reads
   `Authorization: Bearer <jwt>` from inside `payTo`/`price`.
3. **One resolution per payment attempt, shared by 3 call sites.** `payTo`, `price`, and
   `onAfterSettle` (and the final route handler) all need the *same* resolved offer + buyer/sponsor
   identity so a price/wallet change mid-flight can't be exploited and Strapi isn't hit 3-4×. Cached
   by `paymentHeader` (unique per attempt); `onAfterSettle` peeks (doesn't evict, since the
   downstream handler still needs it to render its response); the handler consumes (evicts) it.
4. **`onAfterSettle` cannot shape an HTTP response.** Business-rule failures inside `payTo`/`price`
   (not found, not licensable, unauthenticated, wallet unverified) throw a typed
   `OfferResolutionError`; `app.onError` in `[[route]].ts` maps these to specific status codes.
5. **`saturnator-api`'s idempotent settlement services were never wired to their HTTP routes.**
   Phase 1 built `recordSettledPurchase`/`recordSettledSponsorship` but the `POST` routes still used
   Strapi's default `create` action (raw insert — would hard-fail on the second identical settlement
   instead of returning the existing record). This is a **necessary, small saturnator-api change**
   (below), explicitly deferred to Phase 2 in the Phase 1 controller comments themselves
   ("Intended for a future trusted internal caller ... Phase 2+").

## saturnator-api change (small, targeted — branch `feature/x402-phase2`)

No new dependencies, no schema changes, no `@x402/*` packages. Two controllers rewritten to call
the existing idempotent services instead of the default `create` action:

- `src/api/license-purchase/controllers/license-purchase.ts`
- `src/api/artist-sponsorship/controllers/artist-sponsorship.ts`

Behavior: validates required fields → calls `recordSettledPurchase`/`recordSettledSponsorship` →
`201` on first insert, `200` on an idempotent replay (same `x402PaymentId`), `409` on a genuine
conflict (same `transactionSignature` under a *different* `x402PaymentId` — logged via
`strapi.log.error`). Routes/policies (API-token-only writes, owner-scoped reads) are untouched.

## Tests (`saturnator-web/tests/unit/`, Vitest — new to this repo)

48 tests across 8 files, all pure/mocked (no live network):

| File | Covers |
|---|---|
| `route-params.test.ts` | `:param` extraction incl. encoding, mismatches, static-only routes |
| `payment-id.test.ts` | Determinism, 64-char hex sha256, sensitivity to each field, matches an independently-computed hash |
| `money.test.ts` | Decimal→atomic USDC conversion (incl. bounds), malformed-input rejection |
| `settlement-validation.test.ts` | Match / recipient / network / asset / amount mismatch |
| `config.test.ts` | Valid config, disabled-skips-validation, each fail-fast case (Task 2.1) |
| `offer-cache.test.ts` | Peek vs. consume semantics, no-op on undefined key, no cross-key leakage |
| `settlement.test.ts` | Deterministic payment ID on duplicate calls, **mismatch rejected before calling Strapi** |
| `x402-onAfterSettle.test.ts` | **Task 2.4 required scenarios:** failed settlement records nothing; success records once; a duplicate callback calls through with the *same* payment ID (server-side dedupe → one row); recipient mismatch rejected + alerted (no persistence); price mismatch rejected + alerted; no cached attempt logs a warning and persists nothing |

Run: `npm run test` (added script, `vitest run`).

```
Test Files  8 passed (8)
     Tests  48 passed (48)
```

`saturnator-api`: existing Phase 1 suite still green after the controller change —
`Test Suites: 5 passed, Tests: 22 passed`; `tsc --noEmit` clean.

## Local end-to-end verification (real Strapi instance, real facilitator, no on-chain payment)

Booted an isolated Strapi (throwaway SQLite, port 1339) seeded with: a verified-wallet seller, a
licensable track (`x402Enabled=true`, `licensePriceUsd="0.10"`), a non-licensable track
(`x402Enabled=false`), and a buyer with a real JWT from `/api/auth/local`. Ran
`wrangler pages dev` against `.output/public` with `.dev.vars` pointed at that instance.

| Request | Result |
|---|---|
| `GET /api/x402/health` (regression) | `402`, `payment-required` header decodes to `x402Version:2`, Devnet, static `payTo`/`$0.001` — **unchanged from Phase 0.5** |
| `GET /api/x402/license/:trackId`, valid buyer JWT, licensable track | `402`; decoded `accepts[0]` = `{ network: solana:Etw...(devnet), amount: "100000" ($0.10 in atomic USDC), asset: <USDC devnet mint>, payTo: <seller's seeded payoutWalletAddress> }` — **dynamic resolution confirmed correct** |
| `GET /api/x402/license/:trackId`, no `Authorization` header | `401 {"error":"unauthenticated", ...}` |
| `GET /api/x402/license/:trackId`, valid JWT, `x402Enabled=false` track | `409 {"error":"track_not_licensable", ...}` |
| `GET /api/x402/license/does-not-exist`, valid JWT | `404 {"error":"track_not_found", ...}` |
| `POST /api/x402/sponsor/:artistId`, anonymous | `402`; decoded `accepts[0].amount = "100000"` (fixed `$0.10` Spotlight price), `payTo` = artist's verified wallet |
| `POST /api/x402/sponsor/999999` (unknown artist) | `404 {"error":"artist_not_found", ...}` |
| `POST /api/license-purchases` (saturnator-api, API token) ×2 identical | 1st → `201 Created`; 2nd (same `x402PaymentId`/`transactionSignature`) → `200 OK`; row count stayed **1** |
| `POST /api/license-purchases`, same `transactionSignature` + different `x402PaymentId` | `409 Conflict` |
| `POST /api/license-purchases` as an authenticated (non-API-token) user, or anonymous | `403 Forbidden` — Phase 1 policies still enforced, unaffected by the controller change |
| `npm run probe:x402` (Phase 0/0.5 official regression) | `=== RESULT === ALL PASS` (all 9 checks) |

**Not verified in Phase 2** (requires a real signed Devnet USDC transfer + wallet, explicitly
Phase 3+ territory): the *paid* retry with a real `X-PAYMENT` header, a real facilitator
settlement, and the resulting `onAfterSettle` write with a genuine transaction signature. The
`onAfterSettle` hook itself, the mismatch guardrails, and the idempotent write path are covered by
the unit tests above and by the direct `POST /api/license-purchases` end-to-end check.

## Environment variables (now wired, `wrangler.toml` + `.dev.vars`)

Non-secret (`wrangler.toml [vars]`): `X402_ENABLED`, `X402_NETWORK`, `X402_FACILITATOR_URL`,
`X402_DEFAULT_RECEIVER`, `X402_LICENSE_MIN_USD`, `X402_SPOTLIGHT_PRICE_USD`,
`X402_SPOTLIGHT_WINDOW_HOURS`, `X402_SIGNED_DOWNLOAD_TTL_SECONDS`.

Secrets (local: `.dev.vars`, gitignored, template in `.dev.vars.example`; deployed:
`wrangler pages secret put`): `STRAPI_URL`, `STRAPI_API_TOKEN` (a Strapi **Full access** API
token — see `.dev.vars.example` for how to mint one).

## Known deviations / follow-ups for Phase 3+

- License purchase route currently returns license terms only, no signed download URL —
  explicitly Phase 3 scope ("paid sample/track licensing" / private storage authorization).
- Sponsorship route has no leaderboard read endpoint yet — Phase 4 scope.
- `X402_DEFAULT_RECEIVER` (Phase 0.5) happens to be set to the USDC Devnet mint address, not a
  distinct wallet. Harmless for the `/health` smoke test (payment is never actually completed
  against it), but worth pointing a real second Devnet wallet at it before a live demo of the
  health-check payment path specifically.
- Buyer JWT verification does a live `GET /api/users/me` call to Strapi per payment attempt
  (cached only within the attempt). Acceptable at hackathon scale; would want a short local JWT
  verification (shared secret) if Strapi latency becomes an issue.

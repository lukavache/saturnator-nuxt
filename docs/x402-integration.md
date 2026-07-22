# Saturnator x402 — Integration Notes (Phase 0)

Status: **Phase 0 / 0.5** (Cloudflare Pages Functions runtime validated; no product code integrated).

## Pinned SDK versions (exact, from `saturnator-web/package.json` + lockfile)

| Package | Version | Purpose |
|---|---|---|
| `@x402/core` | `2.19.0` | `x402ResourceServer`, `HTTPFacilitatorClient`, types (protocol **v2**) |
| `@x402/svm` | `2.19.0` | `ExactSvmScheme` (Solana / SVM `exact` scheme) |
| `@x402/hono` | `2.19.0` | `paymentMiddleware`, Hono adapter (Fetch-native) |
| `hono` | `4.12.31` | Fetch-native sub-app runtime (Cloudflare/Workers-compatible) |

Source of truth for the API surface (read from the installed packages, not memory):
- `@x402/hono` README + `dist/cjs/index.d.ts` → `paymentMiddleware(routes, server, paywallConfig?, paywall?, syncFacilitatorOnStart?)`
- `@x402/core/server` exports `HTTPFacilitatorClient`, `x402ResourceServer`, `x402HTTPResourceServer`
- `@x402/svm/exact/server` exports `ExactSvmScheme`, `registerExactSvmScheme`
- Upstream: <https://github.com/x402-foundation/x402> (v2 line). npm dist-tag `latest = 2.19.0` for the `@x402/*` scope.

> Note: the legacy unscoped `x402` / `x402-hono` packages are still at `1.2.0` (v1). We deliberately use the scoped `@x402/*` v2 packages per the plan's non-negotiable guardrail.

## Confirmed capabilities (Phase 0 probe)

- Solana `ExactSvmScheme` registers against `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1` (Devnet). ✔
- Live test facilitator `https://x402.org/facilitator` returns supported kinds and a `feePayer`. ✔
- `resourceServer.initialize()` **must** be awaited before serving (otherwise: "Facilitator does not support exact on solana:…"). The Hono middleware also accepts `syncFacilitatorOnStart` (default `true`) to do this automatically.
- 402 response carries requirements in the **`payment-required`** response header (base64-encoded JSON), body is `{}` for JSON clients.

### Still to confirm in later phases (not required for Phase 0)
- Dynamic `payTo(context)` / `price(context)` functions resolving the route `:id` against Strapi.
- `x402ResourceServer.onAfterSettle(...)` field shapes (`SettleResultContext`) — inspect pinned types before use.
- Browser paywall / Wallet Standard signer with Phantom/Solflare.

## Runtime-compatibility decision (FINALIZED — Phase 0.5)

**Chosen: Hono in Cloudflare Pages Functions under `/api/x402/*`, with a static Nuxt site.**

- Nuxt stays statically generated (`nuxt generate` → `.output/public`). No SSR conversion.
- Hono is **not** mounted in Strapi/Koa. `saturnator-api` is untouched.
- The Pages Function runs on the Workers runtime with `nodejs_compat` (required: `@x402/*`
  and Solana web3 use `Buffer`/`crypto`/node builtins).
- Same-origin routing: `/api/x402/*` is served by the Function; everything else is a static asset.

### Files
- `functions/api/x402/[[route]].ts` — Hono catch-all app (`basePath('/api/x402')`),
  `paymentMiddleware` + `ExactSvmScheme`, CORS exposing `payment-required` / `payment-response`.
- `wrangler.toml` — `pages_build_output_dir=.output/public`, `compatibility_flags=["nodejs_compat"]`,
  non-secret `[vars]` for x402 config.
- `x402-probe/probe.mjs` — HTTP assertion (kept as a regression/smoke test).
- `x402-probe/run-pages-probe.mjs` — boots `wrangler pages dev`, runs the probe, tears down.

### Verified locally (`wrangler pages dev`)
```
[wrangler:info] Ready on http://127.0.0.1:8788
[wrangler:info] GET /api/x402/health 402 Payment Required
access-control-expose-headers: payment-required,payment-response,x-payment-response
payment-required (base64) -> { x402Version:2, accepts:[{ scheme:exact,
   network:solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1, amount:1000,
   payTo:4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU, extra:{ feePayer } }] }
=== RESULT === ALL PASS
```
Note: the populated `PAYMENT-RESPONSE` header only appears after a **settled** payment
(the `payment-verified` path). Phase 0.5 confirms it is registered in
`Access-Control-Expose-Headers` so it will be readable through Cloudflare; producing a real
value requires a signed Devnet payment (Phase 3+).

### Cloudflare routing / deployment implications
- Cloudflare Pages auto-detects the repo-root `functions/` dir and compiles it; the site
  build output stays `.output/public`. In the Pages project settings: build command
  `npm run generate`, output dir `.output/public`.
- `nodejs_compat` must also be set on the deployed Pages project (via `wrangler.toml`
  committed here, or the dashboard **Settings → Functions → Compatibility flags**).
- Secrets for later phases (`STRAPI_API_TOKEN`, etc.) go in **Pages → Settings → Environment
  variables/secrets** or `wrangler pages secret put` — never in `wrangler.toml`.
- Because `/api/x402/*` is same-origin with the site, the browser wallet flow avoids
  cross-origin CORS issues with Strapi (which stays on Render).

## npm scripts
- `npm run generate` — static Nuxt build (unchanged).
- `npm run pages:dev` — `wrangler pages dev` (serves static site + Functions locally).
- `npm run probe:x402` — boots `wrangler pages dev`, runs the smoke test, exits 0/1.

## Environment variables (planned, not yet added)

Server-only (never `NUXT_PUBLIC_`): `X402_ENABLED`, `X402_NETWORK`, `X402_FACILITATOR_URL`,
`X402_DEFAULT_RECEIVER`, `X402_LICENSE_MIN_USD`, `X402_SPOTLIGHT_PRICE_USD`,
`X402_SPOTLIGHT_WINDOW_HOURS`, `X402_SIGNED_DOWNLOAD_TTL_SECONDS`.

## Phase 0/0.5 probe (kept as a regression/smoke test)

```bash
cd saturnator-web
npm run probe:x402                 # boots wrangler pages dev + asserts, self-contained
# or, against an already-running `npm run pages:dev`:
node x402-probe/probe.mjs http://127.0.0.1:8788/api/x402/health
```

Do **not** delete these files — they are the x402 runtime regression check.

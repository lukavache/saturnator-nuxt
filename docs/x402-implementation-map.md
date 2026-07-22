# Saturnator x402 — Implementation Map (Phase 0 / 0.5 / 1 / 2)

Read-only audit of the real repository (Phase 0), corrected to the actual
Cloudflare Pages Functions + Strapi split architecture (Phase 0.5), extended with the
`saturnator-api` domain model (Phase 1), and the shared x402 server module
(Phase 2). See `docs/x402-phase2-implementation.md` and
`saturnator-api/docs/x402-phase1-implementation.md` for full phase reports.

## Finalized architecture (Phase 0.5 decision)

```
Browser (Phantom/Solflare)
   │  static assets                    │  /api/x402/*  (same origin)
   ▼                                   ▼
Cloudflare Pages (static Nuxt)   Cloudflare Pages Functions (Hono + @x402/*)
   .output/public                  functions/api/x402/[[route]].ts
                                        │ validate user JWT ─────────────┐
                                        │ scoped Strapi API token ───────┤
                                        ▼                                ▼
                                   x402 facilitator (Solana)      Strapi on Render
                                   https://x402.org/facilitator   (auth, CMS, DB, storage)
```

- Nuxt is **NOT** converted to SSR. It stays `nuxt generate` → `.output/public`.
- All x402 server logic runs in **Cloudflare Pages Functions** (Workers runtime + `nodejs_compat`) under `/api/x402/*`, same origin as the site.
- Hono is **NOT** mounted inside Strapi/Koa. `saturnator-api` remains untouched and owns auth, CMS, database, and storage.
- The Pages Function will (Phase 1+) validate end-user JWTs by calling Strapi, and use a **scoped server-side Strapi API token** (a Pages secret, never committed) for internal offer/settlement operations.

## Repository shape (IMPORTANT deviation from plan assumptions)

The plan assumes **one** Nuxt/Nitro app that also owns the CMS/database. Reality is a
**two-repository split**, and neither is a git repo at the workspace root:

| Repo dir | Role | Stack | Deploy target | Git branch |
|---|---|---|---|---|
| `saturnator-web/` | Frontend (Nuxt SPA) | Nuxt 3.17.5 / Nitro 2.11.12 / Vue 3 / Pinia / Tailwind | **Cloudflare Pages** (`saturnator.pages.dev`) | `development` (also `main`) |
| `saturnator-api/` | CMS + DB + auth + storage | Strapi 5.14.0 (Koa) / PostgreSQL (`pg`) | **Render** (`saturnator-strapi.onrender.com`) | `development` (also `main`) |
| `UI/` | Static design assets only | — | — | not a repo |

- Package manager: **npm** (both repos use `package-lock.json`). The plan's `pnpm` commands must be read as `npm`.
- Node: local `v20.19.2`; Strapi `engines.node` = `>=18 <=22`.
- There is **no** `wrangler.toml`, no `.github/workflows`, no Nitro `preset` override, no `netlify.toml`/`vercel.json` anywhere. Cloudflare Pages is inferred from the Strapi CSP/CORS allowlist (`https://saturnator.pages.dev`) and the frontend `.env`.

## Required Phase 0 table

| Concern | Existing path (real) | Reuse/extend decision |
|---|---|---|
| Auth session | `saturnator-web/stores/auth.ts` + `plugins/auth.client.ts` + `middleware/auth.ts`; backend `saturnator-api/config/plugins.ts` (users-permissions, JWT 7d) | **Client-side Strapi JWT in localStorage** — no server session exists. x402 server routes must validate the Strapi JWT server-side (`GET /api/users/me` with the bearer token). |
| Visibility / moderation | Strapi `draftAndPublish` + `track.trackStatus` enum (`pending`/`approved`/`rejected`) in `saturnator-api/src/api/track/content-types/track/schema.json`; Strapi role permissions | **No Nuxt-side visibility middleware exists.** Enforce via Strapi (publishedAt + trackStatus + owner) inside the offer resolver before building payment requirements. |
| Database / CMS | Strapi at `saturnator-api/` (`config/database.ts`, Postgres in prod). Content types under `saturnator-api/src/api/*` | Add new collections through **Strapi content-types + `database/migrations/`** (the existing migration mechanism). Do **not** add a second DB. |
| Original audio storage | `saturnator-api/config/plugins.ts` `upload.provider = 'local'` (public `/uploads`); `.env` also carries DigitalOcean Spaces keys (`DO_SPACE_*`) + `@strapi/provider-upload-aws-s3` installed | **Currently fully public** (public URL prepended in UI via `assetUrl`). Paid originals need a new private-delivery path (signed URL / stream); this is net-new work. |
| Track / sample model | `saturnator-api/src/api/track/**` | A "sample" is **not** a separate entity — it's `track.samples` (multiple media). "Track" = the collection. License fields attach to `track`. |
| Artist model | `saturnator-api/src/api/artist/**` (name, bio, image, socialLinks, `user` oneToOne). Note: `track` relates to `users_permissions_user`, **not** to `artist`. | Payout wallet attaches to the **user** (the owner tracks/likes point at), not the `artist` content type. |
| Track detail page | `saturnator-web/pages/track/[id].vue` (plain `<audio>` playback via public URL) | Add "Buy License" action + receipt UI here. Preview keeps the existing free `<audio>`. |
| Track list card | `saturnator-web/pages/index.vue`, `components/LikeButton.vue` | Reuse for buyer states; no dedicated card component exists yet. |
| Likes (organic) | `saturnator-api/src/api/like/**`, `saturnator-web/stores/like.ts` | Keep separate; paid Spotlight score must not touch this. |
| Upload flow | `saturnator-web/pages/upload.vue` + `stores/upload.ts` (client → Strapi `/upload` then `/tracks`) | Add license toggle/price/wallet UI here. `routeRules['/upload'].ssr=false`. |
| API route pattern | **None in Nuxt** — `saturnator-web/server/` only has `tsconfig.json`. All data access is client-side `useStrapiClient()`. | x402 lives in **Cloudflare Pages Functions** (`saturnator-web/functions/api/x402/*`, Hono). Nuxt stays static; no Nitro server routes are used. |
| Runtime config | `saturnator-web/nuxt.config.ts` `runtimeConfig.public.apiBase`; `.env` `STRAPI_URL` | Extend with x402 server-only config (never `NUXT_PUBLIC_` for secrets). |
| Tests | **None** — no Vitest/Playwright/Jest config or test files in either repo | Test harness is net-new work (plan assumes existing tests). |
| Deployment runtime | Nuxt built as **static** (`nuxt generate` → `.output/public`) → Cloudflare Pages; Strapi → Render (Node) | **RESOLVED (Phase 0.5):** keep static Nuxt; run x402 in **Cloudflare Pages Functions** (Workers runtime, `nodejs_compat`). Verified via `wrangler pages dev`. |
| Stripe / cart / download models | **Do not exist** anywhere in either repo | The plan's "keep Stripe as fallback / do not remove Stripe" guardrail is **moot**. |

## Path substitutions for `ADAPT_TO_REPO` used later in the plan

| Plan placeholder | Real path |
|---|---|
| user/artist model | `saturnator-api/src/extensions/users-permissions/content-types/user/schema.json` (+ `src/api/artist/...`) |
| sample/track entity | `saturnator-api/src/api/track/content-types/track/schema.json` |
| migration mechanism | `saturnator-api/database/migrations/` + Strapi content-type schemas |
| runtime config | `saturnator-web/nuxt.config.ts` (`runtimeConfig`) + `saturnator-web/.env` |
| `server/utils/x402.ts` | `saturnator-web/functions/api/x402/_lib/x402-server.ts` (singleton + `onAfterSettle`) |
| `server/services/x402-offers.ts` | `saturnator-web/functions/api/x402/_lib/offers.ts` (`getLicenseOffer`, `getSponsorshipOffer`) |
| `server/services/*` (settlement) | `saturnator-web/functions/api/x402/_lib/settlement.ts` + `payment-id.ts` + `settlement-validation.ts` |
| upload/edit UI | `saturnator-web/pages/upload.vue`, `saturnator-web/stores/upload.ts` |
| track detail/cards | `saturnator-web/pages/track/[id].vue`, `saturnator-web/pages/index.vue` |

## Phase 1 additions (`saturnator-api`)

| Concern | Real path |
|---|---|
| Payout wallet fields | `saturnator-api/src/extensions/users-permissions/content-types/user/schema.json` |
| Wallet verification nonce | `saturnator-api/src/api/wallet-verification-nonce/**` |
| Track licensing fields | `saturnator-api/src/api/track/content-types/track/schema.json` (+ `lifecycles.ts`) |
| License purchase record | `saturnator-api/src/api/license-purchase/**` |
| Artist sponsorship record | `saturnator-api/src/api/artist-sponsorship/**` |
| Access-control policies | `saturnator-api/src/policies/{is-api-token,scope-to-owner,enforce-owner}.ts` |

## Phase 2 additions (`saturnator-web`)

| Concern | Real path |
|---|---|
| Runtime config (Task 2.1) | `saturnator-web/functions/api/x402/_lib/config.ts` |
| Resource server singleton (Task 2.2) | `saturnator-web/functions/api/x402/_lib/x402-server.ts` |
| Dynamic offer resolution (Task 2.3) | `saturnator-web/functions/api/x402/_lib/offers.ts`, `attempt-resolution.ts`, `route-params.ts`, `offer-cache.ts` |
| Idempotent settlement recording (Task 2.4) | `saturnator-web/functions/api/x402/_lib/settlement.ts`, `payment-id.ts`, `settlement-validation.ts` |
| Routes | `saturnator-web/functions/api/x402/[[route]].ts` (`GET /health`, `GET /license/:trackId`, `POST /sponsor/:artistId`) |
| saturnator-api wiring fix (idempotent `create`) | `saturnator-api/src/api/{license-purchase,artist-sponsorship}/controllers/*.ts` |

## Phase 3 additions

| Concern | Real path |
|---|---|
| Owned skip-charge + receipt | `saturnator-web/functions/api/x402/[[route]].ts` (`onProtectedRequest`, receipt builder) |
| Auth bridge for HTML paywall | `POST /api/x402/auth-bridge` |
| Download proxy | `GET /api/x402/licenses/:purchaseId/download` |
| Ownership lookup + gated download | `saturnator-api` `forTrack` / `download` / `downloadFile` |
| HMAC download tokens | `saturnator-api/src/utils/download-token.ts` |
| Artist licensing UI | `saturnator-web/pages/upload.vue` |
| Wallet verify UI | `saturnator-web/pages/settings.vue` |
| Buyer purchase UI | `components/payments/LicensePurchaseButton.vue`, `PaymentReceiptModal.vue`, `pages/track/[id].vue` |

# Saturnator x402 — Implementation Map (Phase 0 / 0.5)

Read-only audit of the real repository. No product code was modified; the only
additions are isolated x402 infra (Pages Function + probe + docs) in `saturnator-web`.

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
| `server/utils/x402.ts` | `saturnator-web/functions/api/x402/[[route]].ts` + shared helpers under `saturnator-web/functions/` (Pages Functions; **not** Nuxt `server/`) |
| `server/services/*` | `saturnator-web/functions/` shared modules (net-new; called by the Hono app) |
| upload/edit UI | `saturnator-web/pages/upload.vue`, `saturnator-web/stores/upload.ts` |
| track detail/cards | `saturnator-web/pages/track/[id].vue`, `saturnator-web/pages/index.vue` |

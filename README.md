# Saturnator Web

Nuxt 3 frontend for Saturnator (static generate → Cloudflare Pages) plus x402 payment
Pages Functions under `functions/api/x402/*`.

## x402 Devnet demo (hackathon)

Full guide: [`docs/x402-integration.md`](./docs/x402-integration.md) · checklist: [`docs/x402-verification-checklist.md`](./docs/x402-verification-checklist.md).

```bash
npm install
# Configure .dev.vars (STRAPI_URL, STRAPI_API_TOKEN) — never commit secrets

# Local UI + payments (two processes):
npm run pages:dev          # x402 Functions on :8788 (required for Buy / Spotlight pay)
npm run dev                # Nuxt UI on :3000 (calls :8788 via NUXT_PUBLIC_X402_BASE)

npm run probe:x402         # unpaid 402 smoke
npm test
npm run typecheck
```

Core flows: buy a track/sample license with Devnet USDC; sponsor an artist onto Spotlight.
Wallets: Phantom / Solflare on **Devnet**. Never enter private keys into Saturnator.

## Setup

```bash
npm install
npm run dev
```

## Production

```bash
npm run generate   # Cloudflare Pages output: .output/public
```

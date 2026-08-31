# Saturnator Web

Nuxt 3 frontend for Saturnator. Static generate → Cloudflare Pages.

## Local development

```bash
# Terminal 1 — Cloudflare Workers API (see ../saturnator-workers)
cd ../saturnator-workers && npm run dev

# Terminal 2 — Nuxt UI
STRAPI_URL=http://localhost:8787 npm run dev
```

Set `STRAPI_URL` / `NUXT_PUBLIC_API_BASE` to your deployed Workers URL in production.

## Deploy

```bash
npm run generate
# Upload .output/public to Cloudflare Pages
```

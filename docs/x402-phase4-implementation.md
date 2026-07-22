# Saturnator x402 — Phase 4 Implementation (Artist Spotlight)

Status: **Phase 4 complete** locally. Branches: `feature/x402-phase4` on both
`saturnator-web` and `saturnator-api`. Not pushed.

## What shipped

### Task 4.1 — Sponsorship route + receipt
- `POST /api/x402/sponsor/:artistId` and alias `POST /api/x402/artists/:artistId/sponsor`
- Dynamic offer: config price (`X402_SPOTLIGHT_PRICE_USD`, default `$0.10`), `payTo` = artist's verified payout wallet
- MVP requires login (`requireSponsor` via auth-bridge cookie / JWT)
- Only settled payments create `artist-sponsorship` rows (`onAfterSettle`)
- Receipt returns sponsorship facts plus **post-settlement** rank/score/explorer (never invented before settle)

### Task 4.2 — Anti-whale scoring (24h rolling)
- Pure util: `saturnator-api/src/utils/spotlight-ranking.ts`
- `score = uniqueSupporters * 10 + sum(log2(1 + usd) * 5)`
- Self-sponsorship amount contribution capped at `5`; labeled on the board
- Tie-breakers: unique supporters → latest support → stable artist id
- Organic likes / trending are **not** mixed in

### Task 4.3 — Spotlight API + page
- Strapi: `GET /api/spotlight`, `GET /api/spotlight/artists/:artistId` (public)
- Pages Function proxy: `GET /api/x402/spotlight`
- SPA: `/spotlight`, nav link, cards with rank, avatar, Sponsored badge, supporters, USDC, score, preview audio, Solana proof, Support button
- Track detail: Support on Spotlight when artist user id is known

### Task 4.4 — UX without optimistic accounting
- Spinner / “Confirming…” only while paywall session starts
- Rank updates only after settlement + server leaderboard refresh
- Login required before sponsorship

## Tests
- saturnator-api: Jest `spotlight-ranking` (unique-supporters beat whales, self-cap, ties, window cutoff)
- saturnator-web: existing Vitest suite + `tsc -p functions/tsconfig.json --noEmit`

## Known limitations / follow-ups
- Live Devnet sponsorship E2E is Phase 5
- Rolling window has no fixed “ends at” countdown (by design); cards show relative “supported recently”
- Preview audio still uses public media URLs

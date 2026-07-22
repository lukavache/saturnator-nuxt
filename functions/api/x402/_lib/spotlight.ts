// Phase 4: fetch Spotlight board / artist rank from saturnator-api.
import type { X402Config } from './config';
import { strapiFetch } from './strapi-client';

export interface SpotlightArtistRank {
  rank: number | null;
  entry: {
    rank: number;
    artistId: string;
    score: number;
    uniqueSupporters: number;
    totalUsd: string;
    latestTransactionSignature?: string;
    latestExplorerUrl?: string;
  } | null;
  windowHours: number;
  spotlightPriceUsd: string;
}

export async function fetchArtistRank(
  config: X402Config,
  artistId: string,
): Promise<SpotlightArtistRank> {
  return strapiFetch<SpotlightArtistRank>(
    config,
    `/api/spotlight/artists/${encodeURIComponent(artistId)}`,
  );
}

export async function fetchSpotlightBoard(
  config: X402Config,
  opts: { window?: string; limit?: number } = {},
) {
  const window = opts.window || '24h';
  const limit = opts.limit ?? 20;
  return strapiFetch(
    config,
    `/api/spotlight?window=${encodeURIComponent(window)}&limit=${limit}`,
  );
}

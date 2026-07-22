// Task 2.3: resolve dynamic license/sponsorship offers server-side, against
// saturnator-api (Strapi) — never trusting price/payTo from the client.
import { SOLANA_DEVNET_CAIP2, SOLANA_MAINNET_CAIP2, getUsdcAddress } from '@x402/svm';
import type { Network } from '@x402/core/types';
import type { X402Config } from './config';
import { strapiFetch, StrapiRequestError } from './strapi-client';
import { usdToAtomicUsdc } from './money';

export type OfferErrorCode =
  | 'track_not_found'
  | 'track_not_licensable'
  | 'artist_not_found'
  | 'wallet_not_verified'
  | 'wallet_network_mismatch'
  | 'unsupported_network'
  | 'unauthenticated';

export class OfferResolutionError extends Error {
  constructor(
    public readonly code: OfferErrorCode,
    message: string,
  ) {
    super(message);
  }
}

interface PayoutWalletUser {
  id: number;
  username?: string;
  payoutWalletAddress?: string | null;
  payoutWalletNetwork?: 'devnet' | 'mainnet' | null;
  payoutWalletVerifiedAt?: string | null;
}

interface TrackRecord {
  id: number;
  title: string;
  trackStatus: 'pending' | 'approved' | 'rejected';
  x402Enabled: boolean;
  licensePriceUsd?: string | null;
  licenseType?: string | null;
  licenseVersion?: string | null;
  users_permissions_user?: PayoutWalletUser | null;
}

export interface LicenseOffer {
  trackId: string;
  sellerId: number;
  trackTitle: string;
  payTo: string;
  network: string;
  assetMint: string;
  priceUsd: string;
  amountAtomic: string;
  licenseType: string;
  licenseVersion: string;
}

export interface SponsorshipOffer {
  artistId: string;
  artistUsername?: string;
  payTo: string;
  network: string;
  assetMint: string;
  priceUsd: string;
  amountAtomic: string;
}

function networkToWalletEnum(network: string): 'devnet' | 'mainnet' {
  if (network === SOLANA_DEVNET_CAIP2) return 'devnet';
  if (network === SOLANA_MAINNET_CAIP2) return 'mainnet';
  throw new OfferResolutionError('unsupported_network', `Unsupported x402 network: ${network}`);
}

function assertVerifiedWallet(
  user: PayoutWalletUser | null | undefined,
  expectedNetwork: 'devnet' | 'mainnet',
  notFoundCode: OfferErrorCode,
  notFoundMessage: string,
): asserts user is { payoutWalletAddress: string } & PayoutWalletUser {
  if (!user) throw new OfferResolutionError(notFoundCode, notFoundMessage);
  if (!user.payoutWalletAddress || !user.payoutWalletVerifiedAt) {
    throw new OfferResolutionError(
      'wallet_not_verified',
      `User ${user.id} does not have a verified payout wallet`,
    );
  }
  if (user.payoutWalletNetwork !== expectedNetwork) {
    throw new OfferResolutionError(
      'wallet_network_mismatch',
      `User ${user.id} payout wallet is on ${user.payoutWalletNetwork}, expected ${expectedNetwork}`,
    );
  }
}

export async function getLicenseOffer(config: X402Config, trackId: string): Promise<LicenseOffer> {
  const walletNetwork = networkToWalletEnum(config.network);

  let track: TrackRecord;
  try {
    const response = await strapiFetch<{ data: TrackRecord }>(
      config,
      `/api/tracks/${encodeURIComponent(trackId)}?populate=users_permissions_user`,
    );
    track = response.data;
  } catch (error) {
    if (error instanceof StrapiRequestError && error.status === 404) {
      throw new OfferResolutionError('track_not_found', `Track ${trackId} not found`);
    }
    throw error;
  }

  if (!track || track.trackStatus !== 'approved') {
    throw new OfferResolutionError('track_not_found', `Track ${trackId} not found or not approved`);
  }
  if (!track.x402Enabled || !track.licensePriceUsd) {
    throw new OfferResolutionError('track_not_licensable', `Track ${trackId} does not have x402 licensing enabled`);
  }

  const seller = track.users_permissions_user;
  assertVerifiedWallet(
    seller,
    walletNetwork,
    'artist_not_found',
    `Track ${trackId} has no owning artist`,
  );

  return {
    trackId: String(track.id),
    sellerId: seller.id,
    trackTitle: track.title,
    payTo: seller.payoutWalletAddress,
    network: config.network,
    assetMint: getUsdcAddress(config.network as Network),
    priceUsd: track.licensePriceUsd,
    amountAtomic: usdToAtomicUsdc(track.licensePriceUsd),
    licenseType: track.licenseType || 'non_exclusive_commercial',
    licenseVersion: track.licenseVersion || 'saturnator-license-v1',
  };
}

export async function getSponsorshipOffer(config: X402Config, artistId: string): Promise<SponsorshipOffer> {
  const walletNetwork = networkToWalletEnum(config.network);

  let artist: PayoutWalletUser;
  try {
    const response = await strapiFetch<PayoutWalletUser>(
      config,
      `/api/users/${encodeURIComponent(artistId)}?fields[0]=id&fields[1]=username&fields[2]=payoutWalletAddress&fields[3]=payoutWalletNetwork&fields[4]=payoutWalletVerifiedAt`,
    );
    artist = response;
  } catch (error) {
    if (error instanceof StrapiRequestError && (error.status === 404 || error.status === 400)) {
      throw new OfferResolutionError('artist_not_found', `Artist ${artistId} not found`);
    }
    throw error;
  }

  assertVerifiedWallet(artist, walletNetwork, 'artist_not_found', `Artist ${artistId} not found`);

  return {
    artistId: String(artist.id),
    artistUsername: artist.username,
    payTo: artist.payoutWalletAddress,
    network: config.network,
    assetMint: getUsdcAddress(config.network as Network),
    priceUsd: config.spotlightPriceUsd,
    amountAtomic: usdToAtomicUsdc(config.spotlightPriceUsd),
  };
}

// Phase 3: lookup settled license ownership against saturnator-api.
import type { X402Config } from './config';
import { strapiFetch, StrapiRequestError } from './strapi-client';

export interface OwnedPurchase {
  id: number;
  documentId?: string;
  trackId: string;
  trackTitle?: string;
  licenseType: string;
  licenseVersion: string;
  amountUsd?: string;
  transactionSignature: string;
  sellerWalletAddress?: string;
  settledAt?: string;
  network?: string;
}

/**
 * Asks Strapi whether this buyer already owns a settled license for the track.
 * Uses the caller's JWT (not the API token) so ownership scoping is enforced
 * by saturnator-api's authenticated role + controller.
 */
export async function findOwnedPurchase(
  config: X402Config,
  buyerJwt: string,
  trackId: string,
): Promise<OwnedPurchase | null> {
  try {
    const response = await fetch(
      `${config.strapiUrl}/api/license-purchases/for-track/${encodeURIComponent(trackId)}`,
      { headers: { Authorization: `Bearer ${buyerJwt}` } },
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new StrapiRequestError(
        `Ownership lookup failed: ${response.status}`,
        response.status,
        await response.json().catch(() => undefined),
      );
    }
    const body = (await response.json()) as { data?: any };
    const data = body.data;
    if (!data) return null;

    const track = data.track;
    return {
      id: data.id,
      documentId: data.documentId,
      trackId: String(track?.documentId || track?.id || trackId),
      trackTitle: track?.title,
      licenseType: data.licenseType,
      licenseVersion: data.licenseVersion,
      amountUsd: data.amountUsd,
      transactionSignature: data.transactionSignature,
      sellerWalletAddress: data.sellerWalletAddress,
      settledAt: data.settledAt,
      network: data.network,
    };
  } catch (error) {
    if (error instanceof StrapiRequestError && error.status === 404) return null;
    throw error;
  }
}

/** Same lookup via API token (used after settlement when we already know buyerId). */
export async function findOwnedPurchaseByApiToken(
  config: X402Config,
  buyerId: number,
  trackId: string,
): Promise<OwnedPurchase | null> {
  const isNumeric = /^\d+$/.test(trackId);
  const trackFilter = isNumeric
    ? `filters[track][id][$eq]=${trackId}`
    : `filters[track][documentId][$eq]=${encodeURIComponent(trackId)}`;

  const response = await strapiFetch<{ data: any[] }>(
    config,
    `/api/license-purchases?filters[buyer][id][$eq]=${buyerId}&filters[status][$eq]=settled&${trackFilter}&populate[track]=true&sort=settledAt:desc&pagination[pageSize]=1`,
  );

  const data = response.data?.[0];
  if (!data) return null;
  const track = data.track;
  return {
    id: data.id,
    documentId: data.documentId,
    trackId: String(track?.documentId || track?.id || trackId),
    trackTitle: track?.title,
    licenseType: data.licenseType,
    licenseVersion: data.licenseVersion,
    amountUsd: data.amountUsd,
    transactionSignature: data.transactionSignature,
    sellerWalletAddress: data.sellerWalletAddress,
    settledAt: data.settledAt,
    network: data.network,
  };
}

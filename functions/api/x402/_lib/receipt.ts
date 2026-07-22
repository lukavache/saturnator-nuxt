// Phase 3 receipt builder — never includes raw forever-public storage URLs.
import type { OwnedPurchase } from './ownership';
import type { X402Config } from './config';

export interface LicenseReceipt {
  purchaseId: string;
  assetId: string;
  assetTitle?: string;
  licenseType: string;
  licenseVersion: string;
  amountUsd?: string;
  transactionSignature: string;
  explorerUrl: string;
  downloadUrl: string;
  sellerWalletAddress?: string;
  alreadyOwned: boolean;
}

function explorerUrl(signature: string, network?: string): string {
  const isMainnet = network?.includes('5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp');
  const cluster = isMainnet ? '' : '?cluster=devnet';
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}${cluster}`;
}

export function buildLicenseReceipt(
  config: X402Config,
  purchase: OwnedPurchase,
  alreadyOwned: boolean,
): LicenseReceipt {
  const purchaseId = String(purchase.documentId || purchase.id);
  return {
    purchaseId,
    assetId: purchase.trackId,
    assetTitle: purchase.trackTitle,
    licenseType: purchase.licenseType,
    licenseVersion: purchase.licenseVersion,
    amountUsd: purchase.amountUsd,
    transactionSignature: purchase.transactionSignature,
    explorerUrl: explorerUrl(purchase.transactionSignature, purchase.network),
    // Same-origin Pages Function proxy — requires the buyer's JWT.
    downloadUrl: `/api/x402/licenses/${encodeURIComponent(purchaseId)}/download`,
    sellerWalletAddress: purchase.sellerWalletAddress,
    alreadyOwned,
  };
}

/** Absolute Strapi download endpoint (used by the Pages Function proxy). */
export function strapiPurchaseDownloadPath(purchaseId: string): string {
  return `/api/license-purchases/${encodeURIComponent(purchaseId)}/download`;
}

import { describe, expect, it } from 'vitest';
import { buildLicenseReceipt } from '../../functions/api/x402/_lib/receipt';
import type { X402Config } from '../../functions/api/x402/_lib/config';
import type { OwnedPurchase } from '../../functions/api/x402/_lib/ownership';

const CONFIG: X402Config = {
  enabled: true,
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
  facilitatorUrl: 'https://x402.org/facilitator',
  defaultReceiver: '',
  licenseMinUsd: '0.01',
  spotlightPriceUsd: '0.10',
  spotlightWindowHours: 24,
  signedDownloadTtlSeconds: 60,
  strapiUrl: 'https://api.example.com',
  strapiApiToken: 'token',
};

const PURCHASE: OwnedPurchase = {
  id: 9,
  documentId: 'purchase-doc-1',
  trackId: 'track-doc-1',
  trackTitle: 'Demo Track',
  licenseType: 'non_exclusive_commercial',
  licenseVersion: 'saturnator-license-v1',
  amountUsd: '0.10',
  transactionSignature: 'sig-abc',
  sellerWalletAddress: 'ArtistWallet11111111111111111111111111111',
  network: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
};

describe('buildLicenseReceipt', () => {
  it('builds a receipt with explorer + same-origin download URL (no raw storage URL)', () => {
    const receipt = buildLicenseReceipt(CONFIG, PURCHASE, false);
    expect(receipt.purchaseId).toBe('purchase-doc-1');
    expect(receipt.downloadUrl).toBe('/api/x402/licenses/purchase-doc-1/download');
    expect(receipt.explorerUrl).toContain('explorer.solana.com/tx/sig-abc');
    expect(receipt.explorerUrl).toContain('cluster=devnet');
    expect(receipt.alreadyOwned).toBe(false);
    expect(JSON.stringify(receipt)).not.toMatch(/\/uploads\//);
  });

  it('marks alreadyOwned when re-issued without a new charge', () => {
    expect(buildLicenseReceipt(CONFIG, PURCHASE, true).alreadyOwned).toBe(true);
  });
});

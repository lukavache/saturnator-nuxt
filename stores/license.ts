import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export interface LicenseReceipt {
  purchaseId: string
  assetId: string
  assetTitle?: string
  licenseType: string
  licenseVersion: string
  amountUsd?: string
  transactionSignature: string
  explorerUrl: string
  downloadUrl: string
  sellerWalletAddress?: string
  alreadyOwned: boolean
  pending?: boolean
}

export interface DownloadBundle {
  purchaseId: string
  trackTitle?: string
  files: Array<{ role: string; name: string; mime: string; url: string; expiresAt: string }>
}

export const useLicenseStore = defineStore('license', () => {
  const client = useStrapiClient()
  const auth = useAuthStore()

  const ownedByTrack = ref<Record<string, LicenseReceipt | null>>({})

  async function checkOwnership(trackId: string): Promise<LicenseReceipt | null> {
    if (!auth.getToken) return null
    try {
      const res = await client<any>(`license-purchases/for-track/${trackId}`, { method: 'GET' })
      const data = res?.data || res
      if (!data?.id && !data?.documentId) {
        ownedByTrack.value[trackId] = null
        return null
      }
      const track = data.track
      const purchaseId = String(data.documentId || data.id)
      const receipt: LicenseReceipt = {
        purchaseId,
        assetId: String(track?.documentId || track?.id || trackId),
        assetTitle: track?.title,
        licenseType: data.licenseType,
        licenseVersion: data.licenseVersion,
        amountUsd: data.amountUsd,
        transactionSignature: data.transactionSignature,
        explorerUrl: data.transactionSignature
          ? `https://explorer.solana.com/tx/${data.transactionSignature}?cluster=devnet`
          : '',
        downloadUrl: `/api/x402/licenses/${encodeURIComponent(purchaseId)}/download`,
        sellerWalletAddress: data.sellerWalletAddress,
        alreadyOwned: true,
      }
      ownedByTrack.value[trackId] = receipt
      return receipt
    } catch (error: any) {
      const status = error?.status || error?.response?.status
      if (status === 404) {
        ownedByTrack.value[trackId] = null
        return null
      }
      console.error('Ownership check failed', error)
      return null
    }
  }

  async function preparePaywallSession(): Promise<void> {
    if (!auth.getToken) throw new Error('Sign in required')
    const res = await fetch('/api/x402/auth-bridge', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.getToken}` },
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.message || 'Could not start payment session')
    }
  }

  /** Opens the official x402 HTML paywall for this track (same-origin). */
  async function startLicensePurchase(trackId: string): Promise<void> {
    await preparePaywallSession()
    window.location.href = `/api/x402/license/${encodeURIComponent(trackId)}`
  }

  async function fetchDownloadBundle(purchaseId: string): Promise<DownloadBundle> {
    if (!auth.getToken) throw new Error('Sign in required')
    const res = await fetch(`/api/x402/licenses/${encodeURIComponent(purchaseId)}/download`, {
      headers: { Authorization: `Bearer ${auth.getToken}` },
    })
    const body = await res.json()
    if (!res.ok) throw new Error(body?.message || body?.error || 'Download failed')
    return body as DownloadBundle
  }

  return {
    ownedByTrack,
    checkOwnership,
    preparePaywallSession,
    startLicensePurchase,
    fetchDownloadBundle,
  }
})

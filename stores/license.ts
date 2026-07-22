import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { mapX402UserError } from '../utils/x402-errors'

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
  const pendingByTrack = ref<Record<string, boolean>>({})

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
      pendingByTrack.value[trackId] = false
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

  /**
   * After settlement, entitlement write can lag. Poll ownership and never
   * invite a second payment while pending.
   */
  async function pollOwnershipUntilSettled(
    trackId: string,
    opts: { attempts?: number; delayMs?: number } = {},
  ): Promise<LicenseReceipt | null> {
    const attempts = opts.attempts ?? 8
    const delayMs = opts.delayMs ?? 1500
    pendingByTrack.value[trackId] = true
    for (let i = 0; i < attempts; i++) {
      const owned = await checkOwnership(trackId)
      if (owned) return owned
      await new Promise((r) => setTimeout(r, delayMs))
    }
    pendingByTrack.value[trackId] = false
    return null
  }

  async function preparePaywallSession(): Promise<void> {
    if (!auth.getToken) throw new Error('Sign in required')
    const res = await fetch('/api/x402/auth-bridge', {
      method: 'POST',
      headers: { Authorization: `Bearer ${auth.getToken}` },
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw Object.assign(new Error(mapX402UserError(body)), {
        code: body.error || 'unauthenticated',
      })
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
    if (!res.ok) throw Object.assign(new Error(mapX402UserError(body)), { code: body?.error })
    return body as DownloadBundle
  }

  return {
    ownedByTrack,
    pendingByTrack,
    checkOwnership,
    pollOwnershipUntilSettled,
    preparePaywallSession,
    startLicensePurchase,
    fetchDownloadBundle,
  }
})

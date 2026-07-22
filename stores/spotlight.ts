import { defineStore } from 'pinia'
import { useAuthStore } from './auth'
import { mapX402UserError } from '../utils/x402-errors'
import { x402Url } from '../utils/x402-base'

export interface SpotlightRow {
  rank: number
  artistId: string
  username: string
  displayName: string
  profileImageUrl?: string | null
  bio?: string | null
  score: number
  uniqueSupporters: number
  totalUsd: string
  sponsorshipCount: number
  selfSponsored: boolean
  latestSponsoredAt: string
  latestTransactionSignature: string
  latestExplorerUrl: string
  previewTrack?: {
    id: number
    documentId?: string
    title: string
    coverUrl?: string | null
    audioUrl?: string | null
    genres?: unknown
  } | null
  sponsoredBadge: boolean
}

export interface SpotlightBoard {
  windowHours: number
  windowStartsAt: string
  windowEndsAt: string
  generatedAt: string
  spotlightPriceUsd: string
  explanation: string
  data: SpotlightRow[]
}

export const useSpotlightStore = defineStore('spotlight', () => {
  const auth = useAuthStore()
  const board = ref<SpotlightBoard | null>(null)
  const loading = ref(false)
  const error = ref('')
  const pendingArtistId = ref<string | null>(null)

  async function load(opts: { window?: string; limit?: number } = {}) {
    loading.value = true
    error.value = ''
    try {
      const window = opts.window || '24h'
      const limit = opts.limit ?? 20
      const query = `window=${encodeURIComponent(window)}&limit=${limit}`
      let res = await fetch(x402Url(`/api/x402/spotlight?${query}`), {
        credentials: 'include',
      })
      if (!res.ok) {
        const config = useRuntimeConfig()
        res = await fetch(`${config.public.apiBase}/api/spotlight?${query}`)
      }
      if (!res.ok) throw new Error('Could not load Spotlight leaderboard')
      board.value = (await res.json()) as SpotlightBoard
      return board.value
    } catch (e: any) {
      error.value = e?.message || 'Spotlight load failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function startSponsorship(artistId: string) {
    if (!auth.getToken) {
      await navigateTo(`/login?redirect=/spotlight`)
      return
    }
    // Optimistic UX: spinner only — rank updates after confirmed settlement.
    pendingArtistId.value = artistId
    try {
      let bridge: Response
      try {
        bridge = await fetch(x402Url('/api/x402/auth-bridge'), {
          method: 'POST',
          headers: { Authorization: `Bearer ${auth.getToken}` },
          credentials: 'include',
        })
      } catch {
        throw Object.assign(new Error(mapX402UserError({ code: 'x402_unavailable' })), {
          code: 'x402_unavailable',
        })
      }
      if (!bridge.ok) {
        const contentType = bridge.headers.get('content-type') || ''
        const body = contentType.includes('application/json')
          ? await bridge.json().catch(() => ({}))
          : { message: await bridge.text().catch(() => '') }
        const raw = String(body?.message || '')
        const code =
          bridge.status === 404 || /page not found|auth-bridge/i.test(raw)
            ? 'x402_unavailable'
            : body.error || 'unauthenticated'
        throw Object.assign(new Error(mapX402UserError({ ...body, code, message: raw })), { code })
      }
      // Official x402 HTML paywall — POST-protected sponsor route via form submit.
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = x402Url(`/api/x402/artists/${encodeURIComponent(artistId)}/sponsor`)
      document.body.appendChild(form)
      form.submit()
    } catch (e) {
      pendingArtistId.value = null
      throw e
    }
  }

  function clearPending() {
    pendingArtistId.value = null
  }

  return { board, loading, error, pendingArtistId, load, startSponsorship, clearPending }
})

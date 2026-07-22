import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

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
      // Prefer same-origin Pages Function proxy; fall back to Strapi.
      const window = opts.window || '24h'
      const limit = opts.limit ?? 20
      let res = await fetch(`/api/x402/spotlight?window=${encodeURIComponent(window)}&limit=${limit}`)
      if (!res.ok) {
        const config = useRuntimeConfig()
        res = await fetch(
          `${config.public.apiBase}/api/spotlight?window=${encodeURIComponent(window)}&limit=${limit}`,
        )
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
      const bridge = await fetch('/api/x402/auth-bridge', {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.getToken}` },
      })
      if (!bridge.ok) throw new Error('Could not start sponsorship session')
      // Official x402 HTML paywall (POST routes: browser navigates via form GET fallback —
      // we use location to the sponsor endpoint; middleware accepts the request method from routes).
      // For POST-protected resources, open via a same-origin form POST.
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = `/api/x402/artists/${encodeURIComponent(artistId)}/sponsor`
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

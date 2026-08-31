import { defineStore } from 'pinia'

type AdminTrack = {
  id: number | string
  documentId?: string
  title: string
  username?: string | null
  trackStatus?: string
  bpm?: number
  key?: string
  genres?: string[] | string
  createdAt?: string
  coverImage?: { url?: string } | null
  users_permissions_user?: { username?: string } | null
}

export const useAdminStore = defineStore('Admin', () => {
  const config = useRuntimeConfig()
  const auth = useAuthStore()

  const tracks = ref<AdminTrack[]>([])
  const loading = ref(false)
  const error = ref('')
  const statusFilter = ref<'pending' | 'approved' | 'rejected' | 'all'>('pending')

  const apiFetch = async <T>(path: string, opts: RequestInit = {}) => {
    const token = auth.getToken
    if (!token) throw new Error('Not logged in')

    const res = await fetch(`${config.public.apiBase}${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
        ...(opts.headers || {}),
      },
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      const message = (json as any)?.error?.message || res.statusText || 'Request failed'
      throw new Error(message)
    }
    return json as T
  }

  const loadTracks = async (status = statusFilter.value) => {
    loading.value = true
    error.value = ''
    statusFilter.value = status
    try {
      const res = await apiFetch<{ data: AdminTrack[] }>(
        `/api/admin/tracks?status=${encodeURIComponent(status)}&pagination[pageSize]=50`,
      )
      tracks.value = res.data || []
    } catch (err: any) {
      error.value = err.message || 'Failed to load tracks'
      tracks.value = []
    } finally {
      loading.value = false
    }
  }

  const setStatus = async (track: AdminTrack, trackStatus: 'approved' | 'rejected' | 'pending') => {
    const id = track.documentId || track.id
    await apiFetch(`/api/admin/tracks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ trackStatus }),
    })
    await loadTracks(statusFilter.value)
  }

  return {
    tracks,
    loading,
    error,
    statusFilter,
    loadTracks,
    setStatus,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAdminStore, import.meta.hot))
}

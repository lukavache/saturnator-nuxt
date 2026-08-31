<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <section class="bg-white border-b-2 border-black px-4 py-8">
      <div class="max-w-5xl mx-auto">
        <h1 class="text-3xl font-bold text-saturnator-gray-dark">Admin</h1>
        <p class="mt-2 text-saturnator-gray-medium">
          Review uploaded tracks and set their status.
        </p>
      </div>
    </section>

    <section class="px-4 py-8">
      <div class="max-w-5xl mx-auto space-y-6">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="tab in tabs"
            :key="tab"
            type="button"
            class="rounded-lg border-2 border-black px-4 py-2 text-sm font-bold transition-colors"
            :class="statusFilter === tab ? 'bg-saturnator-blue-medium text-white' : 'bg-white text-saturnator-gray-dark hover:bg-gray-100'"
            @click="load(tab)"
          >
            {{ tab }}
          </button>
        </div>

        <p v-if="error" class="rounded-lg border-2 border-black bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {{ error }}
        </p>

        <div v-if="loading" class="flex justify-center py-16">
          <div class="h-10 w-10 animate-spin rounded-full border-4 border-saturnator-gray-light border-b-saturnator-blue-medium"></div>
        </div>

        <div v-else-if="tracks.length === 0" class="rounded-lg border-2 border-black bg-white p-8 text-center">
          <p class="font-semibold text-saturnator-gray-dark">No {{ statusFilter }} tracks</p>
        </div>

        <ul v-else class="space-y-4">
          <li
            v-for="track in tracks"
            :key="String(track.documentId || track.id)"
            class="overflow-hidden rounded-lg border-2 border-black bg-white"
          >
            <div class="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <img
                :src="coverUrl(track)"
                :alt="track.title"
                class="h-24 w-24 shrink-0 rounded-lg border-2 border-black object-cover"
                @error="onImgError"
              />

              <div class="min-w-0 flex-1">
                <div class="flex flex-wrap items-center gap-2">
                  <h2 class="truncate text-lg font-bold text-saturnator-gray-dark">{{ track.title }}</h2>
                  <span class="rounded-full border border-black px-2 py-0.5 text-xs font-bold uppercase">
                    {{ track.trackStatus }}
                  </span>
                </div>
                <p class="mt-1 text-sm text-saturnator-gray-medium">
                  {{ track.username || track.users_permissions_user?.username || 'Unknown' }}
                  <span v-if="track.bpm"> · {{ track.bpm }} BPM</span>
                  <span v-if="track.key"> · {{ track.key }}</span>
                </p>
                <p v-if="track.createdAt" class="mt-1 text-xs text-saturnator-gray-medium">
                  {{ formatDate(track.createdAt) }}
                </p>
              </div>

              <div class="flex flex-wrap gap-2 sm:justify-end">
                <NuxtLink
                  :to="`/track/${track.documentId || track.id}`"
                  class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100"
                >
                  Open
                </NuxtLink>
                <button
                  v-if="track.trackStatus !== 'approved'"
                  type="button"
                  class="rounded-lg border-2 border-black bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                  :disabled="busyId === trackKey(track)"
                  @click="setStatus(track, 'approved')"
                >
                  Approve
                </button>
                <button
                  v-if="track.trackStatus !== 'rejected'"
                  type="button"
                  class="rounded-lg border-2 border-black bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  :disabled="busyId === trackKey(track)"
                  @click="setStatus(track, 'rejected')"
                >
                  Reject
                </button>
                <button
                  v-if="track.trackStatus !== 'pending'"
                  type="button"
                  class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
                  :disabled="busyId === trackKey(track)"
                  @click="setStatus(track, 'pending')"
                >
                  Pending
                </button>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Admin - Saturnator',
  middleware: 'admin',
})

const config = useRuntimeConfig()
const admin = useAdminStore()

const tabs = ['pending', 'approved', 'rejected', 'all'] as const
const busyId = ref<string | null>(null)

const tracks = computed(() => admin.tracks)
const loading = computed(() => admin.loading)
const error = computed(() => admin.error)
const statusFilter = computed(() => admin.statusFilter)

const trackKey = (track: { documentId?: string; id: number | string }) =>
  String(track.documentId || track.id)

const assetUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('http') ? url : `${config.public.apiBase}${url}`
}

const coverUrl = (track: { coverImage?: { url?: string } | null }) =>
  track.coverImage?.url ? assetUrl(track.coverImage.url) : '/default-cover.jpg'

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))

const onImgError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) target.src = '/default-cover.jpg'
}

const load = async (status: (typeof tabs)[number]) => {
  await admin.loadTracks(status)
}

const setStatus = async (
  track: { documentId?: string; id: number | string; trackStatus?: string },
  status: 'approved' | 'rejected' | 'pending',
) => {
  busyId.value = trackKey(track)
  try {
    await admin.setStatus(track as any, status)
  } catch (err: any) {
    admin.error = err.message || 'Update failed'
  } finally {
    busyId.value = null
  }
}

onMounted(() => {
  load('pending')
})
</script>

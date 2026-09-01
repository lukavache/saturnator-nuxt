<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <section class="bg-white border-b-2 border-black px-4 py-8">
      <div class="max-w-5xl mx-auto">
        <h1 class="text-3xl font-bold text-saturnator-gray-dark">Admin</h1>
        <p class="mt-2 text-saturnator-gray-medium">
          Manage tracks and users.
        </p>
      </div>
    </section>

    <section class="px-4 py-8">
      <div class="max-w-5xl mx-auto space-y-6">
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg border-2 border-black px-4 py-2 text-sm font-bold transition-colors"
            :class="section === 'tracks' ? 'bg-saturnator-blue-medium text-white' : 'bg-white hover:bg-gray-100'"
            @click="openTracks"
          >
            Tracks
          </button>
          <button
            type="button"
            class="rounded-lg border-2 border-black px-4 py-2 text-sm font-bold transition-colors"
            :class="section === 'users' ? 'bg-saturnator-blue-medium text-white' : 'bg-white hover:bg-gray-100'"
            @click="openUsers"
          >
            Users
          </button>
        </div>

        <p v-if="error" class="rounded-lg border-2 border-black bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {{ error }}
        </p>

        <!-- Tracks -->
        <template v-if="section === 'tracks'">
          <div class="flex flex-wrap gap-2">
            <button
              v-for="tab in trackTabs"
              :key="tab"
              type="button"
              class="rounded-lg border-2 border-black px-4 py-2 text-sm font-bold transition-colors"
              :class="statusFilter === tab ? 'bg-black text-white' : 'bg-white text-saturnator-gray-dark hover:bg-gray-100'"
              @click="loadTracks(tab)"
            >
              {{ tab }}
            </button>
          </div>

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
                    @click="setTrackStatus(track, 'approved')"
                  >
                    Approve
                  </button>
                  <button
                    v-if="track.trackStatus !== 'rejected'"
                    type="button"
                    class="rounded-lg border-2 border-black bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    :disabled="busyId === trackKey(track)"
                    @click="setTrackStatus(track, 'rejected')"
                  >
                    Reject
                  </button>
                  <button
                    v-if="track.trackStatus !== 'pending'"
                    type="button"
                    class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
                    :disabled="busyId === trackKey(track)"
                    @click="setTrackStatus(track, 'pending')"
                  >
                    Pending
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </template>

        <!-- Users -->
        <template v-else>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div class="flex flex-wrap gap-2">
              <button
                v-for="tab in userTabs"
                :key="tab"
                type="button"
                class="rounded-lg border-2 border-black px-4 py-2 text-sm font-bold transition-colors"
                :class="userFilter === tab ? 'bg-black text-white' : 'bg-white hover:bg-gray-100'"
                @click="loadUsers(tab)"
              >
                {{ tab }}
              </button>
            </div>
            <form class="flex gap-2" @submit.prevent="loadUsers(userFilter, searchInput)">
              <input
                v-model="searchInput"
                type="search"
                placeholder="Search email or username"
                class="w-full min-w-[200px] rounded-lg border-2 border-black px-3 py-2 text-sm sm:w-64"
              />
              <button type="submit" class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100">
                Search
              </button>
            </form>
          </div>

          <div v-if="loading" class="flex justify-center py-16">
            <div class="h-10 w-10 animate-spin rounded-full border-4 border-saturnator-gray-light border-b-saturnator-blue-medium"></div>
          </div>

          <div v-else-if="users.length === 0" class="rounded-lg border-2 border-black bg-white p-8 text-center">
            <p class="font-semibold text-saturnator-gray-dark">No users found</p>
          </div>

          <ul v-else class="space-y-4">
            <li
              v-for="user in users"
              :key="user.id"
              class="overflow-hidden rounded-lg border-2 border-black bg-white p-4"
            >
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-2">
                    <h2 class="truncate text-lg font-bold text-saturnator-gray-dark">
                      {{ user.username || '—' }}
                    </h2>
                    <span
                      v-if="isAdminRole(user)"
                      class="rounded-full border border-black bg-[#7F8CFF] px-2 py-0.5 text-xs font-bold uppercase text-white"
                    >
                      admin
                    </span>
                    <span
                      v-if="user.blocked"
                      class="rounded-full border border-black bg-red-600 px-2 py-0.5 text-xs font-bold uppercase text-white"
                    >
                      blocked
                    </span>
                    <span
                      v-if="!user.confirmed"
                      class="rounded-full border border-black bg-yellow-300 px-2 py-0.5 text-xs font-bold uppercase"
                    >
                      unconfirmed
                    </span>
                    <span
                      v-else
                      class="rounded-full border border-black px-2 py-0.5 text-xs font-bold uppercase"
                    >
                      confirmed
                    </span>
                  </div>
                  <p class="mt-1 break-all text-sm text-saturnator-gray-medium">{{ user.email }}</p>
                  <p v-if="user.createdAt" class="mt-1 text-xs text-saturnator-gray-medium">
                    Joined {{ formatDate(user.createdAt) }}
                  </p>
                </div>

                <div class="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    v-if="!user.confirmed"
                    type="button"
                    class="rounded-lg border-2 border-black bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50"
                    :disabled="busyId === String(user.id)"
                    @click="patchUser(user, { confirmed: true })"
                  >
                    Confirm
                  </button>
                  <button
                    v-if="!user.blocked"
                    type="button"
                    class="rounded-lg border-2 border-black bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                    :disabled="busyId === String(user.id) || isSelf(user)"
                    @click="patchUser(user, { blocked: true })"
                  >
                    Block
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
                    :disabled="busyId === String(user.id)"
                    @click="patchUser(user, { blocked: false })"
                  >
                    Unblock
                  </button>
                  <button
                    v-if="!isAdminRole(user)"
                    type="button"
                    class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
                    :disabled="busyId === String(user.id)"
                    @click="patchUser(user, { role: 'admin' })"
                  >
                    Make admin
                  </button>
                  <button
                    v-else
                    type="button"
                    class="rounded-lg border-2 border-black bg-white px-3 py-2 text-sm font-bold hover:bg-gray-100 disabled:opacity-50"
                    :disabled="busyId === String(user.id) || isSelf(user)"
                    @click="patchUser(user, { role: 'authenticated' })"
                  >
                    Remove admin
                  </button>
                </div>
              </div>
            </li>
          </ul>
        </template>
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
const authStore = useAuthStore()
const admin = useAdminStore()

const trackTabs = ['pending', 'approved', 'rejected', 'all'] as const
const userTabs = ['all', 'unconfirmed', 'confirmed', 'blocked', 'admin'] as const
const busyId = ref<string | null>(null)
const searchInput = ref('')

const section = computed(() => admin.section)
const tracks = computed(() => admin.tracks)
const users = computed(() => admin.users)
const loading = computed(() => admin.loading)
const error = computed(() => admin.error)
const statusFilter = computed(() => admin.statusFilter)
const userFilter = computed(() => admin.userFilter)

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

const isAdminRole = (user: { role?: { name?: string; type?: string } }) =>
  user.role?.type === 'admin' || user.role?.name === 'Admin'

const isSelf = (user: { id: number }) => authStore.getUser?.id === user.id

const openTracks = async () => {
  await admin.loadTracks(admin.statusFilter)
}

const openUsers = async () => {
  searchInput.value = admin.userQuery
  await admin.loadUsers(admin.userFilter, admin.userQuery)
}

const loadTracks = async (status: (typeof trackTabs)[number]) => {
  await admin.loadTracks(status)
}

const loadUsers = async (
  filter: (typeof userTabs)[number] = userFilter.value,
  q = searchInput.value,
) => {
  await admin.loadUsers(filter, q)
}

const setTrackStatus = async (
  track: { documentId?: string; id: number | string },
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

const patchUser = async (
  user: { id: number; documentId?: string },
  patch: { blocked?: boolean; confirmed?: boolean; role?: 'admin' | 'authenticated' },
) => {
  busyId.value = String(user.id)
  try {
    await admin.updateUser(user as any, patch)
  } catch (err: any) {
    admin.error = err.message || 'Update failed'
  } finally {
    busyId.value = null
  }
}

onMounted(() => {
  openTracks()
})
</script>

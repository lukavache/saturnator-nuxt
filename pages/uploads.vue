<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Header Section -->
    <section class="bg-white py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <h1 class="text-3xl font-bold text-saturnator-gray-dark mb-2">
          My Uploads
        </h1>
        <p class="text-saturnator-gray-medium">
          Manage your uploaded tracks
        </p>
      </div>
    </section>

    <!-- Tracks Section -->
    <section class="py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-saturnator-blue-medium"></div>
          <p class="mt-4 text-saturnator-gray-medium">Loading your tracks...</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="tracks.length === 0" class="text-center py-12">
          <div class="w-24 h-24 bg-saturnator-gray-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-12 h-12 text-saturnator-gray-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-saturnator-gray-dark mb-2">No tracks uploaded yet</h3>
          <p class="text-saturnator-gray-medium mb-6">Start sharing your music with the world!</p>
        </div>

        <!-- Tracks List -->
        <div v-else class="bg-white rounded-lg shadow-sm border-2 border-black overflow-hidden">
          <!-- Table Header -->
          <div class="bg-gray-50 border-b-2 border-black px-6 py-4">
            <div class="grid grid-cols-12 gap-4 items-center">
              <div class="col-span-1">
                <span class="text-sm font-semibold text-saturnator-gray-dark">Cover</span>
              </div>
              <div class="col-span-4">
                <span class="text-sm font-semibold text-saturnator-gray-dark">Title</span>
              </div>
              <div class="col-span-2">
                <span class="text-sm font-semibold text-saturnator-gray-dark">BPM</span>
              </div>
              <div class="col-span-3">
                <span class="text-sm font-semibold text-saturnator-gray-dark">Player</span>
              </div>
              <div class="col-span-2">
                <span class="text-sm font-semibold text-saturnator-gray-dark">Actions</span>
              </div>
            </div>
          </div>

          <!-- Track Rows -->
          <div v-for="track in tracks" :key="track.id" class="border-b border-gray-200 last:border-b-0">
            <div class="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-gray-50 transition-colors">
              <!-- Cover Image -->
              <div class="col-span-1">
                <div class="w-12 h-12 bg-saturnator-gray-light rounded-lg overflow-hidden">
                  <img
                    :src="track.coverImage?.url ? assetUrl(track.coverImage.url) : '/default-cover.jpg'"
                    :alt="track.title"
                    class="w-full h-full object-cover"
                    @error="handleImageError"
                  />
                </div>
              </div>

              <!-- Title -->
              <div class="col-span-4">
                <h3 class="font-semibold text-saturnator-gray-dark truncate">{{ track.title }}</h3>
                <p class="text-sm text-saturnator-gray-medium truncate">
                  {{ formatGenres(track.genres) }}
                </p>
              </div>

              <!-- BPM -->
              <div class="col-span-2">
                <span class="text-sm text-saturnator-gray-dark font-medium">
                  {{ track.bpm || 'N/A' }}
                </span>
              </div>

              <!-- Audio Player -->
              <div class="col-span-3">
                <audio
                  v-if="track.audioFile?.url"
                  :src="assetUrl(track.audioFile.url)"
                  controls
                  class="w-full h-8"
                  preload="none"
                >
                  Your browser does not support the audio element.
                </audio>
                <span v-else class="text-sm text-saturnator-gray-medium">No audio file</span>
              </div>

              <!-- Actions -->
              <div class="col-span-2">
                <div class="relative" ref="actionMenuRef">
                  <button
                    @click="toggleActionMenu(track.id)"
                    class="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <svg class="w-5 h-5 text-saturnator-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
                    </svg>
                  </button>

                  <!-- Action Menu Dropdown -->
                  <div
                    v-if="openActionMenu === track.id"
                    class="absolute right-0 mt-2 w-48 bg-white border-2 border-black rounded-lg shadow-lg py-1 z-50"
                  >
                    <NuxtLink
                      :to="`/track/${track.documentId}/edit`"
                      class="block w-full text-left px-4 py-2 text-sm text-saturnator-gray-dark hover:bg-gray-100"
                      @click="closeActionMenu"
                    >
                      Edit Track
                    </NuxtLink>
                    <button
                      @click="deleteTrack(track.id)"
                      class="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete Track
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Upload Button (shown when no tracks or always) -->
        <div class="text-center mt-8">
          <NuxtLink
            to="/upload"
            class="inline-flex items-center px-6 py-3 border-2 border-black text-base font-medium rounded-lg text-saturnator-gray-dark bg-white hover:bg-gray-100 transition-colors"
          >
            {{ tracks.length === 0 ? 'Upload Your First Track' : 'Upload New Track' }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTrackStore } from '../stores/track'
import { useAuthStore } from '../stores/auth'

// Types
interface Track {
  id: string;
  documentId: string;
  title: string;
  bpm?: number;
  coverImage?: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  audioFile?: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  };
  genres?: any;
  users_permissions_user?: {
    id: number;
    username: string;
    email: string;
  };
}

// State
const tracks = ref<Track[]>([])
const loading = ref(false)
const openActionMenu = ref<string | null>(null)
const actionMenuRef = ref<HTMLElement>()

// Stores
const trackStore = useTrackStore()
const authStore = useAuthStore()

// Methods
const assetUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('http') ? url : `http://localhost:1337${url}`
}

const formatGenres = (genres: any): string => {
  if (!genres) return 'Unknown Genre'
  
  if (typeof genres === 'string') {
    try {
      const parsed = JSON.parse(genres)
      return Array.isArray(parsed) ? parsed.join(', ') : parsed
    } catch {
      return genres
    }
  }
  
  if (Array.isArray(genres)) {
    return genres.join(', ')
  }
  
  return 'Unknown Genre'
}

const loadTracks = async () => {
  if (!authStore.getUser?.username) return
  
  loading.value = true
  try {
    const response = await trackStore.get({
      filters: {
        username: { $eq: authStore.getUser.username }
      },
      populate: ['coverImage', 'audioFile', 'users_permissions_user'],
      sort: ['createdAt:desc']
    })
    
    tracks.value = response.data
    
  } catch (error) {
    console.error('Error loading tracks:', error)
  } finally {
    loading.value = false
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.src = '/default-cover.jpg'
  }
}

const toggleActionMenu = (trackId: string) => {
  if (openActionMenu.value === trackId) {
    openActionMenu.value = null
  } else {
    openActionMenu.value = trackId
  }
}

const closeActionMenu = () => {
  openActionMenu.value = null
}

const deleteTrack = async (trackId: string) => {
  if (confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
    try {
      // Remove track from local state first
      tracks.value = tracks.value.filter(track => track.id !== trackId)
      closeActionMenu()
      // Note: You'll need to implement the actual delete API call based on your track store
      console.log('Track deleted:', trackId)
    } catch (error) {
      console.error('Error deleting track:', error)
      alert('Failed to delete track. Please try again.')
    }
  }
}

// Close action menu when clicking outside
onMounted(async () => {
  document.addEventListener('click', (event) => {
    const target = event.target as Element
    if (actionMenuRef.value && !actionMenuRef.value.contains(target)) {
      closeActionMenu()
    }
  })
  
  // Load user's tracks
  loadTracks()
})
</script>

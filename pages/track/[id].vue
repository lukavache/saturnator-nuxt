<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center min-h-screen">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-saturnator-blue-medium"></div>
    </div>

    <!-- Track Details -->
    <div v-else-if="track" class="py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Back Button -->
        <button 
          @click="goBack"
          class="mb-6 flex items-center text-saturnator-gray-medium hover:text-saturnator-gray-dark transition-colors"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Tracks
        </button>

        <!-- Main Track Card -->
        <div class="bg-white rounded-lg shadow-sm p-8">
          <!-- Track Info Section -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <!-- Cover Image -->
            <div class="md:col-span-1">
              <div class="w-48 h-48 md:w-full md:h-auto mx-auto md:mx-0 aspect-square bg-saturnator-gray-light rounded-lg overflow-hidden">
                <img
                  :src="track.coverImage?.url ? assetUrl(track.coverImage.url) : '/default-cover.jpg'"
                  :alt="track.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
              </div>
            </div>

            <!-- Track Info -->
            <div class="md:col-span-3">
              <!-- Title and Artist on one line -->
              <div class="flex items-center justify-between mb-6">
                <h1 class="text-3xl font-bold text-saturnator-gray-dark">
                  {{ track.title }}
                </h1>
                <p class="text-lg text-saturnator-gray-medium text-right">
                  Artist: {{ track.username || track.users_permissions_user?.username || 'Unknown Artist' }}
                </p>
              </div>

              <!-- Genres, BPM, Key on one line -->
              <div class="flex flex-wrap justify-between mb-6">
                <div>
                  <h3 class="text-sm font-semibold text-saturnator-gray-medium uppercase tracking-wide mb-1">
                    Genres
                  </h3>
                  <p class="text-lg text-saturnator-gray-dark">
                    {{ formatGenres(track.genres) }}
                  </p>
                </div>
                <div class="flex flex-row gap-10 text-right">
                  <div>
                    <h3 class="text-sm font-semibold text-saturnator-gray-medium uppercase tracking-wide mb-1">
                      BPM
                    </h3>
                    <p class="text-lg text-saturnator-gray-dark">
                      {{ track.bpm }}
                    </p>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-saturnator-gray-medium uppercase tracking-wide mb-1">
                      Key
                    </h3>
                    <p class="text-lg text-saturnator-gray-dark">
                      {{ track.key }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div v-if="track.description">
                <h3 class="text-sm font-semibold text-saturnator-gray-medium uppercase tracking-wide mb-2">
                  Description
                </h3>
                <p class="text-lg text-saturnator-gray-dark leading-relaxed">
                  {{ track.description }}
                </p>
              </div>
            </div>
          </div>

          <!-- Audio and Samples Section -->
          <div>
            <!-- Main Audio Player -->
            <div class="bg-saturnator-gray-light rounded-lg p-6">
              <audio 
                v-if="track.audioFile?.url"
                :src="assetUrl(track.audioFile.url)"
                controls
                class="w-full"
                preload="metadata"
              >
                Your browser does not support the audio element.
              </audio>
              <p v-else class="text-saturnator-gray-medium text-center py-8">
                Audio file not available
              </p>
            </div>

            <!-- Samples Section -->
            <div v-if="track.samples && track.samples.length > 0">
              <h2 class="text-xl font-bold text-saturnator-gray-dark">
                Samples
              </h2>
              
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                <div 
                  v-for="(sample, index) in track.samples" 
                  :key="index"
                  class="bg-saturnator-gray-light rounded-lg p-4 min-w-0"
                >
                  <h3 class="font-semibold text-saturnator-gray-dark mb-2">
                    Sample {{ index + 1 }}
                  </h3>
                  <audio 
                    :src="assetUrl(sample.url)"
                    controls
                    class="w-full"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h2 class="text-2xl font-bold text-saturnator-gray-dark mb-4">
          Track Not Found
        </h2>
        <p class="text-saturnator-gray-medium mb-6">
          The track you're looking for doesn't exist or has been removed.
        </p>
        <button 
          @click="goBack"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-saturnator-blue-medium hover:bg-saturnator-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saturnator-blue-medium transition-colors duration-200"
        >
          Back to Tracks
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTrackStore } from '../../stores/track'
import { useRoute } from 'vue-router'

// Get track ID from URL since auto-imports aren't working
const route = useRoute()
const trackId = route.params.id as string
const config = useRuntimeConfig()

const assetUrl = (url?: string) => {
  if (!url) return ''
  return url.startsWith('http')
    ? url
    : `${config.public.apiBase}${url}`  // for local/relative URLs
}
// Types
interface Track {
  id: string;
  documentId?: string; // Strapi document ID
  title: string;
  username?: string;
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
  samples?: Array<{
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
  }>;
  genres?: any; // JSON field from Strapi
  bpm?: number;
  key?: string;
  description?: string;
  trackStatus?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  users_permissions_user?: {
    id: number;
    username: string;
    email: string;
  };
}

// State
const track = ref<Track | null>(null)
const loading = ref(true)
const error = ref('')

// Methods
const formatGenres = (genres: any): string => {
  if (!genres) return 'Unknown Genre'
  
  // Handle JSON field from Strapi
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

const loadTrack = async () => {
  loading.value = true
  error.value = ''
  
  try {
    console.log('Loading track with ID:', trackId)
    
    const trackStore = useTrackStore()
    const response = await trackStore.getById(route.params.id as string)
    
    track.value = response.data
    
  } catch (err: any) {
    console.error('Error loading track:', err)
    error.value = err.message || 'Failed to load track'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  // Use window.location for now since auto-imports aren't working
  if (typeof window !== 'undefined') {
    window.location.href = '/'
  }
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.src = '/default-cover.jpg'
  }
}

// Load track on mount
onMounted(async () => {
  await loadTrack()
})
</script>
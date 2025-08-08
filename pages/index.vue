<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Hero Section -->
    <section class="bg-white py-16 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl font-bold text-saturnator-gray-dark mb-4">
          Hello world!
        </h1>
        <h2 class="text-2xl font-bold text-saturnator-gray-dark mb-4">
          Saturnator has launched
        </h2>
        <p class="text-lg font-bold text-saturnator-gray-dark mb-4">
          a new home for artists, listeners and sound explorers.
        </p>
        <p class="text-lg font-bold text-saturnator-gray-dark mb-4">
          Help us grow by sharing the site or supporting with a donation.
        </p>
        <p class="text-lg font-bold text-saturnator-gray-dark mb-4">
          Your energy keeps the music flowing.
        </p>
      </div>
    </section>

    <!-- Track List Section -->
    <section class="py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <h3 class="text-2xl font-bold text-saturnator-gray-dark mb-6">
          Latest Tracks
        </h3>
        
        <!-- Grid Layout for Tracks -->
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <div
            v-for="track in tracks"
            :key="track.id"
            @click="goToTrack(track.documentId)"
            class="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer transform hover:scale-105"
          >
            <!-- Track Cover -->
            <div class="relative">
              <div class="w-full h-32 sm:h-36 md:h-40 lg:h-48 bg-saturnator-gray-light overflow-hidden">
                <img
                  :src="track.coverImage?.url ? `${strapiUrl}${track.coverImage.url}` : '/default-cover.jpg'"
                  :alt="track.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
              </div>
              <!-- Duration Badge -->
              <!-- <div class="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded text-xs">
                4:00
              </div> -->
            </div>
            
            <!-- Track Info -->
            <div class="p-2 sm:p-3">
              <h4 class="font-semibold text-saturnator-gray-dark text-sm mb-1 truncate">
                {{ track.title }}
              </h4>
              <p class="text-xs text-saturnator-gray-medium mb-1 truncate">
                {{ track.username || track.users_permissions_user?.username || 'Unknown Artist' }}
              </p>
              <p class="text-xs text-saturnator-gray-medium truncate">
                {{ formatGenres(track.genres) }}
              </p>
            </div>
          </div>
          
          <!-- Loading Placeholders -->
          <template v-if="loading">
            <div
              v-for="i in 10"
              :key="`placeholder-${i}`"
              class="bg-white rounded-lg shadow-sm animate-pulse overflow-hidden"
            >
              <div class="w-full h-32 bg-saturnator-gray-light"></div>
              <div class="p-3">
                <div class="h-3 bg-saturnator-gray-light rounded mb-1"></div>
                <div class="h-2 bg-saturnator-gray-light rounded mb-1"></div>
                <div class="h-2 bg-saturnator-gray-light rounded w-2/3"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- User/Spotlight Section -->
    <section class="py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Content Area -->
        <div class="border-2 border-black p-8 min-h-64">
          <div class="text-center text-saturnator-gray-medium">
            <p class="text-lg">Featured content coming soon...</p>
          </div>
        </div>
        
        <!-- Pagination Dots -->
        <div class="flex justify-center mt-6 space-x-2">
          <div class="w-2 h-2 bg-saturnator-gray-dark rounded-full"></div>
          <div class="w-2 h-2 bg-saturnator-gray-medium rounded-full"></div>
          <div class="w-2 h-2 bg-saturnator-gray-medium rounded-full"></div>
          <div class="w-2 h-2 bg-saturnator-gray-medium rounded-full"></div>
        </div>
      </div>
    </section>

    <!-- Load More Button -->
    <div v-if="hasMore && !loading" class="text-center py-8">
      <button
        @click="loadMore"
        class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-saturnator-blue-medium hover:bg-saturnator-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saturnator-blue-medium transition-colors duration-200"
      >
        Load More Tracks
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTrackStore } from '../stores/track'

// Types
interface Track {
  id: string;
  documentId: string; // Strapi document ID
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
const tracks = ref<Track[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)
const config = useRuntimeConfig()
const strapiUrl = config.public.apiBase

// Methods
const goToTrack = (trackId: string) => {
navigateTo(`/track/${trackId}`)
}

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

const loadTracks = async () => {
  loading.value = true
  try {
    const trackStore = useTrackStore()
    const response = await trackStore.get({
      filters: {
        trackStatus: { $eq: 'approved' }
      },
      populate: ['coverImage', 'users_permissions_user'],
      pagination: {
        page: page.value,
        pageSize: 20
      },
      sort: ['createdAt:desc']
    })
    
    console.log('Tracks response:', response)
    console.log('Available track IDs:', response.data.map(track => track.id))
    
    // Add new tracks to existing ones for pagination
    tracks.value = [...tracks.value, ...response.data]
    
    // Check if there are more pages
    const pagination = response.meta?.pagination
    if (pagination && 'page' in pagination && 'pageCount' in pagination) {
      hasMore.value = pagination.page < pagination.pageCount
    } else {
      hasMore.value = false
    }
    
  } catch (error) {
    console.error('Error loading tracks:', error)
  } finally {
    loading.value = false
  }
}

const loadMore = () => {
  page.value++
  loadTracks()
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  if (target) {
    target.src = '/default-cover.jpg'
  }
}

// Initial load
onMounted(async () => {
  loadTracks()
})
</script>

<style scoped>
/* Custom animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from { 
    transform: translateY(10px);
    opacity: 0;
  }
  to { 
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
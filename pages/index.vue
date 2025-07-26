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
        
        <!-- Horizontal Scrollable Track List -->
        <div class="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
          <div
            v-for="track in tracks"
            :key="track.id"
            class="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <!-- Track Cover with Duration -->
            <div class="relative">
              <div class="w-full h-48 bg-saturnator-gray-light rounded-t-lg overflow-hidden">
                <img
                  :src="track.coverImage"
                  :alt="track.title"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
              </div>
              <!-- Duration Badge -->
              <div class="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                4:00
              </div>
            </div>
            
            <!-- Track Info -->
            <div class="p-4">
              <h4 class="font-semibold text-saturnator-gray-dark mb-1">
                {{ track.title }}
              </h4>
              <p class="text-sm text-saturnator-gray-medium mb-1">
                {{ track.artist }}
              </p>
              <p class="text-xs text-saturnator-gray-medium">
                {{ track.genres?.[0] || 'Unknown Genre' }}
              </p>
            </div>
          </div>
          
          <!-- Loading Placeholders -->
          <template v-if="loading">
            <div
              v-for="i in 8"
              :key="`placeholder-${i}`"
              class="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm animate-pulse"
            >
              <div class="w-full h-48 bg-saturnator-gray-light rounded-t-lg"></div>
              <div class="p-4">
                <div class="h-4 bg-saturnator-gray-light rounded mb-2"></div>
                <div class="h-3 bg-saturnator-gray-light rounded mb-1"></div>
                <div class="h-3 bg-saturnator-gray-light rounded w-2/3"></div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </section>

    <!-- User/Spotlight Section -->
    <section class="py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Section Headers -->
        <!-- <div class="flex gap-4 mb-6">
          <div class="flex-1 bg-gradient-to-r from-saturnator-purple-medium to-saturnator-purple-dark rounded-lg p-4">
            <h3 class="text-white font-bold text-lg">
              {{ authStore.getUser?.username || 'Username' }}
            </h3>
          </div>
          <div class="flex-1 bg-gradient-to-r from-saturnator-blue-medium to-saturnator-blue-light rounded-lg p-4">
            <h3 class="text-white font-bold text-lg">
              Spotlight
            </h3>
          </div>
        </div> -->
        
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
import { ref, watch, onMounted } from 'vue'

// SEO
definePageMeta({
  title: 'Saturnator - Music Platform'
})

// Store
const authStore = useAuthStore()

// Types
interface Track {
  id: string
  title: string
  artist: string
  coverImage: string
  genres: string[]
  bpm: number
}

// State
const tracks = ref<Track[]>([])
const loading = ref(false)
const hasMore = ref(true)
const page = ref(1)

// Methods
const loadTracks = async () => {
  loading.value = true
  try {
    const { find } = useStrapi()
    const response = await find('tracks', {
      filters: {
        status: 'approved'
      },
      populate: ['coverImage', 'genres'],
      pagination: {
        page: page.value,
        pageSize: 12
      },
      sort: { createdAt: 'desc' }
    })
    
    console.log('Tracks response:', response)
    
    // Transform the response to match your Track interface
    const newTracks = response.data.map((item: any) => ({
      id: item.id,
      title: item.attributes.title,
      artist: item.attributes.artist,
      coverImage: item.attributes.coverImage?.data?.attributes?.url || '/default-cover.jpg',
      genres: item.attributes.genres?.data?.map((g: any) => g.attributes.name) || [],
      bpm: item.attributes.bpm || 0
    }))
    
    tracks.value = [...tracks.value, ...newTracks]
    hasMore.value = response.meta.pagination.page < response.meta.pagination.pageCount
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
  await authStore.initializeAuth()
  loadTracks()
})
</script>

<style scoped>
/* Hide scrollbar for horizontal track list */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

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
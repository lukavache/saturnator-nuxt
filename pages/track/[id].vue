<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Loading State -->
    <div v-if="loading" class="flex min-h-[60vh] items-center justify-center">
      <div class="h-12 w-12 animate-spin rounded-full border-4 border-saturnator-gray-light border-b-saturnator-blue-medium"></div>
    </div>

    <!-- Track Details -->
    <div v-else-if="track" class="px-4 py-8 sm:px-6 lg:px-8">
      <div class="mx-auto max-w-6xl">
        <button 
          @click="goBack"
          class="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-saturnator-gray-dark transition-colors hover:text-saturnator-blue-medium"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
          Back to Tracks
        </button>

        <article class="overflow-hidden rounded-lg border-2 border-black bg-white shadow-sm">
          <div class="grid gap-0 lg:grid-cols-[minmax(280px,0.9fr)_minmax(0,1.6fr)]">
            <aside class="border-b-2 border-black bg-[#eef0ff] p-5 sm:p-8 lg:border-b-0 lg:border-r-2">
              <div class="mx-auto max-w-sm">
                <div class="aspect-square overflow-hidden rounded-lg border-2 border-black bg-white shadow-sm">
                  <img
                    :src="coverUrl"
                    :alt="track.title"
                    class="h-full w-full object-cover"
                    @error="handleImageError"
                  />
                </div>

                <div class="mt-5 rounded-lg border-2 border-black bg-white p-4">
                  <div class="flex items-center justify-between gap-4">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
                        Artist
                      </p>
                      <p class="mt-1 text-lg font-bold text-saturnator-gray-dark">
                        {{ artistName }}
                      </p>
                    </div>
                    <LikeButton 
                      :track-id="Number(track.id)" 
                      :track-doc-id="track.documentId" 
                      :like-count="likeCount"
                      @update:like-count="updateLikeCount"
                    />
                  </div>
                  <div v-if="artistUserId" class="mt-4 border-t-2 border-black pt-4">
                    <p class="mb-2 text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
                      Support on Spotlight
                    </p>
                    <SponsorButton :artist-id="String(artistUserId)" price-usd="0.10" />
                    <NuxtLink to="/spotlight" class="mt-2 inline-block text-xs font-semibold text-saturnator-blue-medium underline">
                      View Spotlight leaderboard
                    </NuxtLink>
                  </div>
                </div>
              </div>
            </aside>

            <section class="p-5 sm:p-8">
              <div class="flex flex-col gap-5">
                <div>
                  <div class="mb-3 flex flex-wrap items-center gap-2">
                    <span class="rounded-full border border-black bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-saturnator-gray-dark">
                      {{ track.trackStatus || 'approved' }}
                    </span>
                    <span v-if="track.createdAt" class="text-sm font-medium text-saturnator-gray-medium">
                      {{ formatDate(track.createdAt) }}
                    </span>
                  </div>

                  <h1 class="break-words text-4xl font-black leading-tight text-saturnator-gray-dark sm:text-5xl">
                    {{ track.title }}
                  </h1>

                  <p class="mt-3 text-lg font-semibold text-saturnator-gray-medium">
                    by {{ artistName }}
                  </p>
                </div>

                <div class="w-full max-w-xl">
                  <LicensePurchaseButton
                    :track-id="String(track.documentId || track.id)"
                    :price-usd="track.licensePriceUsd"
                    :x402-enabled="track.x402Enabled"
                    :track-title="track.title"
                  />
                </div>

                <div class="rounded-lg border-2 border-black bg-saturnator-gray-light p-4">
                  <div class="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
                        Now Playing
                      </p>
                      <p class="font-bold text-saturnator-gray-dark">
                        {{ track.title }}
                      </p>
                    </div>
                  </div>
                  <audio 
                    v-if="track.audioFile?.url"
                    :src="assetUrl(track.audioFile.url)"
                    controls
                    class="w-full"
                    preload="metadata"
                  >
                    Your browser does not support the audio element.
                  </audio>
                  <p v-else class="py-5 text-center font-medium text-saturnator-gray-medium">
                    Audio file not available
                  </p>
                </div>

                <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div class="rounded-lg border border-black bg-white p-4">
                    <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
                      BPM
                    </p>
                    <p class="mt-2 text-2xl font-black text-saturnator-gray-dark">
                      {{ track.bpm || 'N/A' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-black bg-white p-4">
                    <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
                      Key
                    </p>
                    <p class="mt-2 text-2xl font-black text-saturnator-gray-dark">
                      {{ track.key || 'N/A' }}
                    </p>
                  </div>
                  <div class="rounded-lg border border-black bg-white p-4 sm:col-span-2">
                    <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
                      Genres
                    </p>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <span
                        v-for="genre in genreTags"
                        :key="genre"
                        class="rounded-full bg-saturnator-gray-light px-3 py-1 text-sm font-semibold text-saturnator-gray-dark"
                      >
                        {{ genre }}
                      </span>
                    </div>
                  </div>
                </div>

                <div v-if="track.description" class="border-t-2 border-black pt-6">
                  <h2 class="text-sm font-bold uppercase tracking-wide text-saturnator-gray-medium">
                    Description
                  </h2>
                  <p class="mt-3 whitespace-pre-line text-lg leading-relaxed text-saturnator-gray-dark">
                    {{ track.description }}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <section v-if="track.samples && track.samples.length > 0" class="border-t-2 border-black p-5 sm:p-8">
            <div class="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 class="text-2xl font-black text-saturnator-gray-dark">
                  Samples
                </h2>
                <p class="mt-1 text-sm font-medium text-saturnator-gray-medium">
                  Extra audio included with this track.
                </p>
              </div>
              <span class="rounded-full border border-black px-3 py-1 text-sm font-bold text-saturnator-gray-dark">
                {{ track.samples.length }}
              </span>
            </div>
            
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div 
                v-for="(sample, index) in track.samples" 
                :key="sample.url || index"
                class="rounded-lg border border-black bg-white p-4"
              >
                <div class="mb-3 flex items-center justify-between gap-3">
                  <h3 class="font-bold text-saturnator-gray-dark">
                    {{ sample.name || `Sample ${index + 1}` }}
                  </h3>
                  <span class="text-xs font-bold text-saturnator-gray-medium">
                    {{ index + 1 }}
                  </span>
                </div>
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
          </section>
        </article>
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
import { computed, ref, onMounted } from 'vue'
import { useTrackStore } from '../../stores/track'
import { useRoute } from 'vue-router'
import LicensePurchaseButton from '../../components/payments/LicensePurchaseButton.vue'
import SponsorButton from '../../components/spotlight/SponsorButton.vue'

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
    name?: string;
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
  x402Enabled?: boolean;
  licensePriceUsd?: string | null;
  licenseType?: string;
  licenseVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  users_permissions_user?: {
    id: number;
    username: string;
    email: string;
  };
  likes?: Array<{
    id: number;
    track: string;
    user: string;
  }>;
}

// State
const track = ref<Track | null>(null)
const loading = ref(true)
const error = ref('')
const likeCount = ref(0)

const artistName = computed(() => {
  return track.value?.username || track.value?.users_permissions_user?.username || 'Unknown Artist'
})

const artistUserId = computed(() => {
  return track.value?.users_permissions_user?.id ?? null
})

const coverUrl = computed(() => {
  return track.value?.coverImage?.url ? assetUrl(track.value.coverImage.url) : '/default-cover.jpg'
})

const genreTags = computed(() => {
  const genres = track.value?.genres
  if (!genres) return ['Unknown Genre']

  if (typeof genres === 'string') {
    try {
      const parsed = JSON.parse(genres)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return genres.split(',').map((genre) => genre.trim()).filter(Boolean)
    }
  }

  if (Array.isArray(genres)) {
    return genres.length > 0 ? genres : ['Unknown Genre']
  }

  return ['Unknown Genre']
})

// Methods
const formatDate = (date: string) => {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(date))
}

const updateLikeCount = (count: number) => {
  likeCount.value = count
}

const loadTrack = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const trackStore = useTrackStore()
    const response = await trackStore.getById(route.params.id as string)
    
    track.value = response.data
    likeCount.value = response.data.likes?.length || 0
    
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

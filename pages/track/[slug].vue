<template>
  <div class="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
    <div v-if="loading" class="text-center py-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
    </div>

    <div v-else-if="track" class="bg-white rounded-lg shadow-sm overflow-hidden">
      <!-- Track Header -->
      <div class="relative h-64 bg-gradient-to-r from-blue-600 to-purple-600">
        <img
          v-if="track.coverImage"
          :src="track.coverImage"
          :alt="track.title"
          class="w-full h-full object-cover"
        />
        <div class="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div class="text-center text-white">
            <h1 class="text-4xl font-bold mb-2">{{ track.title }}</h1>
            <p class="text-xl">{{ track.artist }}</p>
          </div>
        </div>
      </div>

      <!-- Track Content -->
      <div class="p-6">
        <!-- Audio Player -->
        <div class="mb-6">
          <audio
            v-if="track.audioFile"
            :src="track.audioFile"
            controls
            class="w-full"
            preload="metadata"
          >
            Your browser does not support the audio element.
          </audio>
        </div>

        <!-- Track Info -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">Track Information</h2>
            
            <div class="space-y-3">
              <div>
                <span class="font-medium text-gray-700">Artist:</span>
                <span class="ml-2 text-gray-900">{{ track.artist }}</span>
              </div>
              
              <div v-if="track.bpm">
                <span class="font-medium text-gray-700">BPM:</span>
                <span class="ml-2 text-gray-900">{{ track.bpm }}</span>
              </div>
              
              <div v-if="track.trackType">
                <span class="font-medium text-gray-700">Type:</span>
                <span class="ml-2 text-gray-900 capitalize">{{ track.trackType }}</span>
              </div>
              
              <div v-if="track.genres && track.genres.length">
                <span class="font-medium text-gray-700">Genres:</span>
                <div class="mt-1 flex flex-wrap gap-2">
                  <span
                    v-for="genre in track.genres"
                    :key="genre"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {{ genre }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h2 class="text-2xl font-semibold text-gray-900 mb-4">Description</h2>
            <p v-if="track.description" class="text-gray-700 leading-relaxed">
              {{ track.description }}
            </p>
            <p v-else class="text-gray-500 italic">
              No description available.
            </p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-wrap gap-4">
          <button
            v-if="track.audioFile"
            @click="downloadTrack"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            Download
          </button>
          
          <button
            @click="shareTrack"
            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
            </svg>
            Share
          </button>
        </div>
      </div>
    </div>

    <div v-else class="text-center py-8">
      <h2 class="text-2xl font-semibold text-gray-900 mb-2">Track Not Found</h2>
      <p class="text-gray-600 mb-4">The track you're looking for doesn't exist or has been removed.</p>
      <NuxtLink
        to="/"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Back to Library
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// Get route params
const route = useRoute()
const slug = route.params.slug as string

// SEO
definePageMeta({
  title: 'Track Details - Saturnator'
})

// State
const track = ref(null)
const loading = ref(true)

// Methods
const loadTrack = async () => {
  try {
    const { findOne } = useStrapi()
    const response = await findOne('tracks', slug, {
      populate: '*'
    })
    
    // Transform the response to match our interface
    track.value = {
      id: response.data.id,
      title: response.data.attributes.title,
      artist: response.data.attributes.artist,
      description: response.data.attributes.description,
      bpm: response.data.attributes.bpm,
      trackType: response.data.attributes.trackType,
      coverImage: response.data.attributes.coverImage?.data?.attributes?.url,
      audioFile: response.data.attributes.audioFile?.data?.attributes?.url,
      genres: response.data.attributes.genres?.data?.map((g: any) => g.attributes.name) || []
    }
  } catch (err) {
    console.error('Error loading track:', err)
    track.value = null
  } finally {
    loading.value = false
  }
}

const downloadTrack = () => {
  if (track.value?.audioFile) {
    const link = document.createElement('a')
    link.href = track.value.audioFile
    link.download = `${track.value.title} - ${track.value.artist}.mp3`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

const shareTrack = () => {
  if (navigator.share) {
    navigator.share({
      title: track.value?.title,
      text: `Check out "${track.value?.title}" by ${track.value?.artist} on Saturnator`,
      url: window.location.href
    })
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(window.location.href)
    alert('Link copied to clipboard!')
  }
}

// Load track on mount
onMounted(() => {
  loadTrack()
})
</script> 
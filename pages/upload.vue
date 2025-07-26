<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Hero Section -->
    <section class="bg-white py-12 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl font-bold text-saturnator-gray-dark mb-4">
          Share Your Music
        </h1>
        <p class="text-lg text-saturnator-gray-medium mb-6">
          Upload your tracks and join the Saturnator community
        </p>
      </div>
    </section>

    <!-- Upload Form Section -->
    <section class="py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-lg shadow-sm p-8">
          <form @submit.prevent="handleSubmit" class="space-y-8">
            <!-- Track Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Track Title -->
              <div>
                <label for="title" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Track Title *
                </label>
                <input
                  id="title"
                  v-model="form.title"
                  type="text"
                  required
                  class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                  placeholder="Enter track title"
                />
              </div>

              <!-- Artist Name -->
              <div>
                <label for="artist" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Artist Name *
                </label>
                <input
                  id="artist"
                  v-model="form.artist"
                  type="text"
                  required
                  class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                  placeholder="Enter artist name"
                />
              </div>
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                Description
              </label>
              <textarea
                id="description"
                v-model="form.description"
                rows="4"
                class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                placeholder="Describe your track..."
              ></textarea>
            </div>

            <!-- Track Details -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <!-- BPM -->
              <div>
                <label for="bpm" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  BPM
                </label>
                <input
                  id="bpm"
                  v-model.number="form.bpm"
                  type="number"
                  min="1"
                  max="999"
                  class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                  placeholder="120"
                />
              </div>

              <!-- Track Type -->
              <div>
                <label for="trackType" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Track Type *
                </label>
                <select
                  id="trackType"
                  v-model="form.trackType"
                  required
                  class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                >
                  <option value="">Select track type</option>
                  <option value="sample">Sample</option>
                  <option value="track">Track</option>
                  <option value="album">Album</option>
                </select>
              </div>

              <!-- Status -->
              <div>
                <label class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Status
                </label>
                <div class="px-4 py-3 bg-saturnator-gray-light rounded-lg">
                  <span class="text-saturnator-gray-medium">Pending Review</span>
                </div>
              </div>
            </div>

            <!-- Genre Selection -->
            <div>
              <label class="block text-sm font-semibold text-saturnator-gray-dark mb-4">
                Genres *
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label v-for="genre in genres" :key="genre.id" class="flex items-center p-3 border border-saturnator-gray-light rounded-lg hover:bg-saturnator-gray-light transition-colors">
                  <input
                    type="checkbox"
                    :value="genre.id"
                    v-model="form.genres"
                    class="rounded border-saturnator-gray-medium text-saturnator-blue-medium focus:ring-saturnator-blue-medium"
                  />
                  <span class="ml-3 text-sm text-saturnator-gray-dark">{{ genre.name }}</span>
                </label>
              </div>
            </div>

            <!-- File Uploads -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Audio File Upload -->
              <div>
                <label for="audioFile" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Audio File *
                </label>
                <div class="border-2 border-dashed border-saturnator-gray-light rounded-lg p-6 text-center hover:border-saturnator-blue-medium transition-colors">
                  <input
                    id="audioFile"
                    ref="audioFileInput"
                    type="file"
                    accept="audio/*"
                    required
                    @change="handleAudioFileChange"
                    class="hidden"
                  />
                  <label for="audioFile" class="cursor-pointer">
                    <div class="text-saturnator-blue-medium mb-2">
                      <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                      </svg>
                    </div>
                    <p class="text-sm text-saturnator-gray-dark font-medium">
                      {{ form.audioFile ? form.audioFile.name : 'Click to upload audio file' }}
                    </p>
                    <p class="text-xs text-saturnator-gray-medium mt-1">
                      MP3, WAV, FLAC (max 50MB)
                    </p>
                  </label>
                </div>
              </div>

              <!-- Cover Image Upload -->
              <div>
                <label for="coverImage" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Cover Image
                </label>
                <div class="border-2 border-dashed border-saturnator-gray-light rounded-lg p-6 text-center hover:border-saturnator-blue-medium transition-colors">
                  <input
                    id="coverImage"
                    ref="coverImageInput"
                    type="file"
                    accept="image/*"
                    @change="handleCoverImageChange"
                    class="hidden"
                  />
                  <label for="coverImage" class="cursor-pointer">
                    <div class="text-saturnator-purple-medium mb-2">
                      <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                      </svg>
                    </div>
                    <p class="text-sm text-saturnator-gray-dark font-medium">
                      {{ form.coverImage ? form.coverImage.name : 'Click to upload cover image' }}
                    </p>
                    <p class="text-xs text-saturnator-gray-medium mt-1">
                      JPG, PNG (max 5MB)
                    </p>
                  </label>
                </div>
              </div>
            </div>

            <!-- Messages -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
              <p class="text-red-600 text-sm">{{ error }}</p>
            </div>

            <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-4">
              <p class="text-green-600 text-sm">{{ success }}</p>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end pt-6">
              <button
                type="submit"
                :disabled="loading"
                class="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-saturnator-blue-medium hover:bg-saturnator-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saturnator-blue-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span v-if="loading" class="mr-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                {{ loading ? 'Uploading...' : 'Upload Track' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

// SEO
definePageMeta({
  title: 'Upload Track - Saturnator',
  middleware: 'auth'
})

// Store
const authStore = useAuthStore()

// Form state
const form = ref({
  title: '',
  description: '',
  artist: '',
  genres: [] as string[],
  bpm: null as number | null,
  trackType: '',
  audioFile: null as File | null,
  coverImage: null as File | null
})

const genres = ref<any[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

// File input refs
const audioFileInput = ref<HTMLInputElement>()
const coverImageInput = ref<HTMLInputElement>()

// Methods
const loadGenres = async () => {
  try {
    const { find } = useStrapi()
    const response = await find('genres')
    genres.value = response.data
  } catch (err) {
    console.error('Error loading genres:', err)
  }
}

const handleAudioFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.value.audioFile = target.files[0]
  }
}

const handleCoverImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.value.coverImage = target.files[0]
  }
}

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''
  
  try {
    // Create FormData for file upload
    const formData = new FormData()
    formData.append('data', JSON.stringify({
      title: form.value.title,
      description: form.value.description,
      artist: form.value.artist,
      genres: form.value.genres,
      bpm: form.value.bpm,
      trackType: form.value.trackType,
      status: 'pending'
    }))
    
    if (form.value.audioFile) {
      formData.append('files.audioFile', form.value.audioFile)
    }
    
    if (form.value.coverImage) {
      formData.append('files.coverImage', form.value.coverImage)
    }
    
    // Submit to Strapi
    const { create } = useStrapi()
    await create('tracks', formData)
    
    success.value = 'Track uploaded successfully! It will be reviewed by our team.'
    
    // Reset form
    form.value = {
      title: '',
      description: '',
      artist: '',
      genres: [],
      bpm: null,
      trackType: '',
      audioFile: null,
      coverImage: null
    }
    
    // Reset file inputs
    if (audioFileInput.value) audioFileInput.value.value = ''
    if (coverImageInput.value) coverImageInput.value.value = ''
    
  } catch (err: any) {
    console.error('Upload error:', err)
    error.value = err.message || 'Upload failed. Please try again.'
  } finally {
    loading.value = false
  }
}

// Load genres on mount
onMounted(async () => {
  // Ensure auth is initialized
  await authStore.initializeAuth()
  
  // Check if user is logged in
  if (!authStore.isLoggedIn) {
    await navigateTo('/login')
    return
  }
  
  // Load genres
  await loadGenres()
})
</script> 
<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Hero Section -->
    <section class="bg-white py-12 px-4">
      <div class="max-w-4xl mx-auto text-center">
        <h1 class="text-4xl font-bold text-saturnator-gray-dark mb-4">
          Share Your Music
        </h1>
        <p class="text-lg text-saturnator-gray-medium">
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
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- BPM -->
              <div>
                <label for="bpm" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  BPM *
                </label>
                <input
                  id="bpm"
                  v-model.number="form.bpm"
                  type="number"
                  required
                  min="1"
                  max="999"
                  class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                  placeholder="120"
                />
              </div>

              <!-- Track Key -->
              <div>
                <label for="key" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                  Track Key *
                </label>
                <input
                  id="key"
                  v-model="form.key"
                  type="text"
                  required
                  class="w-full px-4 py-3 border border-saturnator-gray-light rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                  placeholder="Enter track key"
                />
              </div>
            </div>

            <!-- Genre Selection -->
            <div>
              <label class="block text-sm font-semibold text-saturnator-gray-dark mb-4">
                Genres *
              </label>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <label v-for="genre in genreOptions" :key="genre" class="flex items-center p-3 border border-saturnator-gray-light rounded-lg hover:bg-saturnator-gray-light transition-colors">
                  <input
                    type="checkbox"
                    :value="genre"
                    v-model="form.genres"
                    class="rounded border-saturnator-gray-medium text-saturnator-blue-medium focus:ring-saturnator-blue-medium"
                  />
                  <span class="ml-3 text-sm text-saturnator-gray-dark">{{ genre }}</span>
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

            <!-- Samples Upload -->
            <div>
              <label for="samples" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                Samples (Optional)
              </label>
              <div class="border-2 border-dashed border-saturnator-gray-light rounded-lg p-6 text-center hover:border-saturnator-blue-medium transition-colors">
                <input
                  id="samples"
                  ref="samplesInput"
                  type="file"
                  accept="audio/*"
                  multiple
                  @change="handleSamplesChange"
                  class="hidden"
                />
                <label for="samples" class="cursor-pointer">
                  <div class="text-saturnator-green-medium mb-2">
                    <svg class="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                  </div>
                  <p class="text-sm text-saturnator-gray-dark font-medium">
                    {{ form.samples.length > 0 ? `${form.samples.length} file(s) selected` : 'Click to upload sample files' }}
                  </p>
                  <p class="text-xs text-saturnator-gray-medium mt-1">
                    MP3, WAV, FLAC (max 50MB each)
                  </p>
                </label>
              </div>
              
              <!-- Selected Samples List -->
              <div v-if="form.samples.length > 0" class="mt-4">
                <h4 class="text-sm font-semibold text-saturnator-gray-dark mb-2">Selected Samples:</h4>
                <div class="space-y-2">
                  <div v-for="(sample, index) in form.samples" :key="index" class="flex items-center justify-between p-3 bg-saturnator-gray-light rounded-lg">
                    <span class="text-sm text-saturnator-gray-dark">{{ sample.name }}</span>
                    <button 
                      type="button"
                      @click="removeSample(index)"
                      class="text-red-500 hover:text-red-700"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- x402 Licensing (Solana USDC) -->
            <div class="rounded-lg border-2 border-black bg-saturnator-gray-light p-6 space-y-4">
              <div>
                <h3 class="text-lg font-bold text-saturnator-gray-dark">Sell licenses with Solana USDC</h3>
                <p class="mt-1 text-sm text-saturnator-gray-medium">
                  You keep copyright. The buyer receives the displayed non-exclusive license for this track and its attached sample pack.
                </p>
              </div>

              <label class="flex items-start gap-3 cursor-pointer">
                <input
                  v-model="form.x402Enabled"
                  type="checkbox"
                  class="mt-1 h-4 w-4 border-2 border-black rounded"
                />
                <span class="text-sm font-semibold text-saturnator-gray-dark">
                  Enable x402 licensing on Solana Devnet
                </span>
              </label>

              <div v-if="form.x402Enabled" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                    License price (USDC)
                  </label>
                  <input
                    v-model="form.licensePriceUsd"
                    type="text"
                    inputmode="decimal"
                    pattern="^\d{1,5}\.\d{2}$"
                    placeholder="0.10"
                    required
                    class="w-full px-4 py-3 border-2 border-black rounded-lg bg-white focus:ring-2 focus:ring-saturnator-blue-medium"
                  />
                  <p class="mt-1 text-xs text-saturnator-gray-medium">Format: 0.01 – 100.00 (two decimals)</p>
                </div>
                <div>
                  <label class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                    License type
                  </label>
                  <select
                    v-model="form.licenseType"
                    class="w-full px-4 py-3 border-2 border-black rounded-lg bg-white focus:ring-2 focus:ring-saturnator-blue-medium"
                  >
                    <option value="non_exclusive_commercial">Non-exclusive commercial</option>
                    <option value="non_exclusive_personal">Non-exclusive personal</option>
                  </select>
                </div>
              </div>

              <p v-if="form.x402Enabled && !walletVerified" class="text-sm font-semibold text-saturnator-red">
                Verify a Solana payout wallet in
                <NuxtLink to="/settings" class="underline">Settings</NuxtLink>
                before enabling licensing. Upload will be rejected without one.
              </p>
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
                class="inline-flex items-center px-8 py-3 border-2 border-black rounded-lg text-base font-medium bg-white hover:bg-saturnator-gray-light focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <span v-if="loading" class="mr-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
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
import { ref, computed, onMounted } from 'vue'

// SEO
definePageMeta({
  title: 'Upload Track - Saturnator',
  middleware: 'auth'
})

// Store
const authStore = useAuthStore()
const uploadStore = useUploadStore()
const config = useRuntimeConfig()
const strapiUrl = config.public.apiBase

const genreOptions = [
  'Electronic',
  'Hip Hop', 
  'Rock',
  'Pop',
  'Jazz',
  'Classical',
  'Country',
  'R&B',
  'Reggae',
  'Metal',
  'Folk',
  'Blues',
  'Punk',
  'Indie',
  'Ambient',
  'Techno',
  'House',
  'Drum & Bass',
  'Trap',
  'Lo-Fi',
  'Experimental',
  'Soundtrack',
  'World Music',
  'Gospel',
  'Soul',
  'Other'
]

// Form state
const form = ref({
  title: '',
  description: '',
  genres: [] as string[],
  bpm: null as number | null,
  key: '',
  audioFile: null as File | null,
  samples: [] as File[],
  coverImage: null as File | null,
  x402Enabled: false,
  licensePriceUsd: '0.10',
  licenseType: 'non_exclusive_commercial' as 'non_exclusive_commercial' | 'non_exclusive_personal',
})

const walletVerified = computed(() => Boolean((authStore.getUser as any)?.payoutWalletVerifiedAt))

const loading = ref(false)
const error = ref('')
const success = ref('')

// File input refs
const audioFileInput = ref<HTMLInputElement>()
const samplesInput = ref<HTMLInputElement>()
const coverImageInput = ref<HTMLInputElement>()

// Methods
const handleAudioFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    form.value.audioFile = target.files[0]
  }
}

const handleSamplesChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    // Convert FileList to Array and add to existing samples
    const newFiles = Array.from(target.files)
    form.value.samples = [...form.value.samples, ...newFiles]
  }
}

const removeSample = (index: number) => {
  form.value.samples.splice(index, 1)
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
    // STEP 1: Upload files first
    const uploadPromises: number[] = []
    
    if (form.value.audioFile) {
      const audioResult = await uploadStore.uploadFile(form.value.audioFile)
      uploadPromises.push(audioResult[0].id)
    }

    if (form.value.coverImage) {
      const imageResult = await uploadStore.uploadFile(form.value.coverImage)
      uploadPromises.push(imageResult[0].id)
    }

    // Upload samples if any
    if (form.value.samples.length > 0) {
      const samplesResult = await uploadStore.uploadMultipleFiles(form.value.samples)
      
      // Add all sample IDs to uploadPromises
      samplesResult.forEach((file: any) => {
        uploadPromises.push(file.id)
      })
    }

    // STEP 2: Create track with file IDs
    const trackData: any = {
      title: form.value.title,
      description: form.value.description,
      bpm: form.value.bpm,
      key: form.value.key,
      trackStatus: 'pending',
      username: authStore.getUser?.username,
      x402Enabled: form.value.x402Enabled,
    }

    if (form.value.x402Enabled) {
      if (!walletVerified.value) {
        throw new Error('Verify a Solana payout wallet in Settings before enabling licensing.')
      }
      if (!/^\d{1,5}\.\d{2}$/.test(form.value.licensePriceUsd)) {
        throw new Error('License price must look like 0.10 (two decimal places).')
      }
      trackData.licensePriceUsd = form.value.licensePriceUsd
      trackData.licenseType = form.value.licenseType
      trackData.licenseVersion = 'saturnator-license-v1'
    }

    // Add file IDs to the track data
    if (uploadPromises.length > 0) {
      if (form.value.audioFile) {
        trackData.audioFile = uploadPromises[0] // First uploaded file
      }
      if (form.value.coverImage) {
        trackData.coverImage = uploadPromises[1] || uploadPromises[0] // Second uploaded file or first if only one
      }
      if (form.value.samples.length > 0) {
        // Add sample IDs starting from the appropriate index
        const sampleStartIndex = (form.value.audioFile ? 1 : 0) + (form.value.coverImage ? 1 : 0)
        trackData.samples = uploadPromises.slice(sampleStartIndex)
      }
    }

    // Add genres if selected - send as JSON array
    if (form.value.genres && form.value.genres.length > 0) {
      trackData.genres = form.value.genres // Send as array directly
    }

    const created = await uploadStore.createTrack(trackData)

    success.value = 'Track uploaded successfully! It will be reviewed by our team.'

    // Reset form
    form.value = {
      title: '',
      description: '',
      genres: [],
      bpm: null,
      key: '',
      audioFile: null,
      samples: [],
      coverImage: null,
      x402Enabled: false,
      licensePriceUsd: '0.10',
      licenseType: 'non_exclusive_commercial',
    }

    if (audioFileInput.value) audioFileInput.value.value = ''
    if (samplesInput.value) samplesInput.value.value = ''
    if (coverImageInput.value) coverImageInput.value.value = ''

  } catch (err: any) {
    console.error('Upload error:', err)
    error.value = err.message || 'Upload failed. Please try again.'
  } finally {
    loading.value = false
  }
}

// Initial load
// onMounted(async () => {
//   await authStore.initializeAuth()
  
//   // Check if user is logged in
//   if (!authStore.isLoggedIn) {
//     await navigateTo('/login')
//     return
//   }
// })
</script> 
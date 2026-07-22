<template>
  <div class="space-y-3">
    <div v-if="!licensable" class="text-sm font-medium text-saturnator-gray-medium">
      Licensing not enabled for this track.
    </div>

    <template v-else>
      <div v-if="state === 'loading'" class="text-sm font-medium text-saturnator-gray-medium">
        Checking license…
      </div>

      <div v-else-if="state === 'owned' && receipt" class="flex flex-wrap items-center gap-3">
        <span class="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-sm font-bold text-saturnator-gray-dark">
          Owned · {{ receipt.licenseType?.replace(/_/g, ' ') }}
        </span>
        <button
          type="button"
          class="rounded-lg border-2 border-black bg-saturnator-blue-medium px-4 py-2 text-sm font-bold text-white hover:bg-saturnator-blue-dark transition-colors"
          :disabled="downloading"
          @click="download"
        >
          {{ downloading ? 'Preparing…' : 'Download' }}
        </button>
        <button
          type="button"
          class="rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold text-saturnator-gray-dark hover:bg-gray-100 transition-colors"
          @click="showReceipt = true"
        >
          Receipt
        </button>
      </div>

      <div v-else class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="rounded-lg border-2 border-black bg-saturnator-blue-medium px-4 py-2 text-sm font-bold text-white hover:bg-saturnator-blue-dark transition-colors disabled:opacity-50"
          :disabled="busy"
          @click="buy"
        >
          {{ buttonLabel }}
        </button>
        <p class="text-sm font-medium text-saturnator-gray-medium">
          Free preview stays free. Purchase unlocks the original + sample pack.
        </p>
      </div>

      <p v-if="error" class="text-sm font-semibold text-saturnator-red">{{ error }}</p>
    </template>

    <PaymentReceiptModal
      v-if="showReceipt && receipt"
      :receipt="receipt"
      @close="showReceipt = false"
      @download="download"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useLicenseStore, type LicenseReceipt } from '../stores/license'
import PaymentReceiptModal from './PaymentReceiptModal.vue'

const props = defineProps<{
  trackId: string
  priceUsd?: string | null
  x402Enabled?: boolean
  trackTitle?: string
}>()

const auth = useAuthStore()
const licenseStore = useLicenseStore()

const state = ref<'loading' | 'preview' | 'owned'>('loading')
const receipt = ref<LicenseReceipt | null>(null)
const error = ref('')
const busy = ref(false)
const downloading = ref(false)
const showReceipt = ref(false)

const licensable = computed(() => Boolean(props.x402Enabled && props.priceUsd))

const buttonLabel = computed(() => {
  if (!auth.isLoggedIn) return 'Sign in to buy license'
  const price = props.priceUsd || '—'
  return `Buy license · ${price} USDC`
})

async function refresh() {
  if (!licensable.value) {
    state.value = 'preview'
    return
  }
  state.value = 'loading'
  error.value = ''
  if (!auth.isLoggedIn) {
    state.value = 'preview'
    receipt.value = null
    return
  }
  const owned = await licenseStore.checkOwnership(props.trackId)
  if (owned) {
    receipt.value = owned
    state.value = 'owned'
  } else {
    receipt.value = null
    state.value = 'preview'
  }
}

async function buy() {
  error.value = ''
  if (!auth.isLoggedIn) {
    await navigateTo(`/login?redirect=/track/${props.trackId}`)
    return
  }
  busy.value = true
  try {
    await licenseStore.startLicensePurchase(props.trackId)
  } catch (e: any) {
    error.value = e?.message || 'Could not start payment'
    busy.value = false
  }
}

async function download() {
  if (!receipt.value?.purchaseId) return
  downloading.value = true
  error.value = ''
  try {
    const bundle = await licenseStore.fetchDownloadBundle(receipt.value.purchaseId)
    if (!bundle.files?.length) throw new Error('No downloadable files on this license')
    for (const file of bundle.files) {
      const a = document.createElement('a')
      a.href = file.url
      a.download = file.name
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }
  } catch (e: any) {
    error.value = e?.message || 'Download failed'
  } finally {
    downloading.value = false
  }
}

onMounted(refresh)
watch(() => [props.trackId, props.x402Enabled, props.priceUsd, auth.isLoggedIn], refresh)
</script>

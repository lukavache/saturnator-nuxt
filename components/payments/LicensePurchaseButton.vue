<template>
  <div class="space-y-3">
    <div v-if="!licensable" class="text-sm font-medium text-saturnator-gray-medium">
      Licensing not enabled for this track.
    </div>

    <template v-else>
      <div v-if="state === 'loading'" class="text-sm font-medium text-saturnator-gray-medium">
        Checking license…
      </div>

      <div v-else-if="state === 'pending'" class="space-y-2">
        <p class="text-sm font-semibold text-saturnator-gray-dark">Confirming payment…</p>
        <p class="text-xs font-medium text-saturnator-gray-medium">
          Do not pay again. Rank and ownership update only after settlement is recorded.
        </p>
      </div>

      <div v-else-if="state === 'owned' && receipt" class="flex flex-wrap items-center gap-3">
        <span class="rounded-lg border-2 border-black bg-white px-3 py-1.5 text-sm font-bold text-saturnator-gray-dark">
          Owned · {{ receipt.licenseType?.replace(/_/g, ' ') }}
        </span>
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border-2 border-black bg-[#3686FF] px-4 py-2 text-sm font-bold text-white hover:bg-[#248DDA] transition-colors"
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

      <div v-else class="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <button
          type="button"
          class="inline-flex items-center justify-center rounded-lg border-2 border-black bg-[#3686FF] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#248DDA] transition-colors disabled:opacity-50"
          :disabled="busy"
          @click="buy"
        >
          {{ buttonLabel }}
        </button>
        <p class="text-sm font-medium text-saturnator-gray-medium sm:max-w-xs">
          Free preview stays free. Purchase unlocks the original + sample pack.
        </p>
      </div>

      <p v-if="error" class="text-sm font-semibold text-[#ED1C24]">{{ error }}</p>
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
import { mapX402UserError } from '../utils/x402-errors'
import PaymentReceiptModal from './PaymentReceiptModal.vue'

const props = defineProps<{
  trackId: string
  priceUsd?: string | null
  x402Enabled?: boolean
  trackTitle?: string
}>()

const auth = useAuthStore()
const licenseStore = useLicenseStore()

const state = ref<'loading' | 'preview' | 'owned' | 'pending'>('loading')
const receipt = ref<LicenseReceipt | null>(null)
const error = ref('')
const busy = ref(false)
const downloading = ref(false)
const showReceipt = ref(false)

const licensable = computed(() => Boolean(props.x402Enabled && props.priceUsd))

const buttonLabel = computed(() => {
  if (!auth.isLoggedIn) return 'Sign in to buy license'
  if (state.value === 'pending') return 'Confirming payment…'
  const price = props.priceUsd || '—'
  return busy.value ? 'Opening paywall…' : `Buy license · ${price} USDC`
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
  } else if (licenseStore.pendingByTrack[props.trackId]) {
    state.value = 'pending'
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
    // Full navigation to the paywall should unload this page. If we're still
    // here shortly after, reset so the button is not stuck on "Opening…".
    window.setTimeout(() => {
      busy.value = false
      error.value =
        'Paywall did not open. Confirm `npm run pages:dev` is running on :8788, then retry.'
    }, 2500)
  } catch (e: any) {
    error.value = mapX402UserError(e)
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
    error.value = mapX402UserError(e)
  } finally {
    downloading.value = false
  }
}

onMounted(async () => {
  busy.value = false
  await refresh()
  // Returning from paywall: if not yet owned, poll without inviting a second charge.
  if (auth.isLoggedIn && licensable.value && state.value === 'preview') {
    const params = new URLSearchParams(window.location.search)
    if (params.get('x402') === 'pending' || params.get('payment') === '1') {
      state.value = 'pending'
      error.value = mapX402UserError({ code: 'pending_entitlement' })
      const owned = await licenseStore.pollOwnershipUntilSettled(props.trackId)
      if (owned) {
        receipt.value = owned
        state.value = 'owned'
        error.value = ''
      } else {
        error.value = mapX402UserError({ code: 'settlement_timeout' })
        state.value = 'preview'
      }
    }
  }
})
watch(() => [props.trackId, props.x402Enabled, props.priceUsd, auth.isLoggedIn], refresh)

</script>

<template>
  <div class="space-y-2">
    <button
      type="button"
      class="rounded-lg border-2 border-black bg-saturnator-blue-medium px-4 py-2 text-sm font-bold text-white hover:bg-saturnator-blue-dark transition-colors disabled:opacity-50"
      :disabled="busy"
      @click="sponsor"
    >
      {{ label }}
    </button>
    <p v-if="busy" class="text-xs font-medium text-saturnator-gray-medium">
      Waiting for wallet / settlement… rank will update only after confirmation.
    </p>
    <p v-if="error" class="text-xs font-semibold text-saturnator-red">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useSpotlightStore } from '../../stores/spotlight'
import { mapX402UserError } from '../../utils/x402-errors'

const props = defineProps<{
  artistId: string
  priceUsd?: string
}>()

const auth = useAuthStore()
const spotlight = useSpotlightStore()
const error = ref('')
const localBusy = ref(false)

const busy = computed(
  () => localBusy.value || spotlight.pendingArtistId === props.artistId,
)

const label = computed(() => {
  if (!auth.isLoggedIn) return 'Sign in to support'
  const price = props.priceUsd || '0.10'
  return busy.value ? 'Confirming…' : `Support with ${price} USDC`
})

async function sponsor() {
  error.value = ''
  if (!auth.isLoggedIn) {
    await navigateTo('/login?redirect=/spotlight')
    return
  }
  localBusy.value = true
  try {
    await spotlight.startSponsorship(props.artistId)
  } catch (e: any) {
    error.value = mapX402UserError(e)
    localBusy.value = false
    spotlight.clearPending()
  }
}
</script>

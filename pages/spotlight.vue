<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <section class="border-b-2 border-black bg-white px-4 py-10">
      <div class="mx-auto max-w-5xl">
        <p class="text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">Fan-powered</p>
        <h1 class="mt-2 text-4xl font-black text-saturnator-gray-dark sm:text-5xl">Artist Spotlight</h1>
        <p class="mt-3 max-w-2xl text-base font-medium text-saturnator-gray-medium">
          {{ board?.explanation || 'Spotlight is paid, transparent promotion. Payments go directly to artists. Organic discovery and likes remain separate.' }}
        </p>
        <div class="mt-4 flex flex-wrap items-center gap-3 text-sm font-semibold text-saturnator-gray-dark">
          <span class="rounded-lg border-2 border-black bg-saturnator-gray-light px-3 py-1">
            Rolling last {{ board?.windowHours || 24 }}h
          </span>
          <span class="rounded-lg border-2 border-black bg-saturnator-gray-light px-3 py-1">
            Support: {{ board?.spotlightPriceUsd || '0.10' }} USDC
          </span>
          <span v-if="board?.generatedAt" class="rounded-lg border-2 border-black bg-white px-3 py-1">
            Updated {{ refreshedLabel }}
          </span>
        </div>
      </div>
    </section>

    <section class="px-4 py-8">
      <div class="mx-auto max-w-5xl space-y-4">
        <div v-if="loading" class="flex justify-center py-16">
          <div class="h-12 w-12 animate-spin rounded-full border-4 border-saturnator-gray-light border-b-saturnator-blue-medium" />
        </div>

        <div v-else-if="error" class="rounded-lg border-2 border-black bg-white p-6">
          <p class="font-semibold text-saturnator-red">{{ error }}</p>
          <button
            type="button"
            class="mt-3 rounded-lg border-2 border-black bg-white px-4 py-2 text-sm font-bold hover:bg-gray-100"
            @click="refresh"
          >
            Retry
          </button>
        </div>

        <div v-else-if="!rows.length" class="rounded-lg border-2 border-black bg-white p-8 text-center">
          <h2 class="text-xl font-black text-saturnator-gray-dark">No sponsored artists in this window yet</h2>
          <p class="mt-2 text-sm font-medium text-saturnator-gray-medium">
            Be the first to support an artist with Devnet USDC. Rank only moves after settlement confirms.
          </p>
        </div>

        <SpotlightCard
          v-for="row in rows"
          :key="row.artistId"
          :row="row"
          :price-usd="board?.spotlightPriceUsd"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useSpotlightStore } from '../stores/spotlight'
import SpotlightCard from '../components/spotlight/SpotlightCard.vue'

definePageMeta({
  title: 'Artist Spotlight - Saturnator',
})

const spotlight = useSpotlightStore()
const tick = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const loading = computed(() => spotlight.loading)
const error = computed(() => spotlight.error)
const board = computed(() => spotlight.board)
const rows = computed(() => board.value?.data || [])

const refreshedLabel = computed(() => {
  tick.value
  const at = board.value?.generatedAt
  if (!at) return ''
  const mins = Math.max(0, Math.round((Date.now() - new Date(at).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  return `${Math.round(mins / 60)}h ago`
})

async function refresh() {
  await spotlight.load({ window: '24h', limit: 20 })
}

onMounted(async () => {
  spotlight.clearPending()
  await refresh()
  timer = setInterval(() => {
    tick.value += 1
  }, 30000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

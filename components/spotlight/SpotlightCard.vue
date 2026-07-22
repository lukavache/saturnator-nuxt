<template>
  <article class="overflow-hidden rounded-lg border-2 border-black bg-white shadow-sm">
    <div class="grid gap-0 md:grid-cols-[88px_minmax(0,1fr)_auto]">
      <div class="flex items-center justify-center border-b-2 border-black bg-[#eef0ff] p-4 md:border-b-0 md:border-r-2">
        <span class="text-3xl font-black text-saturnator-gray-dark">#{{ row.rank }}</span>
      </div>

      <div class="space-y-3 p-4 sm:p-5">
        <div class="flex flex-wrap items-start gap-3">
          <div class="h-14 w-14 shrink-0 overflow-hidden rounded-lg border-2 border-black bg-saturnator-gray-light">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              :alt="row.displayName"
              class="h-full w-full object-cover"
            />
            <div v-else class="flex h-full w-full items-center justify-center text-lg font-black text-saturnator-gray-medium">
              {{ initials }}
            </div>
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="text-xl font-black text-saturnator-gray-dark">{{ row.displayName }}</h3>
              <span class="rounded border border-black bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                Sponsored
              </span>
              <span
                v-if="row.selfSponsored"
                class="rounded border border-black bg-saturnator-gray-light px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-saturnator-gray-medium"
              >
                Includes self-support (capped)
              </span>
            </div>
            <p class="mt-1 text-sm font-medium text-saturnator-gray-medium">@{{ row.username }}</p>
            <p v-if="genreLabel" class="mt-1 text-xs font-semibold uppercase tracking-wide text-saturnator-gray-medium">
              {{ genreLabel }}
            </p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div class="rounded-lg border border-black bg-saturnator-gray-light p-2">
            <p class="text-[10px] font-bold uppercase text-saturnator-gray-medium">Supporters</p>
            <p class="text-lg font-black">{{ row.uniqueSupporters }}</p>
          </div>
          <div class="rounded-lg border border-black bg-saturnator-gray-light p-2">
            <p class="text-[10px] font-bold uppercase text-saturnator-gray-medium">USDC (24h)</p>
            <p class="text-lg font-black">{{ row.totalUsd }}</p>
          </div>
          <div class="rounded-lg border border-black bg-saturnator-gray-light p-2">
            <p class="text-[10px] font-bold uppercase text-saturnator-gray-medium">Score</p>
            <p class="text-lg font-black">{{ row.score.toFixed(1) }}</p>
          </div>
          <div class="rounded-lg border border-black bg-saturnator-gray-light p-2">
            <p class="text-[10px] font-bold uppercase text-saturnator-gray-medium">Supported</p>
            <p class="text-sm font-bold">{{ relativeTime }}</p>
          </div>
        </div>

        <div v-if="row.previewTrack?.audioUrl" class="rounded-lg border-2 border-black bg-saturnator-gray-light p-3">
          <p class="mb-2 text-xs font-bold uppercase tracking-wide text-saturnator-gray-medium">
            Preview · {{ row.previewTrack.title }}
          </p>
          <audio :src="assetUrl(row.previewTrack.audioUrl)" controls class="w-full" preload="metadata" />
        </div>

        <a
          v-if="row.latestExplorerUrl"
          :href="row.latestExplorerUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-block text-sm font-semibold text-saturnator-blue-medium underline"
        >
          Latest Solana proof
        </a>
      </div>

      <div class="flex items-center border-t-2 border-black p-4 md:border-t-0 md:border-l-2">
        <SponsorButton :artist-id="String(row.artistId)" :price-usd="priceUsd" />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SpotlightRow } from '../../stores/spotlight'
import SponsorButton from './SponsorButton.vue'

const props = defineProps<{
  row: SpotlightRow
  priceUsd?: string
}>()

const config = useRuntimeConfig()

const avatarUrl = computed(() => {
  const url = props.row.profileImageUrl || props.row.previewTrack?.coverUrl
  if (!url) return ''
  return url.startsWith('http') ? url : `${config.public.apiBase}${url}`
})

const initials = computed(() => (props.row.displayName || '?').slice(0, 1).toUpperCase())

const genreLabel = computed(() => {
  const genres = props.row.previewTrack?.genres
  if (!genres) return ''
  if (typeof genres === 'string') {
    try {
      const parsed = JSON.parse(genres)
      if (Array.isArray(parsed)) return parsed.slice(0, 3).join(' · ')
      return String(parsed)
    } catch {
      return genres
    }
  }
  if (Array.isArray(genres)) return genres.slice(0, 3).join(' · ')
  return ''
})

const relativeTime = computed(() => {
  const t = new Date(props.row.latestSponsoredAt).getTime()
  if (!Number.isFinite(t)) return 'recently'
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 48) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
})

function assetUrl(url?: string | null) {
  if (!url) return ''
  return url.startsWith('http') ? url : `${config.public.apiBase}${url}`
}
</script>

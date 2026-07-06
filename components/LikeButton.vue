<template>
  <button
    @click="handleLike"
    :disabled="loading"
    type="button"
    :aria-pressed="isLiked"
    :aria-label="isLiked ? 'Unlike track' : 'Like track'"
    class="inline-flex items-center gap-2 rounded-full border border-black bg-white px-4 py-2 text-sm font-semibold text-saturnator-gray-dark shadow-sm transition-colors hover:bg-saturnator-gray-light disabled:cursor-not-allowed disabled:opacity-60"
    :class="{ 'bg-saturnator-gray-dark text-white hover:bg-black': isLiked }"
  >
    <svg
      class="h-5 w-5"
      :class="isLiked ? 'fill-white' : 'fill-none'"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M12 3.5l2.35 5.04 5.52.67-4.08 3.78 1.08 5.46L12 15.75l-4.87 2.7 1.08-5.46-4.08-3.78 5.52-.67L12 3.5z"
      />
    </svg>
    <span>{{ displayedLikeCount }}</span>
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  trackId: number
  trackDocId?: string // Make optional
  likeCount: number
}>()

const emit = defineEmits<{
  'update:likeCount': [count: number]
}>()

const likeStore = useLikeStore()
const authStore = useAuthStore()
const loading = ref(false)
const displayedLikeCount = ref(props.likeCount)

// Use trackDocId if provided, otherwise use trackId as string
const effectiveTrackDocId = computed(() => props.trackDocId || props.trackId.toString())
const isLiked = computed(() => likeStore.isLiked(effectiveTrackDocId.value))

watch(
  () => props.likeCount,
  (likeCount) => {
    displayedLikeCount.value = likeCount
  }
)

// Load user likes when component mounts
onMounted(async () => {
  if (authStore.isLoggedIn) {
    await likeStore.loadUserLikes()
  }
})

const handleLike = async () => {
  if (!authStore.isLoggedIn) {
    await navigateTo('/login')
    return
  }

  loading.value = true
  try {
    if (isLiked.value) {
      // Unlike - find and delete the like
      const userLike = await likeStore.findUserLike(effectiveTrackDocId.value)
      
      if (userLike) {
        // Use documentId if available, otherwise use id
        const likeId = userLike.documentId || userLike.id
        
        await likeStore.deleteLike(likeId)
      }

      likeStore.unmarkLiked(effectiveTrackDocId.value)
      displayedLikeCount.value = Math.max(0, displayedLikeCount.value - 1)
      emit('update:likeCount', displayedLikeCount.value)
    } else {
      // Validate trackDocId before creating
      if (!effectiveTrackDocId.value || effectiveTrackDocId.value.trim() === '') {
        console.error('Invalid trackDocId in component:', effectiveTrackDocId.value);
        return;
      }
      
      const createdLike = await likeStore.create({
        trackDocId: effectiveTrackDocId.value
      })
      if (!createdLike) return

      likeStore.markLiked(effectiveTrackDocId.value)
      displayedLikeCount.value += 1
      emit('update:likeCount', displayedLikeCount.value)
    }
  } catch (error) {
    console.error('Error toggling like:', error)
  } finally {
    loading.value = false
  }
}
</script>

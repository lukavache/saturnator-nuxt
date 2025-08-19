<template>
  <button
    @click="handleLike"
    :disabled="loading"
    class="flex items-center space-x-1 p-2 hover:bg-gray-100 hover:cursor-pointer rounded-lg transition-colors"
    :class="{ 'text-red-500': isLiked }"
  >
    <img 
      :src="isLiked ? '/star-for-likes-active.png' : '/star-for-likes.png'" 
      :alt="isLiked ? 'Unlike' : 'Like'"
      class="h-5 w-5 object-contain"
    />
    <span class="text-sm">{{ likeCount }}</span>
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

// Use trackDocId if provided, otherwise use trackId as string
const effectiveTrackDocId = computed(() => props.trackDocId || props.trackId.toString())
const isLiked = computed(() => likeStore.isLiked(effectiveTrackDocId.value))

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
      console.log('Found user like:', userLike) // Debug log
      
      if (userLike) {
        // Use documentId if available, otherwise use id
        const likeId = userLike.documentId || userLike.id
        console.log('Deleting like with ID:', likeId) // Debug log
        
        await likeStore.deleteLike(likeId)
        
        // Safety check for userLikes
        if (likeStore.userLikes && likeStore.userLikes.value) {
          likeStore.userLikes.value.delete(effectiveTrackDocId.value)
        } else {
          console.warn('userLikes not initialized, skipping remove from set')
        }
        
        emit('update:likeCount', props.likeCount - 1)
      }
    } else {
      // Validate trackDocId before creating
      if (!effectiveTrackDocId.value || effectiveTrackDocId.value.trim() === '') {
        console.error('Invalid trackDocId in component:', effectiveTrackDocId.value);
        return;
      }
      
      await likeStore.create({
        trackDocId: effectiveTrackDocId.value
      })
      
      // Safety check for userLikes
      if (likeStore.userLikes && likeStore.userLikes.value) {
        likeStore.userLikes.value.add(effectiveTrackDocId.value)
      } else {
        console.warn('userLikes not initialized, skipping add to set')
      }
      
      emit('update:likeCount', props.likeCount + 1)
    }
  } catch (error) {
    console.error('Error toggling like:', error)
  } finally {
    loading.value = false
  }
}
</script>
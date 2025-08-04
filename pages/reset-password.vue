<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-saturnator-gray-dark">
          Reset your password
        </h2>
        <p class="mt-2 text-center text-sm text-saturnator-gray-medium">
          Enter your new password below.
        </p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div class="space-y-4">
          <div>
            <label for="password" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
              New password
            </label>
            <input
              id="password"
              v-model="password"
              name="password"
              type="password"
              required
              class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
              placeholder="New password"
            />
          </div>
          
          <div>
            <label for="passwordConfirmation" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
              Confirm password
            </label>
            <input
              id="passwordConfirmation"
              v-model="passwordConfirmation"
              name="passwordConfirmation"
              type="password"
              required
              class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
              placeholder="Confirm new password"
            />
          </div>
        </div>

        <div v-if="message" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p :class="messageType === 'success' ? 'text-green-600' : 'text-red-600'" class="text-sm">
            {{ message }}
          </p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="mr-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </span>
            {{ loading ? 'Resetting...' : 'Reset password' }}
          </button>
        </div>

        <div class="text-center">
          <NuxtLink to="/login" class="font-medium text-saturnator-blue-medium hover:text-saturnator-blue-dark">
            Back to login
          </NuxtLink>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)

const password = ref('')
const passwordConfirmation = ref('')
const message = ref('')
const messageType = ref('')

const code = computed(() => route.query.code)

const isFormValid = computed(() => {
  return password.value && 
         passwordConfirmation.value && 
         password.value === passwordConfirmation.value &&
         password.value.length >= 6
})

const handleSubmit = async () => {
  if (!code.value) {
    message.value = 'Invalid reset link. Please request a new one.'
    messageType.value = 'error'
    return
  }

  try {
    message.value = ''
    await authStore.resetPassword(password.value, passwordConfirmation.value, code.value)
    message.value = 'Password reset successfully! Redirecting to login...'
    messageType.value = 'success'
    
    setTimeout(() => {
      router.push('/login')
    }, 2000)
  } catch (error) {
    message.value = error.message || 'Failed to reset password. Please try again.'
    messageType.value = 'error'
  }
}
</script>

<style scoped>
.success {
  color: green;
}

.error {
  color: red;
}
</style>
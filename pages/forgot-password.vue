<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-saturnator-gray-dark">
          Forgot your password?
        </h2>
        <p class="mt-2 text-center text-sm text-saturnator-gray-medium">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      
      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div>
          <label for="email" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
            Email address
          </label>
          <input
            id="email"
            v-model="email"
            name="email"
            type="email"
            required
            class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
            placeholder="Email address"
          />
        </div>

        <div v-if="message" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p :class="messageType === 'success' ? 'text-green-600' : 'text-red-600'" class="text-sm">
            {{ message }}
          </p>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading"
            class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="mr-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </span>
            {{ loading ? 'Sending...' : 'Send reset link' }}
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

const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)

const email = ref('')
const message = ref('')
const messageType = ref('')

const handleSubmit = async () => {
  try {
    message.value = ''
    await authStore.forgotPassword(email.value)
    message.value = 'Password reset link sent to your email!'
    messageType.value = 'success'
    email.value = ''
  } catch (error) {
    message.value = error.message || 'Failed to send reset link. Please try again.'
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
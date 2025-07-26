<template>
  <div>
    <div>
      <h2>Forgot your password?</h2>
      <p>Enter your email address and we'll send you a link to reset your password.</p>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="email">Email address</label>
        <input
          id="email"
          v-model="email"
          name="email"
          type="email"
          required
          placeholder="Email address"
        />
      </div>

      <div>
        <button
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Sending...' : 'Send reset link' }}
        </button>
      </div>

      <div v-if="message">
        <p :class="messageType === 'success' ? 'success' : 'error'">
          {{ message }}
        </p>
      </div>

      <div>
        <NuxtLink to="/login">Back to login</NuxtLink>
      </div>
    </form>
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
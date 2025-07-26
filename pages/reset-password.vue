<template>
  <div>
    <div>
      <h2>Reset your password</h2>
      <p>Enter your new password below.</p>
    </div>
    
    <form @submit.prevent="handleSubmit">
      <div>
        <label for="password">New password</label>
        <input
          id="password"
          v-model="password"
          name="password"
          type="password"
          required
          placeholder="New password"
        />
      </div>
      
      <div>
        <label for="passwordConfirmation">Confirm password</label>
        <input
          id="passwordConfirmation"
          v-model="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          required
          placeholder="Confirm new password"
        />
      </div>

      <div>
        <button
          type="submit"
          :disabled="loading || !isFormValid"
        >
          {{ loading ? 'Resetting...' : 'Reset password' }}
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
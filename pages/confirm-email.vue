<template>
  <div>
    <div>
      <h2>Confirm your email</h2>
      <p>Please confirm your email address to complete your registration.</p>
    </div>
    
    <div v-if="!loading">
      <div v-if="message">
        <p :class="messageType === 'success' ? 'success' : 'error'">
          {{ message }}
        </p>
      </div>

      <div v-if="!isConfirmed">
        <p>Didn't receive the confirmation email?</p>
        
        <form @submit.prevent="handleResend">
          <div>
            <input
              v-model="email"
              type="email"
              required
              placeholder="Enter your email"
            />
          </div>
          
          <button
            type="submit"
            :disabled="resendLoading"
          >
            {{ resendLoading ? 'Sending...' : 'Resend confirmation email' }}
          </button>
        </form>
      </div>

      <div>
        <NuxtLink to="/login">Back to login</NuxtLink>
      </div>
    </div>

    <div v-else>
      <p>Confirming your email...</p>
    </div>
  </div>
</template>

<script setup>
import { storeToRefs } from 'pinia'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { loading } = storeToRefs(authStore)

const email = ref('')
const message = ref('')
const messageType = ref('')
const isConfirmed = ref(false)
const resendLoading = ref(false)

const confirmationToken = computed(() => route.query.confirmation)

const handleConfirmation = async () => {
  if (!confirmationToken.value) {
    message.value = 'Invalid confirmation link.'
    messageType.value = 'error'
    return
  }

  try {
    await authStore.confirmEmail(confirmationToken.value)
    message.value = 'Email confirmed successfully! You can now log in.'
    messageType.value = 'success'
    isConfirmed.value = true
    
    setTimeout(() => {
      router.push('/login')
    }, 3000)
  } catch (error) {
    message.value = error.message || 'Failed to confirm email. Please try again.'
    messageType.value = 'error'
  }
}

const handleResend = async () => {
  try {
    resendLoading.value = true
    message.value = ''
    await authStore.resendConfirmationEmail(email.value)
    message.value = 'Confirmation email sent! Please check your inbox.'
    messageType.value = 'success'
  } catch (error) {
    message.value = error.message || 'Failed to send confirmation email. Please try again.'
    messageType.value = 'error'
  } finally {
    resendLoading.value = false
  }
}

onMounted(() => {
  if (confirmationToken.value) {
    handleConfirmation()
  }
})
</script>

<style scoped>
.success {
  color: green;
}

.error {
  color: red;
}
</style> 
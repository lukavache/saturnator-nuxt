<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-saturnator-gray-dark">
          Confirm your email
        </h2>
        <p class="mt-2 text-center text-sm text-saturnator-gray-medium">
          Please confirm your email address to complete your registration.
        </p>
      </div>
      
      <div v-if="!loading">
        <div v-if="message" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p :class="messageType === 'success' ? 'text-green-600' : 'text-red-600'" class="text-sm">
            {{ message }}
          </p>
        </div>

        <div v-if="!isConfirmed" class="mt-8 space-y-6">
          <div class="text-center">
            <p class="text-sm text-saturnator-gray-medium mb-4">
              Didn't receive the confirmation email?
            </p>
          </div>
          
          <form @submit.prevent="handleResend" class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">
                Email address
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                required
                class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <button
                type="submit"
                :disabled="resendLoading"
                class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="resendLoading" class="mr-2">
                  <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </span>
                {{ resendLoading ? 'Sending...' : 'Resend confirmation email' }}
              </button>
            </div>
          </form>
        </div>

        <div class="text-center mt-6">
          <NuxtLink to="/login" class="font-medium text-saturnator-blue-medium hover:text-saturnator-blue-dark">
            Back to login
          </NuxtLink>
        </div>
      </div>

      <div v-else class="text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-saturnator-blue-medium mx-auto mb-4"></div>
        <p class="text-saturnator-gray-medium">Confirming your email...</p>
      </div>
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
const emailFromQuery = computed(() => route.query.email)

const handleConfirmation = async () => {
  if (!confirmationToken.value) {
    message.value = 'Invalid confirmation link.'
    messageType.value = 'error'
    return
  }

  try {
    const response = await authStore.confirmEmail(confirmationToken.value)
    message.value = response.message || 'Email confirmed successfully! You can now log in.'
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
  } catch (err) {
    message.value = err.error.message || 'Failed to send confirmation email. Please try again.'
    messageType.value = 'error'
  } finally {
    resendLoading.value = false
  }
}

onMounted(() => {
  if (confirmationToken.value) {
    handleConfirmation()
  }

  if (emailFromQuery.value) {
    email.value = emailFromQuery.value
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
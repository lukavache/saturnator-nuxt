<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-saturnator-gray-dark">
          Create your account
        </h2>
        <p class="mt-2 text-center text-sm text-saturnator-gray-medium">
          Or
          <NuxtLink to="/login" class="font-medium text-[#A07ACC] hover:text-saturnator-purple-dark">
            sign in to your existing account
          </NuxtLink>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleRegister">
        <div class="space-y-4">
          <div>
            <label for="username" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">Username</label>
            <input
              id="username"
              v-model="form.username"
              name="username"
              type="text"
              required
              class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
              placeholder="Username"
            />
          </div>
          <div>
            <label for="email" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">Email address</label>
            <input
              id="email"
              v-model="form.email"
              name="email"
              type="email"
              required
              class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
              placeholder="Email address"
            />
          </div>
          <div>
            <label for="password" class="block text-sm font-semibold text-saturnator-gray-dark mb-2">Password</label>
            <input
              id="password"
              v-model="form.password"
              name="password"
              type="password"
              required
              class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors"
              placeholder="Password"
            />
          </div>
        </div>

        <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-600 text-sm">{{ error }}</p>
        </div>

        <div v-if="success" class="bg-green-50 border border-green-200 rounded-lg p-4">
          <p class="text-green-600 text-sm">{{ success }}</p>
        </div>

        <div v-if="registrationSuccess" class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-green-800">
                Registration successful!
              </h3>
              <div class="mt-2 text-sm text-green-700">
                <p>
                  Please check your email and click the confirmation link to activate your account.
                </p>
                <p class="mt-2">
                  Didn't receive the email? 
                  <button 
                    @click="resendConfirmation" 
                    class="font-medium text-green-800 hover:text-green-900 underline"
                  >
                    Resend confirmation email
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.isLoading"
            class="w-full px-4 py-3 border-2 border-black rounded-lg focus:ring-2 focus:ring-saturnator-blue-medium focus:border-saturnator-blue-medium transition-colors bg-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="authStore.isLoading" class="mr-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </span>
            {{ authStore.isLoading ? 'Creating account...' : 'Create account' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// SEO
definePageMeta({
  title: 'Register - Saturnator',
  layout: 'default'
})

// Store
const authStore = useAuthStore()

// Form state
const form = ref({
  username: '',
  email: '',
  password: ''
})

const error = ref('')
const success = ref('')
const registrationSuccess = ref(false)

// Methods
const handleRegister = async () => {
  error.value = ''
  success.value = ''
  
  try {
    await authStore.register({
      username: form.value.username,
      email: form.value.email,
      password: form.value.password
    })
    
    // Show success message instead of redirecting
    registrationSuccess.value = true
    
    // Clear form
    form.value = {
      username: '',
      email: '',
      password: ''
    }
    
  } catch (err: any) {
    console.error('Registration error:', err)
    
    // Handle specific Strapi error messages
    if (err.error?.message) {
      error.value = err.error.message
    } else if (err.message) {
      error.value = err.message
    } else {
      error.value = 'Registration failed. Please try again.'
    }
  }
}

const resendConfirmation = async () => {
  try {
    await authStore.resendConfirmationEmail(form.value.email)
    // Show success message
  } catch (error) {
    // Handle error
  }
}
</script> 
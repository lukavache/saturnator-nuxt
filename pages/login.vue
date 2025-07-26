<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="text-center text-3xl font-extrabold text-saturnator-gray-dark">
          Sign in to Saturnator
        </h2>
        <p class="mt-2 text-center text-sm text-saturnator-gray-medium">
          Or
          <NuxtLink to="/register" class="font-medium text-[#A07ACC] hover:text-saturnator-purple-dark">
            create a new account
          </NuxtLink>
        </p>
      </div>
      
      <form class="mt-8 space-y-6" @submit.prevent="handleLogin">
        <div class="space-y-4">
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

        <div class="flex items-center justify-between">
          <div class="text-sm">
            <NuxtLink to="/forgot-password" class="font-medium text-saturnator-blue-medium hover:text-saturnator-blue-dark">
              Forgot your password?
            </NuxtLink>
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
            {{ authStore.isLoading ? 'Signing in...' : 'Sign in' }}
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
  title: 'Login - Saturnator',
  layout: 'default'
})

// Store
const authStore = useAuthStore()

// Form state
const form = ref({
  email: '',
  password: ''
})

const error = ref('')

// Methods
const handleLogin = async () => {
  error.value = ''
  
  try {
    await authStore.login({
      identifier: form.value.email,
      password: form.value.password
    })
    
    // Redirect to home page after successful login
    await navigateTo('/')
  } catch (err: any) {
    console.error('Login error:', err)
    error.value = err.message || 'Login failed. Please check your credentials.'
  }
}
</script>
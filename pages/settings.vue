<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Header Section -->
    <section class="bg-white py-8 px-4">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-saturnator-gray-dark mb-2">
          Settings
        </h1>
        <p class="text-saturnator-gray-medium">
          Manage your account and preferences
        </p>
      </div>
    </section>

    <!-- Settings Content -->
    <section class="py-8 px-4">
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Appearance Settings -->
        <div class="bg-white rounded-lg shadow-sm border-2 border-black overflow-hidden">
          <div class="px-6 py-4 border-b-2 border-black">
            <h2 class="text-xl font-semibold text-saturnator-gray-dark">
              Appearance
            </h2>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-lg font-medium text-saturnator-gray-dark mb-1">
                  Dark Mode
                </h3>
                <p class="text-sm text-saturnator-gray-medium">
                  Switch between light and dark themes
                </p>
              </div>
              <button
                @click="toggleDarkMode"
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="isDarkMode ? 'bg-saturnator-blue-medium' : 'bg-gray-200'"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                  :class="isDarkMode ? 'translate-x-6' : 'translate-x-1'"
                ></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Account Settings -->
        <div v-if="authStore.isLoggedIn" class="bg-white rounded-lg shadow-sm border-2 border-black overflow-hidden">
          <div class="px-6 py-4 border-b-2 border-black">
            <h2 class="text-xl font-semibold text-saturnator-gray-dark">
              Account
            </h2>
          </div>
          <div class="p-6 space-y-6">
            <!-- User Info -->
            <div>
              <h3 class="text-lg font-medium text-saturnator-gray-dark mb-4">
                Profile Information
              </h3>
              <div class="grid md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-saturnator-gray-dark mb-2">
                    Username
                  </label>
                  <input
                    v-model="userInfo.username"
                    type="text"
                    class="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-saturnator-gray-dark focus:outline-none focus:ring-2 focus:ring-saturnator-blue-medium"
                    placeholder="Enter username"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-saturnator-gray-dark mb-2">
                    Email
                  </label>
                  <input
                    v-model="userInfo.email"
                    type="email"
                    class="w-full px-3 py-2 border-2 border-black rounded-lg bg-white text-saturnator-gray-dark focus:outline-none focus:ring-2 focus:ring-saturnator-blue-medium"
                    placeholder="Enter email"
                  />
                </div>
              </div>
              <div class="mt-4">
                <button
                  @click="updateProfile"
                  :disabled="updatingProfile"
                  class="bg-white text-saturnator-gray-dark border-2 border-black rounded-lg px-4 py-2 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {{ updatingProfile ? 'Updating...' : 'Update Profile' }}
                </button>
              </div>
            </div>

            <!-- Password Reset -->
            <div class="border-t-2 border-gray-200 pt-6">
              <h3 class="text-lg font-medium text-saturnator-gray-dark mb-4">
                Password Reset
              </h3>
              <p class="text-sm text-saturnator-gray-medium mb-4">
                If you've forgotten your password, we can send you a reset link to your email address.
              </p>
              <button
                @click="sendPasswordReset"
                :disabled="sendingReset"
                class="bg-white text-saturnator-gray-dark border-2 border-black rounded-lg px-4 py-2 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {{ sendingReset ? 'Sending...' : 'Send Password Reset Link' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Not Logged In Message -->
        <div v-else class="bg-white rounded-lg shadow-sm border-2 border-black p-6 text-center">
          <div class="w-16 h-16 bg-saturnator-gray-light rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-saturnator-gray-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h3 class="text-xl font-semibold text-saturnator-gray-dark mb-2">Sign in to manage your account</h3>
          <p class="text-saturnator-gray-medium mb-6">You need to be logged in to access account settings.</p>
          <NuxtLink
            to="/login"
            class="bg-white text-saturnator-gray-dark border-2 border-black rounded-lg px-4 py-2 font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Sign In
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'

// State
const isDarkMode = ref(false)
const updatingProfile = ref(false)
const changingPassword = ref(false)
const sendingReset = ref(false)

// User info for profile update
const userInfo = ref({
  username: '',
  email: ''
})

// Password change form
const passwordChange = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// Store
const authStore = useAuthStore()

// Methods
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  // Save to localStorage
  localStorage.setItem('darkMode', isDarkMode.value.toString())
  // Apply theme (you can implement this based on your needs)
  applyTheme()
}

const applyTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

const updateProfile = async () => {
  if (!authStore.getUser) return
  
  updatingProfile.value = true
  try {
    // Here you would call your API to update the user profile
    console.log('Updating profile:', userInfo.value)
    // Example: await authStore.updateProfile(userInfo.value)
    
    // For now, just show success
    alert('Profile updated successfully!')
  } catch (error) {
    console.error('Error updating profile:', error)
    alert('Failed to update profile. Please try again.')
  } finally {
    updatingProfile.value = false
  }
}

const sendPasswordReset = async () => {
  if (!authStore.getUser?.email) {
    alert('No email address found. Please update your profile first.')
    return
  }
  
  sendingReset.value = true
  try {
    // Here you would call your API to send password reset
    console.log('Sending password reset to:', authStore.getUser.email)
    // Example: await authStore.forgotPassword(authStore.getUser.email)
    
    alert('Password reset link sent to your email!')
  } catch (error) {
    console.error('Error sending password reset:', error)
    alert('Failed to send password reset. Please try again.')
  } finally {
    sendingReset.value = false
  }
}

// Initialize
onMounted(() => {
  // Load dark mode preference
  const savedDarkMode = localStorage.getItem('darkMode')
  if (savedDarkMode) {
    isDarkMode.value = savedDarkMode === 'true'
    applyTheme()
  }
  
  // Load user info if logged in
  if (authStore.getUser) {
    userInfo.value = {
      username: authStore.getUser.username || '',
      email: authStore.getUser.email || ''
    }
  }
})
</script>

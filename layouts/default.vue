<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Left Sidebar -->
    <div class="fixed left-0 top-0 h-full w-8 sm:w-16 md:w-24 bg-[#7F8CFF] border-r-2 border-black z-10"></div>
    
    <!-- Right Sidebar -->
    <div class="fixed right-0 top-0 h-full w-8 sm:w-16 md:w-24 bg-[#7F8CFF] border-l-2 border-black z-10"></div>
    
    <!-- Main Content Area -->
    <div class="ml-8 mr-8 sm:ml-16 sm:mr-16 md:ml-24 md:mr-24">
      <!-- Header -->
      <header class="bg-white border-b-2 border-black">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <!-- Logo -->
              <NuxtLink to="/" class="flex items-center">
                <img src="/saturnator-logo.png" alt="Saturnator Logo" class="h-6 w-10 sm:h-8 sm:w-14 mr-2 sm:mr-3" />
                <span class="text-lg sm:text-xl md:text-2xl font-bold text-saturnator-gray-dark">Saturnator</span>
              </NuxtLink>
              
              <!-- Navigation Links -->
              <ClientOnly>
                <template #default>
                  <div v-if="authStore.isLoggedIn" class="hidden sm:ml-6 sm:flex sm:space-x-8">
                    <NuxtLink to="/upload" class="text-saturnator-gray-dark inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-saturnator-blue-medium">
                      Upload
                    </NuxtLink>
                  </div>
                </template>
              </ClientOnly>
            </div>

            <!-- Right side -->
            <div class="flex items-center">
              <!-- Language Switcher -->
              <div class="mr-2 sm:mr-4">
                <select v-model="currentLocale" class="bg-white border-2 border-black rounded-md px-2 py-1 text-sm sm:text-base">
                  <option value="en">EN</option>
                  <option value="ka">KA</option>
                </select>
              </div>

              <!-- Auth Section -->
              <ClientOnly>
                <template #default>
                  <div v-if="!authStore.isLoggedIn">
                    <NuxtLink to="/login" class="bg-white border-2 border-black rounded-md px-2 py-1 text-sm sm:text-base">
                      Sign in
                    </NuxtLink>
                  </div>
                  
                  <!-- User Menu -->
                  <div v-else class="relative">
                    <button
                      @click="userMenuOpen = !userMenuOpen"
                      class="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-saturnator-blue-medium"
                    >
                      <span class="text-saturnator-gray-dark">{{ authStore.getUser?.username }}</span>
                      <svg class="ml-2 h-4 w-4 text-saturnator-gray-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </button>
                  
                    <!-- Dropdown Menu -->
                    <div
                      v-if="userMenuOpen"
                      class="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border-2 border-black"
                    >
                      <button
                        @click="handleLogout"
                        class="block w-full text-left px-4 py-2 text-sm text-saturnator-gray-dark hover:bg-saturnator-gray-light"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </template>
              </ClientOnly>
            </div>
          </div>
        </nav>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <slot />
      </main>

      <!-- Footer -->
      <footer class="bg-white border-t-2 border-black mt-auto">
        <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p class="text-center text-saturnator-gray-medium text-sm">
            © {{ new Date().getFullYear() }} Saturnator. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'

const currentLocale = ref('en')
const userMenuOpen = ref(false)

// Store
const authStore = useAuthStore()

// Watch for locale changes
watch(currentLocale, (newLocale) => {
  // TODO: Implement locale switching logic
  console.log('Locale changed to:', newLocale)
})

// Handle logout
const handleLogout = async () => {
  try {
    await authStore.logout()
    userMenuOpen.value = false
    await navigateTo('/')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

// Close user menu when clicking outside
onMounted(async () => {
  document.addEventListener('click', (event) => {
    const target = event.target as Element
    if (!target.closest('.relative')) {
      userMenuOpen.value = false
    }
  })
})
</script> 
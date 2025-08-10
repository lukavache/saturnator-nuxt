<template>
  <div class="min-h-screen bg-saturnator-gray-light">
    <!-- Left Sidebar -->
    <div class="fixed left-0 top-0 h-full w-8 sm:w-16 md:w-24 bg-[#7F8CFF] border-r-2 border-black z-10"></div>
    
    <!-- Right Sidebar -->
    <div class="fixed right-0 top-0 h-full w-8 sm:w-16 md:w-24 bg-[#7F8CFF] border-l-2 border-black z-10"></div>
    
    <!-- Hamburger Sidebar Overlay -->
    <div class="fixed inset-0 z-40 bg-black/40 transition-opacity duration-200"
     :class="isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'"
     @click="closeSidebar" />
    
    <!-- Hamburger Sidebar -->
    <div 
      :class="[
        'fixed top-0 right-0 h-full w-64 bg-white border-l-2 border-black z-50 transform transition-transform duration-300 ease-in-out',
        isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
      ]"
    >
      <!-- Sidebar Header -->
      <div class="flex items-center justify-between p-3.5 border-b-2 border-black">
        <div class="flex items-center">
          <img src="/saturnator-logo.png" alt="Saturnator Logo" class="h-6 w-10 mr-2" />
          <span class="text-lg font-bold text-saturnator-gray-dark">Menu</span>
        </div>
        <button 
          @click="closeSidebar"
          class="p-2 hover:bg-gray-100 rounded-lg"
        >
          <svg class="h-5 w-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <!-- Sidebar Menu Items -->
      <nav class="p-4">
        <ul class="space-y-2">
          <!-- My Uploads -->
          <ClientOnly>
            <template #default>
              <li v-if="authStore.isLoggedIn">
                <NuxtLink 
                  to="/uploads" 
                  @click="closeSidebar"
                  class="flex items-center p-3 text-saturnator-gray-dark hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                  </svg>
                  My Uploads
                </NuxtLink>
              </li>
            </template>
          </ClientOnly>
          
          <!-- Language Switcher -->
          <li>
            <div class="relative" ref="languageDropdownRef">
              <button
                @click="languageDropdownOpen = !languageDropdownOpen"
                class="flex items-center justify-between w-full p-3 text-saturnator-gray-dark hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path>
                  </svg>
                  Language
                </div>
                <svg class="h-4 w-4 text-saturnator-gray-medium" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Language Dropdown -->
              <div
                v-if="languageDropdownOpen"
                class="absolute left-0 right-0 mt-1 bg-white border border-black rounded-lg shadow-lg py-1 z-50"
              >
                <button
                  @click="selectLanguage('en')"
                  class="block w-full text-left px-4 py-2 text-sm text-saturnator-gray-dark hover:bg-gray-100"
                >
                  English
                </button>
                <button
                  @click="selectLanguage('ka')"
                  class="block w-full text-left px-4 py-2 text-sm text-saturnator-gray-dark hover:bg-gray-100"
                >
                  ქართული
                </button>
              </div>
            </div>
          </li>
          
          <!-- Settings -->
          <li>
            <NuxtLink 
              to="/settings" 
              @click="closeSidebar"
              class="flex items-center p-3 text-saturnator-gray-dark hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Settings
            </NuxtLink>
          </li>
          
          <!-- About Us -->
          <li>
            <NuxtLink 
              to="/about" 
              @click="closeSidebar"
              class="flex items-center p-3 text-saturnator-gray-dark hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              About Us
            </NuxtLink>
          </li>
        </ul>
      </nav>
    </div>
    
    <!-- Main Content Area -->
    <div class="ml-8 mr-8 sm:ml-16 sm:mr-16 md:ml-24 md:mr-24">
      <!-- Header -->
      <header class="bg-white border-b-2 border-black">
        <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center h-16">
            <!-- Left side - Logo -->
            <div class="flex items-center">
              <NuxtLink to="/" class="flex items-center">
                <img src="/saturnator-logo.png" alt="Saturnator Logo" class="h-6 w-10 sm:h-8 sm:w-14 mr-2 sm:mr-3" />
                <span class="text-lg sm:text-xl md:text-2xl font-bold text-saturnator-gray-dark">Saturnator</span>
              </NuxtLink>
            </div>

            <!-- Center - Search Bar -->
            <div class="flex-1 max-w-2xl mx-4 sm:mx-8">
              <div class="relative">
                <img src="/search-bar.png" alt="Search" class="w-full h-10 object-contain" />
                <input
                  type="text"
                  placeholder=""
                  class="absolute inset-0 w-full h-full pl-10 pr-10 py-2 bg-transparent text-sm focus:outline-none placeholder-gray-600"
                />
              </div>
            </div>

            <!-- Right side - Buttons and Auth -->
            <div class="flex items-center space-x-2 sm:space-x-4">
              <!-- Upload Button -->
              <ClientOnly>
                <template #default>
                  <NuxtLink 
                    v-if="authStore.isLoggedIn" 
                    to="/upload" 
                    class="bg-gray-100 border border-black rounded-lg px-3 py-2 text-sm font-medium text-saturnator-gray-dark hover:bg-gray-200 transition-colors"
                  >
                    Upload
                  </NuxtLink>
                </template>
              </ClientOnly>

              <!-- Auth Section -->
              <ClientOnly>
                <template #default v-if="!authStore.isLoggedIn">
                  <NuxtLink to="/login" class="bg-gray-100 border border-black rounded-lg px-3 py-2 text-sm font-medium text-saturnator-gray-dark hover:bg-gray-200 transition-colors">
                    Sign in
                  </NuxtLink>
                </template>
              </ClientOnly>

              <!-- Profile Button -->
              <ClientOnly>
                <template #default>
                  <div v-if="authStore.isLoggedIn" class="relative" ref="userMenuRef">
                    <button
                      @click="userMenuOpen = !userMenuOpen"
                      class="p-2 border border-black rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <svg class="h-5 w-5 text-saturnator-gray-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                      </svg>
                    </button>
                  
                    <!-- Dropdown Menu -->
                    <div
                      v-if="userMenuOpen"
                      class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50 border border-black"
                    >
                      <div class="px-4 py-2 text-sm text-saturnator-gray-dark border-b border-gray-200">
                        {{ authStore.getUser?.username }}
                      </div>
                      <button
                        @click="handleLogout"
                        class="block w-full text-left px-4 py-2 text-sm text-saturnator-gray-dark hover:bg-gray-100"
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                </template>
              </ClientOnly>

              <!-- Likes/Star Button -->
              <button class="p-2 border border-black rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <img src="/star-for-likes.png" alt="Likes" class="h-5 w-5 object-contain" />
              </button>

              <!-- Shopping Cart Icon -->
              <button class="p-2 border border-black rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <img src="/shopping-cart.png" alt="Shopping Cart" class="h-5 w-5 object-contain" />
              </button>

              <!-- Hamburger Menu Icon -->
              <button 
                @click="toggleSidebar"
                class="p-2 border border-black rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <img src="/hamburger-button.png" alt="Menu" class="h-5 w-5 object-contain" />
              </button>
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
const isSidebarOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const closeSidebar = () => {
  isSidebarOpen.value = false
}
const languageDropdownOpen = ref(false)

// Refs for click outside detection
const userMenuRef = ref<HTMLElement>()
const languageDropdownRef = ref<HTMLElement>()

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

// Select language
const selectLanguage = (locale: string) => {
  currentLocale.value = locale
  languageDropdownOpen.value = false
}

// Close dropdowns when clicking outside
onMounted(async () => {
  document.addEventListener('click', (event) => {
    const target = event.target as Element
    // Close language dropdown if clicking outside
    if (languageDropdownRef.value && !languageDropdownRef.value.contains(target)) {
      languageDropdownOpen.value = false
    }

    if (userMenuRef.value && !userMenuRef.value.contains(target)) {
      userMenuOpen.value = false
    }
  })
})
</script> 
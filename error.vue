<template>
  <div class="min-h-screen bg-saturnator-gray-light flex items-center justify-center">
    <div class="text-center px-4">
      <!-- Saturnator Logo -->
      <div class="mb-8">
        <img src="/saturnator-logo.png" alt="Saturnator Logo" class="mx-auto h-16 w-24 mb-4" />
        <h2 class="text-2xl font-bold text-saturnator-gray-dark">Saturnator</h2>
      </div>

      <h1 class="text-6xl font-bold text-saturnator-gray-dark mb-4">
        {{ error.statusCode }}
      </h1>
      
      <p class="text-saturnator-gray-medium mb-8 text-lg">
        {{ error.statusMessage }}
      </p>

      <NuxtLink
        to="/"
        class="inline-block bg-white text-saturnator-gray-dark border-2 border-black rounded-lg px-8 py-4 font-bold text-lg hover:bg-gray-100 transition-colors shadow-lg"
      >
        Go to Homepage
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ErrorProps {
  error: {
    statusCode: number
    statusMessage: string
  }
}

defineProps<ErrorProps>()
</script>

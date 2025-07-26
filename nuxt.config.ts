// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  // Modules
  modules: [
    '@nuxtjs/strapi',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],
  
  // Strapi configuration
  strapi: {
    url: process.env.STRAPI_URL || 'http://localhost:1337',
    prefix: '/api',
    version: 'v5',
    auth: { populate: ["role"] },
    cookie: {
      secure: false,
      sameSite: 'lax',
    },
  },
  
  // Pinia configuration
  pinia: {
    autoImports: ['defineStore', 'acceptHMRUpdate']
  },
  
  // Runtime config for environment variables
  runtimeConfig: {
    public: {
      apiBase: process.env.STRAPI_URL || 'http://localhost:1337'
    }
  },
  
  // Auto-imports
  imports: {
    dirs: ['stores']
  },
  
  // Build configuration
  build: {
    transpile: ['@nuxtjs/strapi']
  }
})
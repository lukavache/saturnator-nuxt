// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },
  
  // App configuration
  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },
  
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
  },

  routeRules: {
    '/upload': {
      ssr: false
    }
  },

  // Local `nuxt dev` (:3000) does not run Cloudflare Pages Functions.
  // Proxy /api/x402/* to `wrangler pages dev` (:8788) so auth-bridge / paywall work.
  nitro: {
    // Forwards /api/x402/* → http://127.0.0.1:8788/api/x402/* (path preserved).
    devProxy: {
      '/api/x402': {
        target: 'http://127.0.0.1:8788',
        changeOrigin: true,
      },
    },
  },
})
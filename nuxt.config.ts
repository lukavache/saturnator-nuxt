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
      apiBase: process.env.STRAPI_URL || 'http://localhost:1337',
      // Empty = same-origin (Cloudflare Pages). Local Nuxt cannot host Functions,
      // so default to wrangler pages dev. Override with NUXT_PUBLIC_X402_BASE.
      x402Base:
        process.env.NUXT_PUBLIC_X402_BASE ||
        (process.env.NODE_ENV === 'production' ? '' : 'http://127.0.0.1:8788'),
    },
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
})
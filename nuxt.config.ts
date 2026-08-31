// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' }
      ]
    }
  },

  modules: [
    '@nuxtjs/strapi',
    '@pinia/nuxt',
    '@nuxtjs/tailwindcss'
  ],

  // Points at Cloudflare Workers API (Strapi-compatible /api surface).
  // Override with STRAPI_URL / NUXT_PUBLIC_API_BASE.
  strapi: {
    url: process.env.STRAPI_URL || process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:8787',
    prefix: '/api',
    version: 'v5',
    auth: { populate: ["role"] },
    cookie: {
      secure: false,
      sameSite: 'lax',
    },
  },

  pinia: {
    autoImports: ['defineStore', 'acceptHMRUpdate']
  },

  runtimeConfig: {
    public: {
      apiBase:
        process.env.STRAPI_URL ||
        process.env.NUXT_PUBLIC_API_BASE ||
        'http://localhost:8787',
    },
  },

  imports: {
    dirs: ['stores']
  },

  build: {
    transpile: ['@nuxtjs/strapi']
  },

  routeRules: {
    '/upload': {
      ssr: false
    },
    '/admin': {
      ssr: false
    },
    '/admin/**': {
      ssr: false
    }
  },
})

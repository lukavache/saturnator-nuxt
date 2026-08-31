export default defineNuxtRouteMiddleware(async () => {
  // Admin gate is client-only (token lives in localStorage / cookie).
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Ensure Pinia + @nuxtjs/strapi share the same JWT before any check.
  await authStore.initializeAuth()

  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }

  if (!authStore.isAdmin) {
    try {
      await authStore.fetchUser({ logoutOnError: false })
    } catch {
      // ignore — fall through to redirect
    }
  }

  if (!authStore.isAdmin) {
    return navigateTo('/')
  }
})

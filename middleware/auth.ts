export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const authStore = useAuthStore()
  if (!authStore.initialized) {
    await authStore.initializeAuth()
  }

  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
})

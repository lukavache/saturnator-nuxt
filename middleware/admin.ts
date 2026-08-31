export default defineNuxtRouteMiddleware(async () => {
  const authStore = useAuthStore()

  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }

  // Refresh role from API (ADMIN_EMAILS elevation happens server-side on /users/me)
  if (process.client && !authStore.isAdmin) {
    try {
      await authStore.fetchUser()
    } catch {
      // ignore
    }
  }

  if (!authStore.isAdmin) {
    return navigateTo('/')
  }
})

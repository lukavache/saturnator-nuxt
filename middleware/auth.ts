export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Only initialize auth on client side to avoid SSR issues
  // if (process.client) {
  //   await authStore.initializeAuth()
  // }
  
  // If user is not authenticated, redirect to login
  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
}) 
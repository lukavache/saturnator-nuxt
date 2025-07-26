export default defineNuxtRouteMiddleware(async (to, from) => {
  const authStore = useAuthStore()
  
  // Initialize auth if not already done
  await authStore.initializeAuth()
  
  console.log('Auth middleware:', {
    route: to.path,
    isLoggedIn: authStore.isLoggedIn,
    token: authStore.getToken,
    user: authStore.getUser
  })
  
  // If user is not authenticated, redirect to login
  if (!authStore.isLoggedIn) {
    return navigateTo('/login')
  }
}) 
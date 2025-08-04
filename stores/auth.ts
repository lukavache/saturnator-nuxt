import { defineStore } from 'pinia'
import storage from '../utils/storage'

interface User {
  id: number
  username?: string
  email?: string
  provider?: string
  confirmed?: boolean
  blocked?: boolean
  createdAt?: string
  updatedAt?: string
  role?: {
    name: string
    type: string
  }
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: storage.get('auth_token') || null,
    loading: false
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    isLoggedIn: (state) => !!state.token,
    isLoading: (state) => state.loading,
    isAdmin: (state) => state.user?.role?.name === 'Admin'
  },

  actions: {
    async login(credentials: { identifier: string; password: string }) {
      this.loading = true
      try {
        const { login } = useStrapiAuth()
        const response = await login(credentials)
        
        const userData = response.user?.value || response.user
        if (userData) {
          this.user = userData as User
        }
        this.token = response.jwt
        
        // Store in localStorage
        storage.set('auth_token', response.jwt)
        storage.set('auth_user', JSON.stringify(response.user))
        
        return response
      } catch (error) {
        console.error('Login error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async register(userData: { username: string; email: string; password: string }) {
      this.loading = true
      try {
        const { register } = useStrapiAuth()
        const response = await register(userData)
        
        // Don't automatically log in - wait for email confirmation
        // await this.login({
        //   identifier: userData.email,
        //   password: userData.password
        // })
        
        return response
      } catch (error) {
        console.error('Registration error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async confirmEmail(confirmationToken: string) {
      this.loading = true
      try {
        const config = useRuntimeConfig()
        const strapiResponse = await fetch(
          `${config.public.apiBase}/api/auth/email-confirmation?confirmation=${confirmationToken}`,
          {
            method: 'GET',
            redirect: 'manual',
          }
        );
        if(strapiResponse.status === 400) {
          throw new Error(strapiResponse.statusText)
        } else {
          return strapiResponse
        }
      } catch (error) {
        console.error('Email confirmation error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async resendConfirmationEmail(email: string) {
      this.loading = true
      try {
        const { sendEmailConfirmation } = useStrapiAuth()
        const response = await sendEmailConfirmation({ email })
        return response
      } catch (error) {
        console.error('Resend confirmation error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        const { logout } = useStrapiAuth()
        await logout()
      } catch (error) {
        console.error('Logout error:', error)
      } finally {
        this.user = null
        this.token = null
        
        // Clear localStorage
        storage.removeItems(['auth_token', 'auth_user'])
      }
    },

    async fetchUser() {
      try {
        const { fetchUser } = useStrapiAuth()
        const user = await fetchUser()
        
        if (user) {
          this.user = user
          storage.set('auth_user', JSON.stringify(user))
        }
        
        return user
      } catch (error) {
        console.error('Fetch user error:', error)
        this.logout()
        return null
      }
    },

    async initializeAuth() {
      if (process.client) {
        const token = storage.get('auth_token')
        const userData = storage.get('auth_user')
        
        console.log('Initializing auth:', { token: !!token, userData: !!userData })
        
        if (token && userData) {
          try {
            this.token = token
            this.user = JSON.parse(userData)
            
            console.log('Auth state restored:', {
              user: this.user,
              token: this.token,
              isLoggedIn: this.isLoggedIn
            })
            
            // Verify token is still valid
            await this.fetchUser()
          } catch (error) {
            console.error('Token validation error:', error)
            this.logout()
          }
        }
      }
    },

    async forgotPassword(email: string) {
      this.loading = true
      try {
        const { forgotPassword } = useStrapiAuth()
        const response = await forgotPassword({ email })
        return response
      } catch (error) {
        console.error('Forgot password error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },

    async resetPassword(password: string, passwordConfirmation: string, code: string) {
      this.loading = true
      try {
        const { resetPassword } = useStrapiAuth()
        const response = await resetPassword({
          password,
          passwordConfirmation,
          code
        })
        return response
      } catch (error) {
        console.error('Reset password error:', error)
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
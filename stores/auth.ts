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
  initialized: boolean
}

function unwrapUser(user: unknown): User | null {
  if (!user) return null
  const raw = (user as any)?.value !== undefined ? (user as any).value : user
  if (!raw || typeof raw !== 'object') return null
  return raw as User
}

function isAdminUser(user: User | null) {
  if (!user) return false
  if (user.role?.name === 'Admin' || user.role?.type === 'admin') return true
  // Fallback: ADMIN_EMAILS elevation may not be in a stale cached user yet
  return false
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    token: null,
    loading: false,
    initialized: false,
  }),

  getters: {
    getUser: (state) => state.user,
    getToken: (state) => state.token,
    isLoggedIn: (state) => !!state.token,
    isLoading: (state) => state.loading,
    isAdmin: (state) => isAdminUser(state.user),
  },

  actions: {
    /** Keep @nuxtjs/strapi cookie token in sync with our localStorage JWT. */
    syncStrapiToken(token: string | null = this.token) {
      if (!process.client) return
      try {
        const { setToken } = useStrapiAuth()
        setToken(token)
      } catch (error) {
        console.error('Failed to sync Strapi token', error)
      }
    },

    async login(credentials: { identifier: string; password: string }) {
      this.loading = true
      try {
        const { login } = useStrapiAuth()
        const response = await login(credentials)

        const userData = unwrapUser(response.user)
        this.user = userData
        this.token = response.jwt
        this.initialized = true

        storage.set('auth_token', response.jwt)
        storage.set('auth_user', JSON.stringify(userData))
        this.syncStrapiToken(response.jwt)

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
          },
        )
        if (strapiResponse.status === 400) {
          throw new Error(strapiResponse.statusText)
        }
        return strapiResponse
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
        this.syncStrapiToken(null)
        storage.removeItems(['auth_token', 'auth_user'])
      }
      return true
    },

    async fetchUser(opts: { logoutOnError?: boolean } = {}) {
      const logoutOnError = opts.logoutOnError !== false
      try {
        this.syncStrapiToken(this.token || storage.get('auth_token'))

        // Prefer a direct call so we always send our Bearer token.
        const config = useRuntimeConfig()
        const token = this.token || storage.get('auth_token')
        if (!token) return null

        const res = await fetch(`${config.public.apiBase}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!res.ok) {
          throw new Error(`users/me failed: ${res.status}`)
        }
        const user = (await res.json()) as User
        this.user = user
        storage.set('auth_user', JSON.stringify(user))
        return user
      } catch (error) {
        console.error('Fetch user error:', error)
        if (logoutOnError) {
          await this.logout()
        }
        return null
      }
    },

    async initializeAuth() {
      if (!process.client) {
        this.initialized = true
        return
      }

      const token = storage.get('auth_token')
      const userData = storage.get('auth_user')

      if (token) {
        this.token = token
        this.syncStrapiToken(token)
        if (userData) {
          try {
            this.user = JSON.parse(userData) as User
          } catch {
            this.user = null
          }
        }

        // Refresh role quietly; don't wipe session on transient errors.
        await this.fetchUser({ logoutOnError: false })
      }

      this.initialized = true
    },

    async forgotPassword(email: string) {
      this.loading = true
      try {
        // Avoid useStrapiAuth().forgotPassword — it clears the JWT cookie.
        const config = useRuntimeConfig()
        const res = await fetch(`${config.public.apiBase}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error((body as any)?.error?.message || 'Failed to send reset email')
        }
        return true
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
          code,
        })
        const userData = unwrapUser(response.user)
        if (response.jwt) {
          this.token = response.jwt
          this.user = userData
          storage.set('auth_token', response.jwt)
          storage.set('auth_user', JSON.stringify(userData))
          this.syncStrapiToken(response.jwt)
        }
        return response
      } catch (error) {
        console.error('Reset password error:', error)
        throw error
      } finally {
        this.loading = false
      }
    },
  },
})

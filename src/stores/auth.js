import { defineStore } from 'pinia'
import api from '@/services/api'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('avicola_user') || 'null'),
    token: localStorage.getItem('avicola_token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
  },

  actions: {
    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data.data

        this.token = token
        this.user = user

        localStorage.setItem('avicola_token', token)
        localStorage.setItem('avicola_user', JSON.stringify(user))

        return { success: true }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al iniciar sesión'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.token) {
          await api.post('/auth/logout')
        }
      } catch {
        // Continuamos con el borrado local aunque el backend responda con error
      } finally {
        this.token = null
        this.user = null
        localStorage.removeItem('avicola_token')
        localStorage.removeItem('avicola_user')
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return null
      try {
        const response = await api.get('/auth/me')
        this.user = response.data.data
        localStorage.setItem('avicola_user', JSON.stringify(this.user))
        return this.user
      } catch {
        this.logout()
        return null
      }
    },
  },
})


import { defineStore } from 'pinia'
import api from '@/services/api'
import { useAsistenteStore } from '@/stores/asistente'

// Un JSON corrupto o un localStorage bloqueado no deben tumbar la aplicación al arrancar
const leerUsuarioGuardado = () => {
  try {
    return JSON.parse(localStorage.getItem('avicola_user') || 'null')
  } catch {
    return null
  }
}

const aplanarClaves = (nodos = []) =>
  nodos.flatMap((nodo) => [nodo.clave, ...aplanarClaves(nodo.hijos)])

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: leerUsuarioGuardado(),
    token: localStorage.getItem('avicola_token') || null,
    loading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    currentUser: (state) => state.user,
    // Árbol de menú que arma el sidebar: solo lo que el servidor dice que el usuario puede ver
    modulos: (state) => state.user?.modulos || [],
    rol: (state) => state.user?.rol || null,
    esSuperAdmin: (state) => state.user?.rol?.clave === 'super_admin',
    debeCambiarPassword: (state) => !!state.user?.debe_cambiar_password,
    // Lista plana de claves permitidas (`permisos`). Si el usuario guardado es de una versión anterior
    // y no la trae, se deduce del árbol para no dejarlo sin menú hasta el próximo `me`.
    permisos: (state) => {
      if (Array.isArray(state.user?.permisos)) return state.user.permisos
      return aplanarClaves(state.user?.modulos)
    },
  },

  actions: {
    // La ocultación en el frontend es solo comodidad: la seguridad es el 403 del servidor
    puede(clave) {
      return this.permisos.includes(clave)
    },

    _guardarUsuario(user) {
      this.user = user
      try {
        localStorage.setItem('avicola_user', JSON.stringify(user))
      } catch {
        // Sin persistencia: el usuario sigue en memoria durante la sesión
      }
    },

    async login(email, password) {
      this.loading = true
      this.error = null
      try {
        const response = await api.post('/auth/login', { email, password })
        const { token, user } = response.data.data

        this.token = token
        localStorage.setItem('avicola_token', token)
        this._guardarUsuario(user)

        return { success: true }
      } catch (err) {
        // En 422 el mensaje útil está en `errors.email` (credenciales, cuenta desactivada)
        this.error =
          err.response?.data?.errors?.email?.[0] ||
          err.response?.data?.message ||
          'Error al iniciar sesión'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // Cierra la sesión local de forma SÍNCRONA y avisa al servidor sin esperarlo. Lo usa la guardia del
    // router con un usuario sin ningún módulo: `logout` espera a la API, y mientras tanto la guardia
    // seguiría viendo el token y rebotaría entre `login` y el dashboard sin fin.
    expulsar() {
      const token = this.token
      this.token = null
      this.user = null
      localStorage.removeItem('avicola_token')
      localStorage.removeItem('avicola_user')
      useAsistenteStore().reiniciar()
      if (token) {
        // El interceptor ya no encuentra el token en localStorage, así que va explícito
        api.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
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
        // El chat y su UUID son de este usuario: si otro inicia sesión en el mismo navegador sin recargar,
        // no debe ver sus mensajes. Cubre el cierre manual y el de fetchCurrentUser. El cierre por 401
        // (interceptor de api.js) recarga la página; ahí el servidor es quien protege, porque responde 404
        // a un UUID que no es del usuario autenticado.
        useAsistenteStore().reiniciar()
      }
    },

    async fetchCurrentUser() {
      if (!this.token) return null
      try {
        const response = await api.get('/auth/me')
        this._guardarUsuario(response.data.data)
        return this.user
      } catch (err) {
        // Un 403, un 500 o un fallo de red no cierran la sesión: solo el 401 lo hace
        if (err.response?.status === 401) this.logout()
        return null
      }
    },

    // Cambia la contraseña; el servidor revoca todos los tokens (incluido este), así que se vuelve al login
    async cambiarPassword({ password_actual, password, password_confirmation }) {
      try {
        await api.post('/auth/password', { password_actual, password, password_confirmation })
      } catch (err) {
        const errores = err.response?.data?.errors || {}
        return {
          success: false,
          errors: errores,
          error: Object.values(errores)[0]?.[0] || err.response?.data?.message || 'No se pudo cambiar la contraseña',
        }
      }
      await this.logout()
      return { success: true }
    },

    // «Mantener esta contraseña»: apaga el aviso sin cambiar ningún secreto
    async mantenerPassword() {
      try {
        await api.post('/auth/password/mantener')
        this._guardarUsuario({ ...this.user, debe_cambiar_password: false })
        return { success: true }
      } catch {
        return { success: false }
      }
    },
  },
})

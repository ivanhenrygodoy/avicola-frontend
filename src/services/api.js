import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
})

// Interceptor para inyectar token Bearer automáticamente
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('avicola_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Mensaje exacto con que el servidor niega un módulo (EnsureModuloPermitido). Otros 403 no se tocan.
const MENSAJE_SIN_MODULO = 'No tienes permiso para acceder a este módulo.'

// Los permisos pueden cambiar a mitad de sesión (R17): se vuelve a pedir `me`, se actualiza el menú y,
// si la ruta actual ya no está permitida, se lleva al usuario a un destino permitido con un aviso.
// Se importa en diferido para no crear un ciclo api → stores → api al cargar el módulo.
let recargandoPermisos = false
const manejarPermisosCambiados = async () => {
  if (recargandoPermisos) return
  recargandoPermisos = true
  try {
    const [{ useAuthStore }, { useNotificationStore }, { default: router, destinoPermitido }] = await Promise.all([
      import('@/stores/auth'),
      import('@/stores/notification'),
      import('@/router'),
    ])
    const authStore = useAuthStore()
    await authStore.fetchCurrentUser()

    const modulo = router.currentRoute.value.meta?.modulo
    if (modulo && !authStore.puede(modulo)) {
      useNotificationStore().warning('Ya no tienes acceso a ese módulo.')
      const destino = destinoPermitido(authStore)
      if (destino) router.replace(destino)
    }
  } finally {
    recargandoPermisos = false
  }
}

// Interceptor para capturar expiración de sesión (401) y pérdida de acceso a un módulo (403)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403 && error.response.data?.message === MENSAJE_SIN_MODULO) {
      // Nunca se muestra el error crudo: la acción que falló queda sin efecto y el menú se corrige
      manejarPermisosCambiados()
    }
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('avicola_token')
      localStorage.removeItem('avicola_user')
      // El chat guarda el UUID de su conversación en localStorage; al vencer la sesión se olvida también
      // (la página se recarga, así que el store del asistente no llega a reiniciarse).
      localStorage.removeItem('avicola_asistente_uuid')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api


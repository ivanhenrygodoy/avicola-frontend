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

// Interceptor para capturar expiración de sesión (401)
api.interceptors.response.use(
  (response) => response,
  (error) => {
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


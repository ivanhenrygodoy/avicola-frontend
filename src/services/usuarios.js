import api from '@/services/api'

// Gestión de usuarios (solo superAdmin)
export const listarUsuarios = async () => {
  const response = await api.get('/usuarios')
  return response.data.data
}

// Responde { usuario, credenciales_estado }: el correo sale por la cola, nunca viaja la contraseña
export const crearUsuario = async (payload) => {
  const response = await api.post('/usuarios', payload)
  return response.data.data
}

export const actualizarUsuario = async (id, payload) => {
  const response = await api.patch(`/usuarios/${id}`, payload)
  return response.data.data
}

export const reenviarCredenciales = async (id) => {
  const response = await api.post(`/usuarios/${id}/reenviar-credenciales`)
  return response.data.data
}

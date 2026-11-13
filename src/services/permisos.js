import api from '@/services/api'

// Matriz rol × módulo: { roles: [{ id, clave, nombre, es_super, modulos: [clave] }], modulos: [...] }
export const obtenerMatriz = async () => {
  const response = await api.get('/permisos')
  return response.data.data
}

// Envía solo los módulos opcionales a otorgar; el servidor conserva siempre los módulos base
export const guardarRol = async (idRol, modulos) => {
  const response = await api.put(`/permisos/${idRol}`, { modulos })
  return response.data.data
}

import api from '@/services/api'

/**
 * Envía un mensaje al Asistente Virtual. El historial ya no lo manda el navegador: el servidor arma el
 * contexto desde la conversación guardada del usuario. `uuid_conversacion` es solo una pista de qué
 * conversación retomar (el servidor la valida contra el usuario autenticado).
 *
 * @param {{ mensaje: string, uuid_conversacion?: string }} payload
 * @returns {Promise<{ respuesta: string, herramientas_utilizadas: string[], sugerencias_modulos: object[], uuid_conversacion: string|null, requiere_titulo: boolean }>}
 */
export const enviarMensaje = async (payload) => {
  const response = await api.post('/asistente/chat', payload)
  return response.data.data
}

// Historial de conversaciones (nada se borra: eliminar solo cambia el estado en el servidor)

/** Conversaciones activas del usuario, las más recientes primero. */
export const listarConversaciones = async () => {
  const response = await api.get('/asistente/conversaciones')
  return response.data.data
}

/** Una conversación con sus últimos mensajes. Responde 404 si no existe, es ajena o está eliminada. */
export const obtenerConversacion = async (uuid) => {
  const response = await api.get(`/asistente/conversaciones/${uuid}`)
  return response.data.data
}

export const renombrarConversacion = async (uuid, nombre) => {
  const response = await api.patch(`/asistente/conversaciones/${uuid}`, { nombre })
  return response.data.data
}

/** Quita la conversación del historial del usuario (cambio de estado, no borrado). */
export const eliminarConversacion = async (uuid) => {
  const response = await api.delete(`/asistente/conversaciones/${uuid}`)
  return response.data
}

/** Pide el nombre automático de la conversación (una sola vez; el servidor ignora la petición si ya tiene). */
export const solicitarTitulo = async (uuid) => {
  const response = await api.post(`/asistente/conversaciones/${uuid}/titulo`)
  return response.data.data
}

export default {
  enviarMensaje,
  listarConversaciones,
  obtenerConversacion,
  renombrarConversacion,
  eliminarConversacion,
  solicitarTitulo,
}

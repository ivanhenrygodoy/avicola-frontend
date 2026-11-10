import api from '@/services/api'

/**
 * Envía un mensaje con el historial previo al Asistente Virtual.
 *
 * @param {{ mensaje: string, historial?: Array<{ role: string, parts: Array<{ text: string }> }>, uuid_conversacion?: string }} payload
 * @returns {Promise<{ respuesta: string, herramientas_utilizadas: string[] }>}
 */
export const enviarMensaje = async (payload) => {
  const response = await api.post('/asistente/chat', payload)
  return response.data.data
}

export default {
  enviarMensaje,
}


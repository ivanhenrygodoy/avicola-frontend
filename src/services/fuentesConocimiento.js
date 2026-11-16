import api from '@/services/api'

/**
 * Servicio de Fuentes de Conocimiento RAG y Gestión Documental Vectorial.
 */
export const fuentesConocimientoService = {
  // Listado paginado de fuentes con filtros y métricas ({ data, meta, stats })
  async listar(params = {}) {
    const response = await api.get('/asistente/fuentes', { params })
    return response.data
  },

  // Obtiene el detalle de la fuente con sus fragmentos y texto original
  async obtenerDetalle(id) {
    const response = await api.get(`/asistente/fuentes/${id}`)
    return response.data
  },

  // Registra una nueva fuente (multipart con archivo o texto directo)
  async registrar(payload) {
    let data = payload
    let headers = {}

    if (payload instanceof FormData) {
      headers['Content-Type'] = 'multipart/form-data'
    }

    const response = await api.post('/asistente/fuentes', data, { headers })
    return response.data
  },

  // Actualiza un borrador existente (soporta FormData con _method=PUT)
  async actualizar(id, payload) {
    let data = payload
    let headers = {}

    if (payload instanceof FormData) {
      payload.append('_method', 'PUT')
      headers['Content-Type'] = 'multipart/form-data'
      const response = await api.post(`/asistente/fuentes/${id}`, data, { headers })
      return response.data
    }

    const response = await api.put(`/asistente/fuentes/${id}`, data)
    return response.data
  },

  // Procesa e indexa una fuente en borrador (chunking + embeddings)
  async procesar(id) {
    const response = await api.post(`/asistente/fuentes/${id}/procesar`)
    return response.data
  },

  // Alterna entre Publicada y Archivada (o publica si estaba en borrador)
  async alternarEstado(id) {
    const response = await api.patch(`/asistente/fuentes/${id}/alternar-estado`)
    return response.data
  },

  // Descarga segura del archivo fuente original
  async descargar(id) {
    const response = await api.get(`/asistente/fuentes/${id}/descargar`, {
      responseType: 'blob',
    })
    return response
  },
}


import api from '@/services/api'

// Benchmark AviaCore: auditoría de las interacciones del asistente

// Estadísticas del periodo (dias: 7 | 30)
export const getEstadisticas = async (params = {}) => {
  const response = await api.get('/asistente/benchmark/estadisticas', { params })
  return response.data.data
}

// Listado paginado de logs; devuelve el cuerpo completo ({ data, meta, stats })
export const getLogs = async (params = {}) => {
  const response = await api.get('/asistente/benchmark/logs', { params })
  return response.data
}

// Detalle de un turno auditado
export const getLog = async (id) => {
  const response = await api.get(`/asistente/benchmark/logs/${id}`)
  return response.data.data
}

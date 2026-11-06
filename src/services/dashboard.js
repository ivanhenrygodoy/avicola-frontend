import api from '@/services/api'

// Resumen analítico consolidado de la granja (Etapa 6)
export const getResumen = async (params = {}) => {
  const response = await api.get('/dashboard/resumen', { params })
  return response.data.data
}

// Actividad reciente paginada en el servidor ({ data, meta })
export const getActividad = async (params = {}) => {
  const response = await api.get('/dashboard/actividad', { params })
  return response.data
}

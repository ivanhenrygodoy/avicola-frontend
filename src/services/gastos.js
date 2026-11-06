import api from '@/services/api'

// Catálogo de categorías de gastos
export const getCategoriasGastos = async () => {
  const response = await api.get('/catalogos/categorias-gastos')
  return response.data.data
}

// Módulo de Gastos Operativos
export const getGastos = async (params = {}) => {
  const response = await api.get('/gastos', { params })
  return response.data
}

export const getGasto = async (id) => {
  const response = await api.get(`/gastos/${id}`)
  return response.data.data
}

export const createGasto = async (payload) => {
  const response = await api.post('/gastos', payload)
  return response.data.data
}

export const updateGasto = async (id, payload) => {
  const response = await api.put(`/gastos/${id}`, payload)
  return response.data.data
}

export const deleteGasto = async (id) => {
  const response = await api.delete(`/gastos/${id}`)
  return response.data
}


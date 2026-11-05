import api from '@/services/api'

// Catálogo de tipos de alimento
export const getTiposAlimento = async () => {
  const response = await api.get('/catalogos/tipos-alimento')
  return response.data.data
}

// Módulo de Recolección de Huevos (Postura)
export const getHuevos = async (params = {}) => {
  const response = await api.get('/huevos', { params })
  return response.data
}

export const getHuevo = async (id) => {
  const response = await api.get(`/huevos/${id}`)
  return response.data.data
}

export const createHuevo = async (payload) => {
  const response = await api.post('/huevos', payload)
  return response.data.data
}

export const updateHuevo = async (id, payload) => {
  const response = await api.put(`/huevos/${id}`, payload)
  return response.data.data
}

export const deleteHuevo = async (id) => {
  const response = await api.delete(`/huevos/${id}`)
  return response.data
}

// Módulo de Alimentación y Raciones
export const getAlimentacion = async (params = {}) => {
  const response = await api.get('/alimentacion', { params })
  return response.data
}

export const getRegistroAlimentacion = async (id) => {
  const response = await api.get(`/alimentacion/${id}`)
  return response.data.data
}

export const createAlimentacion = async (payload) => {
  const response = await api.post('/alimentacion', payload)
  return response.data.data
}

export const updateAlimentacion = async (id, payload) => {
  const response = await api.put(`/alimentacion/${id}`, payload)
  return response.data.data
}

export const deleteAlimentacion = async (id) => {
  const response = await api.delete(`/alimentacion/${id}`)
  return response.data
}


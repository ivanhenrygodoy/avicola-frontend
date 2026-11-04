import api from '@/services/api'

export const getCasitas = async (params = {}) => {
  const response = await api.get('/casitas', { params })
  return response.data
}

export const getTiposInstalacion = async () => {
  const response = await api.get('/instalaciones/tipos')
  return response.data.data
}

export const createCasita = async (payload) => {
  const response = await api.post('/casitas', payload)
  return response.data.data
}

export const updateCasita = async (id, payload) => {
  const response = await api.put(`/casitas/${id}`, payload)
  return response.data.data
}

export const toggleCasitaActiva = async (id) => {
  const response = await api.patch(`/casitas/${id}/toggle-activa`)
  return response.data.data
}

export const deleteCasita = async (id) => {
  const response = await api.delete(`/casitas/${id}`)
  return response.data
}

export const createDivision = async (payload) => {
  const response = await api.post('/divisiones', payload)
  return response.data.data
}

export const updateDivision = async (id, payload) => {
  const response = await api.put(`/divisiones/${id}`, payload)
  return response.data.data
}

export const toggleDivisionActiva = async (id) => {
  const response = await api.patch(`/divisiones/${id}/toggle-activa`)
  return response.data.data
}

export const deleteDivision = async (id) => {
  const response = await api.delete(`/divisiones/${id}`)
  return response.data
}

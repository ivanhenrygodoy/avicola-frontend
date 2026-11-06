import api from '@/services/api'

export const getAves = async (params = {}) => {
  const response = await api.get('/aves', { params })
  return response.data
}

export const getCatalogosAves = async () => {
  const response = await api.get('/aves/catalogos')
  return response.data.data
}

export const getEspecies = async () => {
  const response = await api.get('/aves/especies')
  return response.data.data
}

export const getSexos = async () => {
  const response = await api.get('/aves/sexos')
  return response.data.data
}

export const getPropositos = async () => {
  const response = await api.get('/aves/propositos')
  return response.data.data
}

export const getAve = async (id) => {
  const response = await api.get(`/aves/${id}`)
  return response.data.data
}

export const createAve = async (payload) => {
  const response = await api.post('/aves', payload)
  return response.data.data
}

export const updateAve = async (id, payload) => {
  const response = await api.put(`/aves/${id}`, payload)
  return response.data.data
}

export const deleteAve = async (id, payload = {}) => {
  const response = await api.delete(`/aves/${id}`, { data: payload })
  return response.data
}

export const reactivarAve = async (id, payload = {}) => {
  const response = await api.patch(`/aves/${id}/reactivar`, payload)
  return response.data
}

export const trasladarAve = async (id, payload) => {
  const response = await api.post(`/aves/${id}/trasladar`, payload)
  return response.data
}

export const getMovimientosAve = async (id) => {
  const response = await api.get(`/aves/${id}/movimientos`)
  return response.data.data
}

// Seguimiento individual: Pesos
export const getPesosAve = async (idAve) => {
  const response = await api.get(`/aves/${idAve}/pesos`)
  return response.data.data
}

export const addPesoAve = async (idAve, payload) => {
  const response = await api.post(`/aves/${idAve}/pesos`, payload)
  return response.data
}

export const deletePesoAve = async (idPeso) => {
  const response = await api.delete(`/pesos/${idPeso}`)
  return response.data
}

// Seguimiento individual: Observaciones y Bitácora Sanitaria
export const getObservacionesAve = async (idAve) => {
  const response = await api.get(`/aves/${idAve}/observaciones`)
  return response.data.data
}

export const addObservacionAve = async (idAve, payload) => {
  const response = await api.post(`/aves/${idAve}/observaciones`, payload)
  return response.data
}

export const deleteObservacionAve = async (idObs) => {
  const response = await api.delete(`/observaciones/${idObs}`)
  return response.data
}

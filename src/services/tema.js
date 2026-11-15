import api from '@/services/api'

export const temaService = {
  async obtenerActivo() {
    const { data } = await api.get('/tema/activo')
    return data.data
  },

  async guardarPreferenciaUsuario(modoTema) {
    const { data } = await api.patch('/auth/preferencia-tema', { modo_tema: modoTema })
    return data.data
  },

  async listarComponentes() {
    const { data } = await api.get('/apariencia/componentes')
    return data.data
  },

  async obtenerComponente(clave) {
    const { data } = await api.get(`/apariencia/componentes/${clave}`)
    return data.data
  },

  async actualizarComponente(clave, payload) {
    const { data } = await api.put(`/apariencia/componentes/${clave}`, payload)
    return data.data
  },

  async restaurarComponente(clave, modo = null) {
    const { data } = await api.post(`/apariencia/componentes/${clave}/restaurar`, modo ? { modo } : {})
    return data.data
  },

  async restaurarTodo() {
    const { data } = await api.post('/apariencia/restaurar-todo')
    return data.data
  },
}


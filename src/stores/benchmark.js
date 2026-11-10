import { defineStore } from 'pinia'
import * as benchmarkService from '@/services/benchmark'

const filtrosVacios = () => ({
  search: '',
  resultado: '',
  guard: '',
  herramienta: '',
  fecha_inicio: '',
  fecha_fin: '',
  page: 1,
  per_page: 10,
})

const statsVacias = () => ({ total: 0, exitosos: 0, bloqueados: 0, errores: 0 })

// Contadores de petición por recurso: solo la última petición lanzada puede escribir en el estado.
// Sin esto, una respuesta lenta (p. ej. 7 días) pisaría a una posterior (30 días) y la pantalla
// mostraría datos que no corresponden al rango o filtro elegido.
let ultimaEstadisticas = 0
let ultimosLogs = 0
let ultimoDetalle = 0

export const useBenchmarkStore = defineStore('benchmark', {
  state: () => ({
    // Pestaña Estadísticas
    estadisticas: null,
    dias: 7,
    loadingStats: false,
    errorStats: null,
    // Pestaña Logs del agente
    logs: [],
    meta: { current_page: 1, last_page: 1, per_page: 10, total: 0, from: 0, to: 0 },
    stats: statsVacias(),
    filters: filtrosVacios(),
    loadingLogs: false,
    errorLogs: null,
    // Modal de detalle
    detalle: null,
    loadingDetalle: false,
  }),

  actions: {
    async fetchEstadisticas() {
      const turno = ++ultimaEstadisticas
      this.loadingStats = true
      this.errorStats = null
      try {
        const datos = await benchmarkService.getEstadisticas({ dias: this.dias })
        if (turno !== ultimaEstadisticas) return
        this.estadisticas = datos
      } catch (err) {
        if (turno !== ultimaEstadisticas) return
        console.error('Error cargando estadísticas del benchmark:', err)
        this.estadisticas = null
        this.errorStats = err
      } finally {
        if (turno === ultimaEstadisticas) this.loadingStats = false
      }
    },

    async setDias(dias) {
      if (this.dias === dias) return
      this.dias = dias
      await this.fetchEstadisticas()
    },

    async fetchLogs() {
      const turno = ++ultimosLogs
      this.loadingLogs = true
      this.errorLogs = null
      try {
        const params = { page: this.filters.page, per_page: this.filters.per_page }
        for (const clave of ['resultado', 'guard', 'herramienta', 'fecha_inicio', 'fecha_fin']) {
          if (this.filters[clave]) params[clave] = this.filters[clave]
        }
        if (this.filters.search?.trim()) params.search = this.filters.search.trim()

        const response = await benchmarkService.getLogs(params)
        if (turno !== ultimosLogs) return
        this.logs = response.data || []
        if (response.meta) this.meta = response.meta
        if (response.stats) this.stats = response.stats
      } catch (err) {
        if (turno !== ultimosLogs) return
        console.error('Error cargando logs del benchmark:', err)
        this.errorLogs = err
        this.logs = []
        this.meta = { ...this.meta, current_page: 1, last_page: 1, total: 0, from: 0, to: 0 }
        this.stats = statsVacias()
      } finally {
        if (turno === ultimosLogs) this.loadingLogs = false
      }
    },

    resetFilters() {
      this.filters = filtrosVacios()
      return this.fetchLogs()
    },

    // Desde los rankings de estadísticas: deja ese único criterio y recarga el listado
    filtrarPorGuard(nombre) {
      this.filters = { ...filtrosVacios(), guard: nombre }
      return this.fetchLogs()
    },

    filtrarPorHerramienta(nombre) {
      this.filters = { ...filtrosVacios(), herramienta: nombre }
      return this.fetchLogs()
    },

    async fetchDetalle(id) {
      const turno = ++ultimoDetalle
      this.loadingDetalle = true
      this.detalle = null
      try {
        const detalle = await benchmarkService.getLog(id)
        // Si mientras tanto se cerró el modal o se abrió otro log, esta respuesta ya no corresponde.
        if (turno !== ultimoDetalle) return null
        this.detalle = detalle
        return detalle
      } finally {
        if (turno === ultimoDetalle) this.loadingDetalle = false
      }
    },

    limpiarDetalle() {
      ultimoDetalle++ // invalida cualquier petición de detalle en vuelo
      this.detalle = null
      this.loadingDetalle = false
    },
  },
})

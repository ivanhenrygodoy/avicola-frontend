import { defineStore } from 'pinia'
import * as produccionService from '@/services/produccion'

export const useProduccionStore = defineStore('produccion', {
  state: () => ({
    tiposAlimento: [],
    // Submódulo Huevos
    huevos: [],
    statsHuevos: {
      total_recolectados: 0,
      total_rotos: 0,
      total_aprovechables: 0,
      porcentaje_rotura: 0,
      total_registros: 0,
    },
    metaHuevos: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    },
    filtersHuevos: {
      search: '',
      id_division: '',
      fecha_inicio: '',
      fecha_fin: '',
      page: 1,
      per_page: 10,
    },
    // Submódulo Alimentación
    alimentacion: [],
    statsAlimentacion: {
      total_kilos: 0,
      total_costo: 0,
      total_registros: 0,
    },
    metaAlimentacion: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    },
    filtersAlimentacion: {
      search: '',
      id_division: '',
      id_tipo_alimento: '',
      fecha_inicio: '',
      fecha_fin: '',
      page: 1,
      per_page: 10,
    },
    loadingHuevos: false,
    loadingAlimentacion: false,
    error: null,
  }),

  actions: {
    async fetchTiposAlimento() {
      try {
        const data = await produccionService.getTiposAlimento()
        this.tiposAlimento = data || []
      } catch (err) {
        console.error('Error al cargar tipos de alimento:', err)
      }
    },

    // --- ACCIONES DE HUEVOS ---
    async fetchHuevos(overrideParams = {}) {
      this.loadingHuevos = true
      this.error = null
      try {
        const queryParams = {
          ...this.filtersHuevos,
          ...overrideParams,
        }

        Object.keys(queryParams).forEach((key) => {
          if (queryParams[key] === '' || queryParams[key] === null) {
            delete queryParams[key]
          }
        })

        const response = await produccionService.getHuevos(queryParams)
        this.huevos = response.data || []
        this.metaHuevos = response.meta || this.metaHuevos
        if (response.stats) {
          this.statsHuevos = response.stats
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar registros de huevos'
        throw err
      } finally {
        this.loadingHuevos = false
      }
    },

    setPageHuevos(page) {
      this.filtersHuevos.page = page
      return this.fetchHuevos()
    },

    setPerPageHuevos(perPage) {
      this.filtersHuevos.per_page = perPage
      this.filtersHuevos.page = 1
      return this.fetchHuevos()
    },

    resetFiltersHuevos() {
      this.filtersHuevos.search = ''
      this.filtersHuevos.id_division = ''
      this.filtersHuevos.fecha_inicio = ''
      this.filtersHuevos.fecha_fin = ''
      this.filtersHuevos.page = 1
      return this.fetchHuevos()
    },

    async addHuevo(payload) {
      const nuevo = await produccionService.createHuevo(payload)
      await this.fetchHuevos()
      return nuevo
    },

    async updateHuevo(id, payload) {
      const actualizado = await produccionService.updateHuevo(id, payload)
      await this.fetchHuevos()
      return actualizado
    },

    async removeHuevo(id) {
      await produccionService.deleteHuevo(id)
      await this.fetchHuevos()
    },

    // --- ACCIONES DE ALIMENTACIÓN ---
    async fetchAlimentacion(overrideParams = {}) {
      this.loadingAlimentacion = true
      this.error = null
      try {
        const queryParams = {
          ...this.filtersAlimentacion,
          ...overrideParams,
        }

        Object.keys(queryParams).forEach((key) => {
          if (queryParams[key] === '' || queryParams[key] === null) {
            delete queryParams[key]
          }
        })

        const response = await produccionService.getAlimentacion(queryParams)
        this.alimentacion = response.data || []
        this.metaAlimentacion = response.meta || this.metaAlimentacion
        if (response.stats) {
          this.statsAlimentacion = response.stats
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar registros de alimentación'
        throw err
      } finally {
        this.loadingAlimentacion = false
      }
    },

    setPageAlimentacion(page) {
      this.filtersAlimentacion.page = page
      return this.fetchAlimentacion()
    },

    setPerPageAlimentacion(perPage) {
      this.filtersAlimentacion.per_page = perPage
      this.filtersAlimentacion.page = 1
      return this.fetchAlimentacion()
    },

    resetFiltersAlimentacion() {
      this.filtersAlimentacion.search = ''
      this.filtersAlimentacion.id_division = ''
      this.filtersAlimentacion.id_tipo_alimento = ''
      this.filtersAlimentacion.fecha_inicio = ''
      this.filtersAlimentacion.fecha_fin = ''
      this.filtersAlimentacion.page = 1
      return this.fetchAlimentacion()
    },

    async addAlimentacion(payload) {
      const nuevo = await produccionService.createAlimentacion(payload)
      await this.fetchAlimentacion()
      return nuevo
    },

    async updateAlimentacion(id, payload) {
      const actualizado = await produccionService.updateAlimentacion(id, payload)
      await this.fetchAlimentacion()
      return actualizado
    },

    async removeAlimentacion(id) {
      await produccionService.deleteAlimentacion(id)
      await this.fetchAlimentacion()
    },
  },
})


import { defineStore } from 'pinia'
import * as instalacionesService from '@/services/instalaciones'

export const useInstalacionesStore = defineStore('instalaciones', {
  state: () => ({
    casitas: [],
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 5,
      total: 0,
      from: 0,
      to: 0,
    },
    stats: {
      total_casitas: 0,
      total_divisiones: 0,
      divisiones_activas: 0,
    },
    filters: {
      buscar: '',
      tipo: '',
      activa: '',
      per_page: 5,
      page: 1,
    },
    selectedCasita: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchCasitas(overrideParams = {}) {
      this.loading = true
      this.error = null
      try {
        const queryParams = {
          ...this.filters,
          ...overrideParams,
        }

        // Limpiar parámetros vacíos
        Object.keys(queryParams).forEach((key) => {
          if (queryParams[key] === '' || queryParams[key] === null) {
            delete queryParams[key]
          }
        })

        const response = await instalacionesService.getCasitas(queryParams)
        this.casitas = response.data || []
        this.meta = response.meta || this.meta
        if (response.stats) {
          this.stats = response.stats
        }

        // Si hay una casita seleccionada (modal abierto), actualizar sus divisiones
        if (this.selectedCasita) {
          const updated = this.casitas.find((c) => c.id === this.selectedCasita.id)
          if (updated) {
            this.selectedCasita = updated
          }
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar instalaciones'
      } finally {
        this.loading = false
      }
    },

    setPage(page) {
      this.filters.page = page
      return this.fetchCasitas()
    },

    setPerPage(perPage) {
      this.filters.per_page = perPage
      this.filters.page = 1
      return this.fetchCasitas()
    },

    resetFilters() {
      this.filters.buscar = ''
      this.filters.tipo = ''
      this.filters.activa = ''
      this.filters.page = 1
      return this.fetchCasitas()
    },

    async addCasita(payload) {
      const nueva = await instalacionesService.createCasita(payload)
      await this.fetchCasitas()
      return nueva
    },

    async updateCasita(id, payload) {
      const updated = await instalacionesService.updateCasita(id, payload)
      await this.fetchCasitas()
      return updated
    },

    async toggleCasita(id) {
      const updated = await instalacionesService.toggleCasitaActiva(id)
      const target = this.casitas.find((c) => c.id === id)
      if (target) {
        target.activa = updated.activa
      }
      return updated
    },

    async removeCasita(id) {
      await instalacionesService.deleteCasita(id)
      await this.fetchCasitas()
    },

    async addDivision(payload) {
      const nueva = await instalacionesService.createDivision(payload)
      await this.fetchCasitas()
      return nueva
    },

    async toggleDivision(idDivision) {
      const updated = await instalacionesService.toggleDivisionActiva(idDivision)
      await this.fetchCasitas()
      return updated
    },

    async removeDivision(idDivision) {
      await instalacionesService.deleteDivision(idDivision)
      await this.fetchCasitas()
    },

    setSelectedCasita(casita) {
      this.selectedCasita = casita
    },
  },
})

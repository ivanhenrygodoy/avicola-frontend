import { defineStore } from 'pinia'
import * as avesService from '@/services/aves'

export const useAvesStore = defineStore('aves', {
  state: () => ({
    aves: [],
    catalogos: {
      especies: [],
      sexos: [],
      propositos: [],
    },
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    },
    stats: {
      total_aves: 0,
      activas_count: 0,
      gallinas_count: 0,
      chompipes_count: 0,
      patos_count: 0,
    },
    filters: {
      search: '',
      id_especie: '',
      id_sexo: '',
      estado: 'activa',
      id_casita: '',
      id_division: '',
      per_page: 10,
      page: 1,
    },
    selectedAve: null,
    movimientos: [],
    loading: false,
    loadingMovimientos: false,
    error: null,
  }),

  actions: {
    async fetchCatalogos() {
      try {
        const data = await avesService.getCatalogosAves()
        if (data) {
          this.catalogos.especies = data.especies || []
          this.catalogos.sexos = data.sexos || []
          this.catalogos.propositos = data.propositos || []
        }
      } catch (err) {
        console.error('Error al cargar catálogos de aves:', err)
      }
    },

    async fetchAves(overrideParams = {}) {
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

        const response = await avesService.getAves(queryParams)
        this.aves = response.data || []
        this.meta = response.meta || this.meta
        if (response.stats) {
          this.stats = response.stats
        }

        if (this.selectedAve) {
          const updated = this.aves.find((a) => a.id === this.selectedAve.id)
          if (updated) {
            this.selectedAve = updated
          }
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Error al cargar inventario de aves'
        throw err
      } finally {
        this.loading = false
      }
    },

    setPage(page) {
      this.filters.page = page
      return this.fetchAves()
    },

    setPerPage(perPage) {
      this.filters.per_page = perPage
      this.filters.page = 1
      return this.fetchAves()
    },

    resetFilters() {
      this.filters.search = ''
      this.filters.id_especie = ''
      this.filters.id_sexo = ''
      this.filters.estado = 'activa'
      this.filters.id_casita = ''
      this.filters.id_division = ''
      this.filters.page = 1
      return this.fetchAves()
    },

    async addAve(payload) {
      const nueva = await avesService.createAve(payload)
      await this.fetchAves()
      return nueva
    },

    async updateAve(id, payload) {
      const updated = await avesService.updateAve(id, payload)
      await this.fetchAves()
      return updated
    },

    async removeAve(id) {
      await avesService.deleteAve(id)
      await this.fetchAves()
    },

    async trasladarAve(id, payload) {
      const resultado = await avesService.trasladarAve(id, payload)
      await this.fetchAves()
      return resultado
    },

    async fetchMovimientos(idAve) {
      this.loadingMovimientos = true
      try {
        const data = await avesService.getMovimientosAve(idAve)
        this.movimientos = data || []
        return this.movimientos
      } finally {
        this.loadingMovimientos = false
      }
    },

    setSelectedAve(ave) {
      this.selectedAve = ave
    },
  },
})

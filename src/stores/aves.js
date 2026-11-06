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
      estado: '',
      id_casita: '',
      id_division: '',
      per_page: 10,
      page: 1,
    },
    selectedAve: null,
    movimientos: [],
    pesos: [],
    observaciones: [],
    loading: false,
    loadingMovimientos: false,
    loadingPesos: false,
    loadingObservaciones: false,
    error: null,
  }),

  actions: {
    async fetchCatalogos() {
      try {
        const [especies, sexos, propositos] = await Promise.all([
          avesService.getEspecies(),
          avesService.getSexos(),
          avesService.getPropositos(),
        ])
        this.catalogos.especies = especies || []
        this.catalogos.sexos = sexos || []
        this.catalogos.propositos = propositos || []
      } catch (err) {
        console.warn('Fallback cargando catálogos agrupados:', err)
        try {
          const data = await avesService.getCatalogosAves()
          if (data) {
            this.catalogos.especies = data.especies || []
            this.catalogos.sexos = data.sexos || []
            this.catalogos.propositos = data.propositos || []
          }
        } catch (fallbackErr) {
          console.error('Error al cargar catálogos de aves:', fallbackErr)
        }
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
      this.filters.estado = ''
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

    async removeAve(id, payload = {}) {
      await avesService.deleteAve(id, payload)
      await this.fetchAves()
    },

    async reactivarAve(id, payload = {}) {
      const response = await avesService.reactivarAve(id, payload)
      await this.fetchAves()
      return response
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

    async fetchPesos(idAve) {
      this.loadingPesos = true
      try {
        const data = await avesService.getPesosAve(idAve)
        this.pesos = data || []
        return this.pesos
      } finally {
        this.loadingPesos = false
      }
    },

    async addPeso(idAve, payload) {
      const res = await avesService.addPesoAve(idAve, payload)
      await this.fetchPesos(idAve)
      await this.fetchAves()
      return res
    },

    async deletePeso(idAve, idPeso) {
      const res = await avesService.deletePesoAve(idPeso)
      await this.fetchPesos(idAve)
      await this.fetchAves()
      return res
    },

    async fetchObservaciones(idAve) {
      this.loadingObservaciones = true
      try {
        const data = await avesService.getObservacionesAve(idAve)
        this.observaciones = data || []
        return this.observaciones
      } finally {
        this.loadingObservaciones = false
      }
    },

    async addObservacion(idAve, payload) {
      const res = await avesService.addObservacionAve(idAve, payload)
      await this.fetchObservaciones(idAve)
      return res
    },

    async deleteObservacion(idAve, idObs) {
      const res = await avesService.deleteObservacionAve(idObs)
      await this.fetchObservaciones(idAve)
      return res
    },

    setSelectedAve(ave) {
      this.selectedAve = ave
    },
  },
})

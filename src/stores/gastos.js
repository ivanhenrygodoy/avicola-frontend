import { defineStore } from 'pinia'
import * as gastosService from '@/services/gastos'

export const useGastosStore = defineStore('gastos', {
  state: () => ({
    gastos: [],
    categorias: [],
    stats: {
      total_gastos: 0,
      total_mes_actual: 0,
      total_registros: 0,
    },
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0,
    },
    filters: {
      search: '',
      id_categoria_gasto: '',
      id_division: '',
      fecha_inicio: '',
      fecha_fin: '',
      page: 1,
      per_page: 10,
    },
    loading: false,
    error: null,
  }),

  actions: {
    async fetchCategorias() {
      try {
        const data = await gastosService.getCategoriasGastos()
        this.categorias = data || []
        return this.categorias
      } catch (err) {
        console.error('Error cargando categorías de gastos:', err)
        this.error = err
        return []
      }
    },

    async fetchGastos() {
      this.loading = true
      this.error = null
      try {
        const params = {
          page: this.filters.page,
          per_page: this.filters.per_page,
        }
        if (this.filters.search?.trim()) params.search = this.filters.search.trim()
        if (this.filters.id_categoria_gasto) params.id_categoria_gasto = this.filters.id_categoria_gasto
        if (this.filters.id_division) params.id_division = this.filters.id_division
        if (this.filters.fecha_inicio) params.fecha_inicio = this.filters.fecha_inicio
        if (this.filters.fecha_fin) params.fecha_fin = this.filters.fecha_fin

        const response = await gastosService.getGastos(params)
        this.gastos = response.data || []
        if (response.meta) {
          this.meta = response.meta
        }
        if (response.stats) {
          this.stats = response.stats
        }
      } catch (err) {
        console.error('Error cargando gastos:', err)
        this.error = err
      } finally {
        this.loading = false
      }
    },

    setFilter(key, value) {
      this.filters[key] = value
      this.filters.page = 1
      return this.fetchGastos()
    },

    resetFilters() {
      this.filters.search = ''
      this.filters.id_categoria_gasto = ''
      this.filters.id_division = ''
      this.filters.fecha_inicio = ''
      this.filters.fecha_fin = ''
      this.filters.page = 1
      return this.fetchGastos()
    },

    async addGasto(payload) {
      const res = await gastosService.createGasto(payload)
      await this.fetchGastos()
      return res
    },

    async updateGasto(id, payload) {
      const res = await gastosService.updateGasto(id, payload)
      await this.fetchGastos()
      return res
    },

    async removeGasto(id) {
      await gastosService.deleteGasto(id)
      await this.fetchGastos()
    },
  },
})


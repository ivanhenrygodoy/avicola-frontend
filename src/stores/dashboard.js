import { defineStore } from 'pinia'
import * as dashboardService from '@/services/dashboard'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    resumen: null,
    dias: 7,
    loading: false,
    error: null,

    // Actividad reciente: se pide solo cuando el usuario despliega el listado
    actividad: [],
    actividadMeta: {
      current_page: 1,
      last_page: 1,
      per_page: 5,
      total: 0,
      from: 0,
      to: 0,
    },
    actividadLoaded: false,
    loadingActividad: false,
    errorActividad: null,
  }),

  getters: {
    hayDatos: (state) => state.resumen !== null,
  },

  actions: {
    async fetchResumen() {
      this.loading = true
      this.error = null
      try {
        this.resumen = await dashboardService.getResumen({ dias: this.dias })
      } catch (err) {
        console.error('Error cargando resumen del dashboard:', err)
        this.error = err
      } finally {
        this.loading = false
      }
    },

    setDias(dias) {
      this.dias = dias
      return this.fetchResumen()
    },

    async fetchActividad() {
      this.loadingActividad = true
      this.errorActividad = null
      try {
        const response = await dashboardService.getActividad({
          page: this.actividadMeta.current_page,
          per_page: this.actividadMeta.per_page,
        })
        this.actividad = response.data || []
        if (response.meta) {
          this.actividadMeta = response.meta
        }
        this.actividadLoaded = true
      } catch (err) {
        console.error('Error cargando actividad reciente:', err)
        this.errorActividad = err
      } finally {
        this.loadingActividad = false
      }
    },

    setActividadPage(page) {
      this.actividadMeta.current_page = page
      return this.fetchActividad()
    },

    setActividadPerPage(perPage) {
      this.actividadMeta.per_page = perPage
      this.actividadMeta.current_page = 1
      return this.fetchActividad()
    },
  },
})

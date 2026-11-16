import { defineStore } from 'pinia'
import { fuentesConocimientoService } from '@/services/fuentesConocimiento'

export const useFuentesConocimientoStore = defineStore('fuentesConocimiento', {
  state: () => ({
    fuentes: [],
    meta: {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
    },
    stats: {
      total_fuentes: 0,
      total_publicadas: 0,
      total_fragmentos: 0,
      especies_cubiertas: 0,
    },
    filtros: {
      busqueda: '',
      especie: 'Todas',
      estado: 'Todos',
      page: 1,
      per_page: 10,
    },
    loading: false,
    loadingDetalle: false,
    loadingEdicion: false,
    submitting: false,
    fuenteSeleccionada: null,
    textoOriginalSeleccionado: '',
    fuenteAEditar: null,
    textoOriginalEditar: '',
    modalRegistroAbierto: false,
    modalDetalleAbierto: false,
  }),

  actions: {
    async cargarFuentes(pagina = null) {
      if (pagina !== null) {
        this.filtros.page = pagina
      }

      this.loading = true
      try {
        const params = {
          page: this.filtros.page,
          per_page: this.filtros.per_page,
          busqueda: this.filtros.busqueda || undefined,
          especie: this.filtros.especie !== 'Todas' ? this.filtros.especie : undefined,
          estado: this.filtros.estado !== 'Todos' ? this.filtros.estado : undefined,
        }

        const res = await fuentesConocimientoService.listar(params)
        this.fuentes = res.data || []
        this.meta = res.meta || this.meta
        this.stats = res.stats || this.stats
      } finally {
        this.loading = false
      }
    },

    setFiltro(clave, valor) {
      this.filtros[clave] = valor
      this.filtros.page = 1
      return this.cargarFuentes()
    },

    limpiarFiltros() {
      this.filtros.busqueda = ''
      this.filtros.especie = 'Todas'
      this.filtros.estado = 'Todos'
      this.filtros.page = 1
      return this.cargarFuentes()
    },

    abrirRegistro() {
      this.fuenteAEditar = null
      this.textoOriginalEditar = ''
      this.modalRegistroAbierto = true
    },

    async abrirEdicion(id) {
      this.fuenteAEditar = null
      this.textoOriginalEditar = ''
      this.modalRegistroAbierto = true
      this.loadingEdicion = true
      try {
        const res = await fuentesConocimientoService.obtenerDetalle(id)
        this.fuenteAEditar = res.data
        this.textoOriginalEditar = res.texto_original || ''
      } catch (err) {
        this.modalRegistroAbierto = false
        throw err
      } finally {
        this.loadingEdicion = false
      }
    },

    cerrarRegistro() {
      this.modalRegistroAbierto = false
      this.fuenteAEditar = null
      this.textoOriginalEditar = ''
    },

    async abrirDetalle(id) {
      this.modalDetalleAbierto = true
      this.loadingDetalle = true
      this.fuenteSeleccionada = null
      this.textoOriginalSeleccionado = ''

      try {
        const res = await fuentesConocimientoService.obtenerDetalle(id)
        this.fuenteSeleccionada = res.data
        this.textoOriginalSeleccionado = res.texto_original || ''
      } catch (err) {
        this.modalDetalleAbierto = false
        throw err
      } finally {
        this.loadingDetalle = false
      }
    },

    cerrarDetalle() {
      this.modalDetalleAbierto = false
      this.fuenteSeleccionada = null
      this.textoOriginalSeleccionado = ''
    },

    async registrarFuente(payload) {
      this.submitting = true
      try {
        const res = await fuentesConocimientoService.registrar(payload)
        await this.cargarFuentes(1)
        this.cerrarRegistro()
        return res
      } finally {
        this.submitting = false
      }
    },

    async actualizarFuente(id, payload) {
      this.submitting = true
      try {
        const res = await fuentesConocimientoService.actualizar(id, payload)
        await this.cargarFuentes()
        this.cerrarRegistro()
        return res
      } finally {
        this.submitting = false
      }
    },

    setPerPage(perPage) {
      this.filtros.per_page = perPage
      this.filtros.page = 1
      return this.cargarFuentes()
    },

    async procesarFuente(id) {
      this.submitting = true
      try {
        const res = await fuentesConocimientoService.procesar(id)
        // Si el modal de detalle está abierto, refrescar los datos del detalle
        if (this.modalDetalleAbierto && this.fuenteSeleccionada?.id === id) {
          await this.abrirDetalle(id)
        }
        await this.cargarFuentes()
        return res
      } finally {
        this.submitting = false
      }
    },

    async alternarEstadoFuente(id) {
      this.submitting = true
      try {
        const res = await fuentesConocimientoService.alternarEstado(id)
        if (this.modalDetalleAbierto && this.fuenteSeleccionada?.id === id) {
          this.fuenteSeleccionada.estado = res.data.estado
        }
        await this.cargarFuentes()
        return res
      } finally {
        this.submitting = false
      }
    },

    async descargarArchivo(fuente) {
      try {
        const response = await fuentesConocimientoService.descargar(fuente.id)
        const blob = new Blob([response.data], {
          type: response.headers['content-type'] || 'application/octet-stream',
        })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fuente.nombre_archivo_original || `${fuente.titulo.replace(/\s+/g, '_')}.txt`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      } catch (err) {
        throw err
      }
    },
  },
})


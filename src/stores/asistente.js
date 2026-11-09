import { defineStore } from 'pinia'
import * as asistenteService from '@/services/asistente'

export const useAsistenteStore = defineStore('asistente', {
  state: () => ({
    isOpen: false,
    cargando: false,
    error: null,
    mensajes: [],
  }),

  getters: {
    totalMensajes: (state) => state.mensajes.length,
    tieneMensajes: (state) => state.mensajes.length > 0,
  },

  actions: {
    toggleWidget() {
      this.isOpen = !this.isOpen
    },

    abrirWidget() {
      this.isOpen = true
    },

    cerrarWidget() {
      this.isOpen = false
    },

    limpiarHistorial() {
      this.mensajes = []
      this.error = null
    },

    async enviarMensaje(texto) {
      const textoLimpio = (texto || '').trim()
      if (!textoLimpio || this.cargando) {
        return
      }

      const horaActual = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })

      // Mensaje del usuario
      const userMsg = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: textoLimpio,
        timestamp: horaActual,
        herramientas: [],
      }

      // Preparar historial previo formateado para Gemini (últimos 10 turnos)
      const historialApi = this.mensajes.slice(-10).map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      }))

      this.mensajes.push(userMsg)
      this.cargando = true
      this.error = null

      try {
        const data = await asistenteService.enviarMensaje({
          mensaje: textoLimpio,
          historial: historialApi,
        })

        const modelMsg = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.respuesta || 'Sin respuesta.',
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          herramientas: data.herramientas_utilizadas || [],
        }

        this.mensajes.push(modelMsg)
      } catch (err) {
        console.error('Error en el asistente virtual:', err)
        const mensajeError =
          err.response?.data?.message ||
          'Lo siento, ocurrió un error al consultar el asistente. Intenta nuevamente.'

        this.error = mensajeError

        this.mensajes.push({
          id: `error-${Date.now()}`,
          role: 'model',
          text: mensajeError,
          timestamp: new Date().toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          herramientas: [],
          esError: true,
        })
      } finally {
        this.cargando = false
      }
    },
  },
})


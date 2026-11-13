import { defineStore } from 'pinia'
import * as asistenteService from '@/services/asistente'
import { useNotificationStore } from '@/stores/notification'

// Clave de localStorage con el UUID de la conversación abierta. El UUID lo genera el servidor en el primer
// mensaje y se valida contra el usuario autenticado en cada acceso, así que no es un secreto ni una
// credencial. localStorage puede fallar (modo privado, almacenamiento bloqueado): el chat debe funcionar igual.
const CLAVE_UUID = 'avicola_asistente_uuid'

const leerUuid = () => {
  try {
    return localStorage.getItem(CLAVE_UUID) || null
  } catch {
    return null
  }
}

const guardarUuid = (uuid) => {
  try {
    if (uuid) localStorage.setItem(CLAVE_UUID, uuid)
    else localStorage.removeItem(CLAVE_UUID)
  } catch {
    // Sin almacenamiento disponible: la conversación sigue en memoria durante la sesión.
  }
}

const hora = (fecha = new Date()) =>
  fecha.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

// Un mensaje guardado en el servidor → el formato que pinta AsistenteMensaje
const aMensajeDeChat = (m) => ({
  id: `srv-${m.id}`,
  role: m.rol,
  text: m.contenido,
  timestamp: m.created_at ? hora(new Date(m.created_at)) : '',
  herramientas: m.herramientas || [],
  sugerenciasModulos: m.sugerencias_modulos || [],
  esError: Boolean(m.es_error),
})

// Contadores de petición: solo la última de cada tipo puede escribir en el estado. "Generación" cambia cada
// vez que el chat cambia de conversación (limpiar, abrir otra, cerrar sesión): una respuesta que llega de
// una generación anterior se descarta, para que no reponga el UUID viejo ni se mezcle en un chat ya vacío.
let generacion = 0
let ultimaCarga = 0
let ultimoListado = 0

// Deja el chat vacío y sin conversación, e invalida cualquier petición en vuelo. No toca el servidor.
// Es una función y no una acción del store porque Pinia no admite métodos privados (`#`) en `actions`.
const reiniciarChat = (store) => {
  generacion++
  ultimaCarga++
  store.mensajes = []
  store.error = null
  store.cargando = false
  store.cargandoConversacion = false
  store.uuidConversacion = null
  guardarUuid(null)
}

export const useAsistenteStore = defineStore('asistente', {
  state: () => ({
    isOpen: false,
    cargando: false,
    error: null,
    mensajes: [],
    uuidConversacion: leerUuid(),
    cargandoConversacion: false,
    conversaciones: [],
    cargandoHistorial: false,
    errorHistorial: false,
    abriendoConversacion: false,
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

    /**
     * Botón "Limpiar conversación". Vacía el chat y suelta el UUID; NO borra nada ni llama al servidor: la
     * conversación sigue en el historial y el UUID nuevo nace con el siguiente mensaje (lo genera el servidor).
     */
    limpiarHistorial() {
      if (!this.tieneMensajes && !this.uuidConversacion) return

      reiniciarChat(this)
      useNotificationStore().info('Conversación guardada en el historial.')
    },

    /**
     * Recupera la conversación abierta tras recargar la página. Si el UUID ya no sirve (eliminada, ajena,
     * inexistente) se olvida y el chat queda vacío; cualquier otro fallo deja el chat vacío y usable.
     */
    async cargarConversacion() {
      const uuid = this.uuidConversacion
      if (!uuid) return

      const turno = ++ultimaCarga
      const gen = generacion
      this.cargandoConversacion = true
      try {
        const data = await asistenteService.obtenerConversacion(uuid)
        if (turno !== ultimaCarga || gen !== generacion) return
        this.mensajes = (data.mensajes || []).map(aMensajeDeChat)
      } catch (err) {
        if (turno !== ultimaCarga || gen !== generacion) return
        if (err.response?.status === 404) {
          this.uuidConversacion = null
          guardarUuid(null)
        }
        this.mensajes = []
      } finally {
        if (turno === ultimaCarga) this.cargandoConversacion = false
      }
    },

    async cargarHistorial() {
      const turno = ++ultimoListado
      this.cargandoHistorial = true
      this.errorHistorial = false
      try {
        const lista = await asistenteService.listarConversaciones()
        if (turno !== ultimoListado) return
        this.conversaciones = lista || []
      } catch (err) {
        if (turno !== ultimoListado) return
        console.error('Error cargando el historial de conversaciones:', err)
        this.errorHistorial = true
      } finally {
        if (turno === ultimoListado) this.cargandoHistorial = false
      }
    },

    /**
     * Abre una conversación del historial en el chat, con el mismo estado de recarga que al recargar la
     * página (`cargandoConversacion`: el chat muestra "Cargando conversación..." y se bloquean entrada,
     * Historial y Limpiar). Los mensajes actuales no se descartan hasta que la carga termina bien: si falla,
     * el chat anterior reaparece intacto. Devuelve true si se abrió.
     */
    async abrirConversacion(uuid) {
      const turno = ++ultimaCarga
      const gen = generacion
      this.abriendoConversacion = true
      this.cargandoConversacion = true
      try {
        const data = await asistenteService.obtenerConversacion(uuid)
        if (turno !== ultimaCarga || gen !== generacion) return false

        generacion++ // cualquier respuesta en vuelo de la conversación anterior ya no aplica
        this.mensajes = (data.mensajes || []).map(aMensajeDeChat)
        this.uuidConversacion = data.uuid || uuid
        guardarUuid(this.uuidConversacion)
        this.error = null
        return true
      } catch (err) {
        if (err.response?.status === 404) {
          this.conversaciones = this.conversaciones.filter((c) => c.uuid !== uuid)
        }
        throw err
      } finally {
        if (turno === ultimaCarga) {
          this.abriendoConversacion = false
          this.cargandoConversacion = false
        }
      }
    },

    async renombrarConversacion(uuid, nombre) {
      const data = await asistenteService.renombrarConversacion(uuid, nombre)
      this.conversaciones = this.conversaciones.map((c) => (c.uuid === uuid ? { ...c, nombre: data.nombre } : c))
      return data
    },

    /**
     * Elimina una conversación del historial (cambio de estado en el servidor). Si era la abierta, el chat se
     * vacía y se olvida el UUID. Un 404 se trata como éxito: ya no está en el historial.
     */
    async eliminarConversacion(uuid) {
      try {
        await asistenteService.eliminarConversacion(uuid)
      } catch (err) {
        if (err.response?.status !== 404) throw err
      }

      this.conversaciones = this.conversaciones.filter((c) => c.uuid !== uuid)
      if (this.uuidConversacion === uuid) reiniciarChat(this)
    },

    async enviarMensaje(texto) {
      const textoLimpio = (texto || '').trim()
      if (!textoLimpio || this.cargando || this.cargandoConversacion) {
        return
      }

      // Si el chat cambia de conversación mientras esperamos (limpiar, abrir otra, cerrar sesión), esta
      // respuesta ya no pertenece al chat actual y se descarta.
      const gen = generacion

      this.mensajes.push({
        id: `user-${Date.now()}`,
        role: 'user',
        text: textoLimpio,
        timestamp: hora(),
        herramientas: [],
      })
      this.cargando = true
      this.error = null

      try {
        const payload = { mensaje: textoLimpio }
        if (this.uuidConversacion) payload.uuid_conversacion = this.uuidConversacion

        const data = await asistenteService.enviarMensaje(payload)
        if (gen !== generacion) return

        // El servidor devuelve el UUID real (creó la conversación o retomó la nuestra). Si es null el
        // servidor no pudo guardar la conversación: no se toca localStorage y el chat sigue funcionando.
        if (data.uuid_conversacion) {
          this.uuidConversacion = data.uuid_conversacion
          guardarUuid(data.uuid_conversacion)
        }

        this.mensajes.push({
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.respuesta || 'Sin respuesta.',
          timestamp: hora(),
          herramientas: data.herramientas_utilizadas || [],
          sugerenciasModulos: data.sugerencias_modulos || [],
        })

        // El nombre automático se pide aparte, sin esperar y sin notificar errores: es un detalle del historial.
        if (data.requiere_titulo && data.uuid_conversacion) {
          asistenteService.solicitarTitulo(data.uuid_conversacion).catch(() => {})
        }
      } catch (err) {
        if (gen !== generacion) return

        console.error('Error en el asistente virtual:', err)
        const mensajeError =
          err.response?.data?.message ||
          'AviaCore experimentó una demora de conexión al consultar el servicio de asistencia. Por favor, intenta formular tu consulta nuevamente en unos instantes.'

        this.error = mensajeError

        this.mensajes.push({
          id: `error-${Date.now()}`,
          role: 'model',
          text: mensajeError,
          timestamp: hora(),
          herramientas: [],
          esError: true,
        })
      } finally {
        if (gen === generacion) this.cargando = false
      }
    },

    /**
     * Estado limpio, sin tocar el servidor: al cerrar sesión (otro usuario no debe ver mensajes ajenos) y
     * al limpiar. Invalida cualquier petición en vuelo.
     */
    reiniciar() {
      reiniciarChat(this)
      this.conversaciones = []
      this.cargandoHistorial = false
      this.errorHistorial = false
      this.abriendoConversacion = false
      ultimoListado++
    },
  },
})

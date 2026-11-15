import { defineStore } from 'pinia'

const CLAVE = 'avicola_sidebar_abierto'
const BREAKPOINT_LG = 1024

const esEscritorio = () => typeof window !== 'undefined' && window.innerWidth >= BREAKPOINT_LG

// localStorage puede lanzar (ventana privada, datos bloqueados): la pantalla debe funcionar igual.
const leer = () => {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return guardado === null ? null : guardado === '1'
  } catch {
    return null
  }
}

const guardar = (abierto) => {
  try {
    localStorage.setItem(CLAVE, abierto ? '1' : '0')
  } catch {
    // Sin persistencia: la elección vale solo para esta sesión de la pestaña
  }
}

export const useNavegacionStore = defineStore('navegacion', {
  state: () => ({
    // Por defecto abierto en escritorio y cerrado bajo `lg`; si el usuario eligió, se respeta en escritorio.
    // Bajo `lg` el sidebar es un panel superpuesto y arranca siempre cerrado.
    abierto: esEscritorio() ? (leer() ?? true) : false,
  }),

  actions: {
    alternar() {
      this.abierto = !this.abierto
      // Solo se recuerda la elección hecha en escritorio: en móvil abrir/cerrar es algo pasajero.
      if (esEscritorio()) guardar(this.abierto)
    },

    abrir() {
      this.abierto = true
      if (esEscritorio()) guardar(true)
    },

    cerrar() {
      this.abierto = false
      if (esEscritorio()) guardar(false)
    },

    // Al navegar en móvil se cierra el panel sin tocar la preferencia de escritorio.
    cerrarSiEsMovil() {
      if (!esEscritorio()) this.abierto = false
    },

    // Al cruzar el breakpoint `lg`, adapta el estado sin sobrescribir la preferencia de escritorio.
    sincronizarModo(esDesktop) {
      this.abierto = esDesktop ? (leer() ?? true) : false
    },
  },
})

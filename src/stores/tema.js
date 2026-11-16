import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import { temaService } from '@/services/tema'

const CLAVE_MODO = 'avicola_modo_tema'
const CLAVE_CACHE = 'avicola_tema_cache'

const hexARgb = (hex) => {
  const limpio = String(hex || '').trim().replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(limpio)) return null
  const r = parseInt(limpio.slice(0, 2), 16)
  const g = parseInt(limpio.slice(2, 4), 16)
  const b = parseInt(limpio.slice(4, 6), 16)
  return `${r} ${g} ${b}`
}

const leerModoGuardado = () => {
  try {
    return localStorage.getItem(CLAVE_MODO) === 'nocturno' ? 'nocturno' : 'claro'
  } catch {
    return 'claro'
  }
}

const guardarModoLocal = (modo) => {
  try {
    localStorage.setItem(CLAVE_MODO, modo)
  } catch {
    // Sin persistencia local en modo privado estricto
  }
}

const leerCachePaleta = () => {
  try {
    const raw = localStorage.getItem(CLAVE_CACHE)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const guardarCachePaleta = (paleta) => {
  try {
    localStorage.setItem(CLAVE_CACHE, JSON.stringify(paleta))
  } catch {
    // Ignorar error de cuota
  }
}

export const useTemaStore = defineStore('tema', {
  state: () => ({
    modo: leerModoGuardado(),
    paleta: leerCachePaleta() || { claro: {}, nocturno: {} },
    componentes: [],
    componenteActual: null,
    cargando: false,
    guardando: false,
  }),

  getters: {
    esNocturno: (state) => state.modo === 'nocturno',
  },

  actions: {
    aplicarAlDocumento(sobrescribirVariables = null) {
      if (typeof document === 'undefined') return
      const root = document.documentElement

      if (this.modo === 'nocturno') {
        root.setAttribute('data-theme', 'nocturno')
      } else {
        root.removeAttribute('data-theme')
      }

      // Limpiar variables previas inline para que el cambio de modo use sus defaults limpios
      for (let i = root.style.length - 1; i >= 0; i -= 1) {
        const prop = root.style[i]
        if (prop.startsWith('--avicola-')) {
          root.style.removeProperty(prop)
        }
      }

      const mapaModo = {
        ...(this.paleta[this.modo] || {}),
        ...(sobrescribirVariables || {}),
      }

      Object.entries(mapaModo).forEach(([variable, valor]) => {
        if (!variable.startsWith('--avicola-')) return
        const rgb = hexARgb(valor)
        root.style.setProperty(variable, rgb ?? valor)
      })
    },

    async cargarTemaActivo() {
      this.aplicarAlDocumento()
      try {
        const datos = await temaService.obtenerActivo()
        this.paleta = datos
        guardarCachePaleta(datos)
        this.aplicarAlDocumento()
      } catch {
        // Si la API no responde al arrancar, mantiene caché o defaults de style.css
      }
    },

    sincronizarDesdeUsuario(modoUsuario) {
      if (modoUsuario === 'claro' || modoUsuario === 'nocturno') {
        this.modo = modoUsuario
        guardarModoLocal(modoUsuario)
        this.aplicarAlDocumento()
      }
    },

    async alternarModoNocturno(autenticado = false, event = null) {
      const cambiarEstado = () => {
        const nuevoModo = this.modo === 'nocturno' ? 'claro' : 'nocturno'
        this.modo = nuevoModo
        guardarModoLocal(nuevoModo)
        this.aplicarAlDocumento()
        return nuevoModo
      }

      // Comprobar soporte nativo de View Transitions API y preferencias de accesibilidad
      const soportaViewTransition = typeof document !== 'undefined'
        && typeof document.startViewTransition === 'function'
        && !window.matchMedia('(prefers-reduced-motion: reduce)').matches

      if (!soportaViewTransition) {
        if (typeof document !== 'undefined') {
          const root = document.documentElement
          root.classList.add('theme-transitioning')
          window.clearTimeout(window.__avicolaThemeTransitionTimer)
          window.__avicolaThemeTransitionTimer = window.setTimeout(() => {
            root.classList.remove('theme-transitioning')
          }, 720)
        }

        const nuevoModo = cambiarEstado()

        if (autenticado) {
          try {
            await temaService.guardarPreferenciaUsuario(nuevoModo)
          } catch {
            // Falla silenciosa: el cambio visual inmediato se mantiene en localStorage
          }
        }
        return
      }

      // Calcular origen del efecto circular (coordenadas del clic o centro del botón)
      let x = window.innerWidth / 2
      let y = 0

      if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
        x = event.clientX
        y = event.clientY
      } else if (event?.currentTarget instanceof HTMLElement) {
        const rect = event.currentTarget.getBoundingClientRect()
        x = rect.left + rect.width / 2
        y = rect.top + rect.height / 2
      }

      // Radio máximo para cubrir toda la pantalla desde el punto de origen
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      )

      let nuevoModo
      const transition = document.startViewTransition(async () => {
        nuevoModo = cambiarEstado()
        await nextTick()
      })

      try {
        await transition.ready

        const clipPath = [
          `circle(0px at ${x}px ${y}px)`,
          `circle(${endRadius}px at ${x}px ${y}px)`,
        ]

        const animation = document.documentElement.animate(
          {
            clipPath,
          },
          {
            duration: 700,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        )

        await animation.finished
      } catch {
        // En caso de que la animación sea abortada por el navegador
      }

      if (autenticado && nuevoModo) {
        try {
          await temaService.guardarPreferenciaUsuario(nuevoModo)
        } catch {
          // Falla silenciosa
        }
      }
    },

    async fetchComponentes() {
      this.cargando = true
      try {
        this.componentes = await temaService.listarComponentes()
      } finally {
        this.cargando = false
      }
    },

    async fetchComponente(clave) {
      this.cargando = true
      try {
        this.componenteActual = await temaService.obtenerComponente(clave)
        return this.componenteActual
      } finally {
        this.cargando = false
      }
    },

    async guardarComponente(clave, modo, aspectos) {
      this.guardando = true
      try {
        const actualizado = await temaService.actualizarComponente(clave, { modo, aspectos })
        this.componenteActual = actualizado
        await this.cargarTemaActivo()
        await this.fetchComponentes()
        return actualizado
      } finally {
        this.guardando = false
      }
    },

    async restaurarComponente(clave, modo = null) {
      this.guardando = true
      try {
        const restaurado = await temaService.restaurarComponente(clave, modo)
        this.componenteActual = restaurado
        await this.cargarTemaActivo()
        await this.fetchComponentes()
        return restaurado
      } finally {
        this.guardando = false
      }
    },

    async restaurarTodo() {
      this.guardando = true
      try {
        this.componentes = await temaService.restaurarTodo()
        if (this.componenteActual) {
          this.componenteActual = await temaService.obtenerComponente(this.componenteActual.clave)
        }
        await this.cargarTemaActivo()
      } finally {
        this.guardando = false
      }
    },
  },
})


import { defineStore } from 'pinia'
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

    async alternarModoNocturno(autenticado = false) {
      if (typeof document !== 'undefined') {
        const root = document.documentElement
        root.classList.add('theme-transitioning')
        // Forzar reflow para que el navegador registre la transición antes de cambiar las variables
        void root.offsetHeight
        window.clearTimeout(window.__avicolaThemeTransitionTimer)
        window.__avicolaThemeTransitionTimer = window.setTimeout(() => {
          root.classList.remove('theme-transitioning')
        }, 720)
      }

      const nuevoModo = this.modo === 'nocturno' ? 'claro' : 'nocturno'
      this.modo = nuevoModo
      guardarModoLocal(nuevoModo)
      this.aplicarAlDocumento()

      if (autenticado) {
        try {
          await temaService.guardarPreferenciaUsuario(nuevoModo)
        } catch {
          // Falla silenciosa: el cambio visual inmediato se mantiene en localStorage
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


import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/stores/auth'
import { useTemaStore } from '@/stores/tema'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Los permisos pueden haber cambiado desde la última visita (el superAdmin otorga o retira módulos):
// se vuelve a pedir `me` ANTES de montar el router, para que la guardia y el menú partan de datos
// frescos y no del usuario guardado en localStorage (R5/R17). Si falla, se sigue con lo guardado:
// el servidor es quien protege, y un 401 lo maneja el interceptor.
// Tope de espera: si la API está lenta o colgada la app monta igual con lo guardado, en vez de
// quedarse en blanco hasta que el navegador se rinda. La petición sigue su curso y, si llega a
// responder, actualiza el usuario (y con él el menú) sin recargar.
const ESPERA_MAXIMA_ARRANQUE_MS = 4000

const arrancar = async () => {
  const authStore = useAuthStore()
  const temaStore = useTemaStore()

  // Aplica caché local de inmediato para evitar parpadeo visual
  temaStore.aplicarAlDocumento()

  if (authStore.isAuthenticated) {
    await Promise.race([
      authStore.fetchCurrentUser(),
      new Promise((resolve) => setTimeout(resolve, ESPERA_MAXIMA_ARRANQUE_MS)),
    ])
    if (authStore.user?.modo_tema) {
      temaStore.sincronizarDesdeUsuario(authStore.user.modo_tema)
    }
  }

  temaStore.cargarTemaActivo()

  app.use(router)
  app.mount('#app')
}

arrancar()

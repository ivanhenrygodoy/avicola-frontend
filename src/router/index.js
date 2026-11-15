import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'

// Rutas autenticadas: comparten el layout con sidebar y barra superior (el subtítulo sale de meta.subtitle).
// `meta.modulo` es la clave del módulo que el servidor debe haber concedido al usuario (R6).
const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guestOnly: true },
  },
  {
    path: '/',
    component: () => import('@/components/common/AppLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { requiresAuth: true, modulo: 'dashboard', subtitle: 'Panel de Control' },
      },
      {
        path: 'instalaciones',
        name: 'instalaciones',
        component: () => import('@/views/InstalacionesView.vue'),
        meta: { requiresAuth: true, modulo: 'instalaciones', subtitle: 'Instalaciones y Corrales' },
      },
      {
        path: 'aves',
        name: 'aves',
        component: () => import('@/views/AvesView.vue'),
        meta: { requiresAuth: true, modulo: 'aves', subtitle: 'Inventario de Aves' },
      },
      {
        path: 'produccion',
        name: 'produccion',
        component: () => import('@/views/ProduccionView.vue'),
        meta: { requiresAuth: true, modulo: 'produccion', subtitle: 'Alimentación y Postura' },
      },
      {
        path: 'gastos',
        name: 'gastos',
        component: () => import('@/views/GastosView.vue'),
        meta: { requiresAuth: true, modulo: 'gastos', subtitle: 'Control de Gastos' },
      },
      {
        path: 'benchmark',
        name: 'benchmark',
        component: () => import('@/views/BenchmarkView.vue'),
        meta: { requiresAuth: true, modulo: 'benchmark', subtitle: 'Benchmark AviaCore' },
      },
      {
        path: 'usuarios',
        name: 'usuarios',
        component: () => import('@/views/UsuariosView.vue'),
        meta: { requiresAuth: true, modulo: 'usuarios', subtitle: 'Gestión de Usuarios' },
      },
      {
        path: 'permisos',
        name: 'permisos',
        component: () => import('@/views/PermisosView.vue'),
        meta: { requiresAuth: true, modulo: 'permisos', subtitle: 'Permisos por Rol' },
      },
      {
        path: 'apariencia',
        name: 'apariencia',
        component: () => import('@/views/AparienciaView.vue'),
        meta: { requiresAuth: true, modulo: 'apariencia', subtitle: 'Apariencia y Paleta' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Orden en que se busca un destino alternativo si el usuario no tiene el Dashboard
const ORDEN_MODULOS = ['dashboard', 'instalaciones', 'aves', 'produccion', 'gastos', 'usuarios', 'permisos', 'apariencia']

// Primer destino permitido: el Dashboard o, si tampoco lo tiene, el primer módulo con ruta que sí tenga
export const destinoPermitido = (authStore) => {
  const nombre = ORDEN_MODULOS.find((clave) => authStore.puede(clave))
  return nombre ? { name: nombre } : null
}

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  // Un usuario autenticado sin ningún módulo (sin rol, rol vacío o cuenta recién desactivada) no tiene a
  // dónde ir: `login` es solo para invitados y cualquier otra ruta lo rechaza. Se cierra su sesión local
  // para no rebotar sin fin entre ambas, y se le explica por qué.
  if (authStore.isAuthenticated && !destinoPermitido(authStore)) {
    authStore.expulsar()
    useNotificationStore().warning('Tu cuenta no tiene módulos asignados. Contacta al administrador.')
    return to.name === 'login' ? true : { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return destinoPermitido(authStore)
  }

  // Guardia por módulo (R6): la seguridad real es el 403 del servidor, esto evita pantallas rotas.
  // Aquí el usuario tiene al menos un módulo, así que `destino` siempre existe y difiere de `to`.
  const modulo = to.meta.modulo
  if (modulo && authStore.isAuthenticated && !authStore.puede(modulo)) {
    useNotificationStore().warning('Ya no tienes acceso a ese módulo.')
    return destinoPermitido(authStore)
  }

  return true
})

export default router

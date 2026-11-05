<script setup>
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import {
  LayoutDashboard,
  Home,
  Layers,
  Egg,
  User,
  LogOut,
  Menu,
  X,
} from 'lucide-vue-next'

defineProps({
  subtitle: {
    type: String,
    default: 'Gestión Avícola',
  },
})

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const isMobileMenuOpen = ref(false)

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}

const navItems = [
  {
    name: 'Dashboard',
    to: '/',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    name: 'Instalaciones',
    to: '/instalaciones',
    icon: Home,
    exact: false,
  },
  {
    name: 'Inventario de Aves',
    to: '/aves',
    icon: Layers,
    exact: false,
  },
  {
    name: 'Producción',
    to: '/produccion',
    icon: Egg,
    exact: false,
  },
]

const isActive = (item) => {
  if (item.exact) {
    return route.path === item.to
  }
  return route.path.startsWith(item.to)
}
</script>

<template>
  <header class="bg-white border-b border-borde sticky top-0 z-30 shadow-xs">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <!-- Identidad y Navegación Principal -->
      <div class="flex items-center gap-6">
        <!-- Logo y Título de la Granja -->
        <router-link
          to="/"
          class="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-salvia rounded-xl p-0.5"
        >
          <div class="w-10 h-10 rounded-xl bg-bosque text-white flex items-center justify-center shadow-xs group-hover:bg-bosque-hover transition-colors">
            <GallinaIcon class="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 class="text-base font-bold text-verdoso leading-tight group-hover:text-bosque transition-colors">
              Granja Avícola Inteligente
            </h1>
            <span class="text-xs text-salvia font-semibold block">{{ subtitle }}</span>
          </div>
        </router-link>

        <!-- Navegación de Escritorio (md+) -->
        <nav class="hidden md:flex items-center gap-1.5" aria-label="Navegación principal">
          <router-link
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            :class="[
              'px-3.5 py-2 text-sm rounded-xl flex items-center gap-2 transition-all',
              isActive(item)
                ? 'font-semibold text-bosque bg-bosque-50 border border-bosque/20 shadow-2xs'
                : 'font-medium text-verdoso-muted hover:text-verdoso hover:bg-crema/70'
            ]"
          >
            <component
              :is="item.icon"
              :class="['w-4 h-4', isActive(item) ? 'text-bosque' : 'text-salvia']"
            />
            <span>{{ item.name }}</span>
          </router-link>
        </nav>
      </div>

      <!-- Acciones de Usuario & Botón Móvil -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Badge de Usuario Autenticado -->
        <div class="hidden sm:flex items-center gap-2 text-sm text-verdoso bg-crema px-3.5 py-1.5 rounded-full border border-borde">
          <User class="w-4 h-4 text-salvia" />
          <span class="font-medium">{{ authStore.user?.name || 'Administrador' }}</span>
        </div>

        <!-- Botón Cerrar Sesión -->
        <button
          @click="handleLogout"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-full border border-red-200 transition-colors cursor-pointer"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>

        <!-- Botón Menú Móvil (md:hidden) -->
        <button
          @click="toggleMobileMenu"
          class="md:hidden p-2 text-verdoso hover:text-bosque hover:bg-crema rounded-xl transition-colors cursor-pointer"
          :aria-expanded="isMobileMenuOpen"
          aria-label="Abrir menú de navegación"
        >
          <Menu v-if="!isMobileMenuOpen" class="w-6 h-6" />
          <X v-else class="w-6 h-6" />
        </button>
      </div>
    </div>

    <!-- Menú Desplegable Móvil (Transición suave para pantallas táctiles) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden border-t border-borde bg-white px-4 pt-3 pb-4 space-y-1.5 shadow-md"
      >
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          @click="isMobileMenuOpen = false"
          :class="[
            'px-3.5 py-2.5 text-sm rounded-xl flex items-center gap-3 transition-colors',
            isActive(item)
              ? 'font-semibold text-bosque bg-bosque-50 border border-bosque/20'
              : 'font-medium text-verdoso-muted hover:text-verdoso hover:bg-crema'
          ]"
        >
          <component
            :is="item.icon"
            :class="['w-5 h-5', isActive(item) ? 'text-bosque' : 'text-salvia']"
          />
          <span>{{ item.name }}</span>
        </router-link>

        <!-- Usuario en versión móvil -->
        <div class="sm:hidden pt-2 mt-2 border-t border-borde flex items-center gap-2 px-3.5 text-xs text-verdoso-muted">
          <User class="w-4 h-4 text-salvia" />
          <span>Conectado como <strong class="text-verdoso">{{ authStore.user?.name || 'Administrador' }}</strong></span>
        </div>
      </div>
    </Transition>
  </header>
</template>


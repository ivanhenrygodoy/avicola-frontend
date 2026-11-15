<script setup>
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavegacionStore } from '@/stores/navegacion'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import { User, LogOut, Menu, X } from 'lucide-vue-next'

defineProps({
  subtitle: {
    type: String,
    default: 'Gestión Avícola',
  },
})

const router = useRouter()
const authStore = useAuthStore()
const navegacion = useNavegacionStore()

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <!--
    Barra superior fija de lado a lado: el botón hamburguesa y la identidad de la granja permanecen
    anclados en la esquina superior izquierda en cualquier viewport y estado del sidebar.
  -->
  <header class="bg-white border-b border-borde sticky top-0 z-30 w-full shadow-xs">
    <div class="w-full px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- Hamburguesa + identidad de la granja -->
      <div class="flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          @click="navegacion.alternar()"
          class="p-2 text-verdoso hover:text-bosque hover:bg-crema rounded-xl transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-salvia"
          :aria-expanded="navegacion.abierto"
          :aria-label="navegacion.abierto ? 'Ocultar menú de navegación' : 'Mostrar menú de navegación'"
          :title="navegacion.abierto ? 'Ocultar menú' : 'Mostrar menú'"
        >
          <X v-if="navegacion.abierto" class="w-6 h-6 lg:hidden" />
          <Menu v-if="navegacion.abierto" class="w-6 h-6 hidden lg:block" />
          <Menu v-else class="w-6 h-6" />
        </button>

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
      </div>

      <!-- Acciones de usuario -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Badge de usuario: con nombre desde xl; entre lg y xl solo el icono (el nombre va en title) -->
        <div
          class="hidden lg:flex items-center gap-2 text-sm text-verdoso bg-crema px-3.5 py-1.5 rounded-full border border-borde"
          :title="authStore.user?.name || 'Administrador'"
          :aria-label="`Usuario: ${authStore.user?.name || 'Administrador'}`"
        >
          <User class="w-4 h-4 text-salvia" />
          <span class="font-medium hidden xl:inline">{{ authStore.user?.name || 'Administrador' }}</span>
        </div>

        <button
          @click="handleLogout"
          class="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-full border border-red-200 transition-colors cursor-pointer"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden sm:inline">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  </header>
</template>

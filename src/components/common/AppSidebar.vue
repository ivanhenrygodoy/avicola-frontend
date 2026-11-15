<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNavegacionStore } from '@/stores/navegacion'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import {
  LayoutDashboard,
  Home,
  Layers,
  Egg,
  DollarSign,
  Bot,
  Activity,
  Users,
  ShieldCheck,
  Palette,
  ChevronDown,
  Circle,
} from 'lucide-vue-next'

const route = useRoute()
const authStore = useAuthStore()
const navegacion = useNavegacionStore()

// Los nombres de icono llegan del servidor (módulos sembrados); si llega uno desconocido, un círculo
const ICONOS = { LayoutDashboard, Home, Layers, Egg, DollarSign, Bot, Activity, Users, ShieldCheck, Palette }
const iconoDe = (nombre) => ICONOS[nombre] || Circle

const modulos = computed(() => authStore.modulos)

const esActivo = (nodo) => {
  if (!nodo.ruta) return false
  return nodo.exacto ? route.path === nodo.ruta : route.path.startsWith(nodo.ruta)
}

const grupoTieneActivo = (nodo) => (nodo.hijos || []).some(esActivo)

// Grupos expandidos a mano; un grupo con una ruta hija activa se muestra siempre expandido
const abiertos = ref({})
const estaExpandido = (nodo) => grupoTieneActivo(nodo) || !!abiertos.value[nodo.clave]
const alternarGrupo = (nodo) => {
  abiertos.value = { ...abiertos.value, [nodo.clave]: !estaExpandido(nodo) }
}

// En móvil el panel se cierra al navegar o al presionar Escape
watch(() => route.path, () => navegacion.cerrarSiEsMovil())

const alPresionarEscape = (e) => {
  if (e.key === 'Escape' && navegacion.abierto) {
    navegacion.cerrarSiEsMovil()
  }
}

onMounted(() => window.addEventListener('keydown', alPresionarEscape))
onUnmounted(() => window.removeEventListener('keydown', alPresionarEscape))

const claseItem = (activo) => [
  'w-full px-3.5 py-2 text-sm rounded-xl flex items-center gap-2.5 transition-all text-left',
  activo
    ? 'font-semibold text-bosque bg-bosque-50 border border-bosque/20 shadow-2xs'
    : 'font-medium text-verdoso-muted hover:text-verdoso hover:bg-crema/70 border border-transparent',
]
</script>

<template>
  <!-- Fondo del panel móvil: debajo del header (top-16), por debajo del chat (z-40) y de los modales (z-[9999]) -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-150"
    leave-to-class="opacity-0"
  >
    <div
      v-if="navegacion.abierto"
      class="lg:hidden fixed inset-x-0 bottom-0 top-16 z-[34] bg-verdoso/40"
      aria-hidden="true"
      @click="navegacion.cerrar()"
    />
  </Transition>

  <aside
    :inert="!navegacion.abierto"
    :aria-hidden="!navegacion.abierto"
    :class="[
      'fixed left-0 top-16 bottom-0 z-[35] w-64 bg-white border-r border-borde overflow-hidden',
      'transition-[width,transform] duration-250 ease-out motion-reduce:transition-none',
      'lg:sticky lg:z-20 lg:self-start lg:h-[calc(100vh-4rem)] lg:translate-x-0 lg:shrink-0',
      navegacion.abierto
        ? 'translate-x-0 lg:w-64'
        : '-translate-x-full lg:w-0 lg:border-r-0',
    ]"
  >
    <!-- Ancho fijo: al colapsar en escritorio el contenido se recorta, no se aplasta -->
    <nav class="relative w-64 h-full px-3 py-4 overflow-y-auto overflow-x-hidden" aria-label="Navegación principal">
      <!-- Marca de agua: la gallina de la granja, apenas visible y sin capturar clics -->
      <GallinaIcon
        class="pointer-events-none absolute -bottom-6 -right-8 w-52 h-auto text-bosque/5"
        aria-hidden="true"
      />

      <ul class="relative space-y-1.5">
        <li v-for="nodo in modulos" :key="nodo.clave">
          <!-- Grupo expandible (p. ej. «Asistente IA» con «Benchmark» dentro) -->
          <template v-if="nodo.hijos && nodo.hijos.length">
            <button
              type="button"
              :class="[...claseItem(false), 'cursor-pointer', grupoTieneActivo(nodo) && 'text-bosque font-semibold']"
              :aria-expanded="estaExpandido(nodo)"
              @click="alternarGrupo(nodo)"
            >
              <component :is="iconoDe(nodo.icono)" class="w-4 h-4 text-salvia" />
              <span class="flex-1">{{ nodo.nombre }}</span>
              <ChevronDown
                :class="['w-4 h-4 text-salvia transition-transform', estaExpandido(nodo) ? 'rotate-180' : '']"
              />
            </button>

            <ul v-show="estaExpandido(nodo)" class="mt-1 ml-4 pl-2 border-l border-borde space-y-1">
              <li v-for="hijo in nodo.hijos" :key="hijo.clave">
                <router-link :to="hijo.ruta" :class="claseItem(esActivo(hijo))">
                  <component
                    :is="iconoDe(hijo.icono)"
                    :class="['w-4 h-4', esActivo(hijo) ? 'text-bosque' : 'text-salvia']"
                  />
                  <span>{{ hijo.nombre }}</span>
                </router-link>
              </li>
            </ul>
          </template>

          <!-- Ítem simple -->
          <router-link v-else-if="nodo.ruta" :to="nodo.ruta" :class="claseItem(esActivo(nodo))">
            <component
              :is="iconoDe(nodo.icono)"
              :class="['w-4 h-4', esActivo(nodo) ? 'text-bosque' : 'text-salvia']"
            />
            <span>{{ nodo.nombre }}</span>
          </router-link>
        </li>
      </ul>
    </nav>
  </aside>
</template>

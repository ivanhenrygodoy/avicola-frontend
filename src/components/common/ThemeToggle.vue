<script setup>
import { computed } from 'vue'
import { Sun, Moon } from 'lucide-vue-next'
import { useTemaStore } from '@/stores/tema'
import { useAuthStore } from '@/stores/auth'

const temaStore = useTemaStore()
const authStore = useAuthStore()

const esNocturno = computed(() => temaStore.esNocturno)

const alternar = () => {
  temaStore.alternarModoNocturno(authStore.isAuthenticated)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="esNocturno"
    :aria-label="esNocturno ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'"
    :title="esNocturno ? 'Modo nocturno activo (clic para modo claro)' : 'Modo claro activo (clic para modo nocturno)'"
    @click="alternar"
    :class="[
      'relative inline-flex items-center h-9 rounded-full border p-1 cursor-pointer select-none',
      'transition-colors duration-500 ease-in-out motion-reduce:transition-none',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-salvia',
      esNocturno
        ? 'w-32 bg-[#0F1713] border-salvia/50 text-[#E8EFEA] shadow-xs'
        : 'w-32 bg-crema border-borde text-verdoso shadow-2xs hover:border-salvia/60',
    ]"
  >
    <!-- Micro-destellos orgánicos en modo nocturno -->
    <span
      v-if="esNocturno"
      class="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
      aria-hidden="true"
    >
      <span class="absolute top-2 left-4 w-1 h-1 rounded-full bg-salvia/70" />
      <span class="absolute bottom-2 left-8 w-0.5 h-0.5 rounded-full bg-huevo/80" />
      <span class="absolute top-3 left-14 w-0.5 h-0.5 rounded-full bg-salvia/50" />
    </span>

    <!-- Etiqueta contextual -->
    <span
      :class="[
        'text-[11px] font-bold tracking-tight transition-all duration-250 motion-reduce:transition-none whitespace-nowrap',
        esNocturno ? 'pl-2.5 pr-8 text-left w-full' : 'pl-8 pr-2 text-right w-full',
      ]"
    >
      {{ esNocturno ? 'Nocturno' : 'Modo Día' }}
    </span>

    <!-- Knob circular deslizante -->
    <span
      :class="[
        'absolute top-1 w-7 h-7 rounded-full flex items-center justify-center shadow-xs border',
        'transition-transform duration-500 ease-in-out motion-reduce:transition-none',
        esNocturno
          ? 'translate-x-[90px] bg-[#1D2B24] border-salvia/50 text-huevo'
          : 'translate-x-0 bg-white border-borde text-bosque',
      ]"
    >
      <Moon v-if="esNocturno" class="w-3.5 h-3.5" />
      <Sun v-else class="w-3.5 h-3.5 text-huevo" />
    </span>
  </button>
</template>


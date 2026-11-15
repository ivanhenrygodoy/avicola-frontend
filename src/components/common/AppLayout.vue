<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import AppHeader from '@/components/common/AppHeader.vue'
import AppSidebar from '@/components/common/AppSidebar.vue'
import PrimerIngresoModal from '@/components/common/PrimerIngresoModal.vue'
import { useNavegacionStore } from '@/stores/navegacion'

const route = useRoute()
const navegacion = useNavegacionStore()
const subtitle = computed(() => route.meta.subtitle || 'Gestión Avícola')

let mediaQuery = null
const alCambiarBreakpoint = (e) => navegacion.sincronizarModo(e.matches)

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQuery = window.matchMedia('(min-width: 1024px)')
    mediaQuery.addEventListener('change', alCambiarBreakpoint)
  }
})

onUnmounted(() => {
  mediaQuery?.removeEventListener('change', alCambiarBreakpoint)
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <AppHeader :subtitle="subtitle" />

    <div class="flex flex-1 min-h-0">
      <AppSidebar />

      <!-- Div y no <main>: cada vista ya declara su propio <main> -->
      <div class="flex-1 min-w-0 flex flex-col">
        <RouterView />
      </div>
    </div>

    <!-- Aviso de primer ingreso: solo aparece si el usuario entró con una contraseña temporal -->
    <PrimerIngresoModal />
  </div>
</template>

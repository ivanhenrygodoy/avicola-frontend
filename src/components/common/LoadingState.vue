<script setup>
import GallinaIcon from '@/components/common/GallinaIcon.vue'

/**
 * Indicador de carga corporativo en línea (anillo bicromático bosque/salvia con
 * el imagotipo de la gallina). Mismo marcado que el bloque "Consultando
 * registros..." de las vistas de listado; los textos por defecto son los de ese
 * bloque, así que puede sustituirlo 1:1. Para operaciones de mutación a pantalla
 * completa se sigue usando `ActionLoader`.
 */
defineProps({
  message: { type: String, default: 'Consultando registros...' },
  submessage: {
    type: String,
    default: 'Por favor, espere un momento mientras se actualiza el listado.',
  },
})
</script>

<template>
  <div class="p-12 text-center flex flex-col items-center justify-center" role="status" aria-live="polite">
    <div class="relative w-14 h-14 flex items-center justify-center mb-3">
      <div class="absolute inset-0 rounded-full border-4 border-borde border-t-[#244B36] border-r-[#6F9678] animate-spin"></div>
      <GallinaIcon class="w-7 h-7 text-bosque animate-pulse select-none" aria-hidden="true" />
    </div>
    <p class="text-sm font-bold text-verdoso">{{ message }}</p>
    <p class="text-xs text-verdoso-muted mt-1">{{ submessage }}</p>
  </div>
</template>

<script setup>
import GallinaCaminando from '@/components/asistente/GallinaCaminando.vue'

/**
 * Indicador de «pensando» del chat: la gallinita animada caminando dentro de su badge,
 * el texto de estado y tres puntos que se encienden y suben en secuencia (keyframe `pensando`).
 * Componente 100% modular con animaciones CSS puras, sin dependencias externas.
 *
 * `texto` es el mensaje sin los puntos suspensivos finales. Con «reducir movimiento» activado
 * nada se anima y se muestra un «…» fijo accesible.
 * Es un `role="status"`: el lector de pantalla lo anuncia una vez; los elementos animados son decorativos.
 */
defineProps({
  texto: {
    type: String,
    default: 'AviaCore está pensando',
  },
})
</script>

<template>
  <div
    class="flex items-center gap-2.5 py-1.5 pl-1.5 pr-4 rounded-full bg-bosque-50 border border-salvia/40 w-fit shadow-2xs"
    role="status"
    aria-live="polite"
  >
    <div
      class="w-8 h-8 rounded-full bg-white border border-salvia/40 flex items-center justify-center shrink-0 overflow-hidden relative"
    >
      <GallinaCaminando class="w-5 h-5 text-bosque gallina-nocturna-blanca" />
    </div>

    <span class="text-xs font-medium text-verdoso tracking-tight select-none">
      <span>{{ texto }}</span>
      <!-- Movimiento normal: tres puntos que se encienden y suben uno tras otro -->
      <span class="ml-px inline-flex items-end gap-0.5 pb-0.5 motion-reduce:hidden" aria-hidden="true">
        <span class="w-1.5 h-1.5 rounded-full bg-salvia animate-pensando [animation-fill-mode:backwards] [animation-delay:0ms]" />
        <span class="w-1.5 h-1.5 rounded-full bg-salvia animate-pensando [animation-fill-mode:backwards] [animation-delay:150ms]" />
        <span class="w-1.5 h-1.5 rounded-full bg-salvia animate-pensando [animation-fill-mode:backwards] [animation-delay:300ms]" />
      </span>
      <!-- Movimiento reducido: puntos suspensivos fijos -->
      <span class="hidden motion-reduce:inline" aria-hidden="true">…</span>
    </span>
  </div>
</template>

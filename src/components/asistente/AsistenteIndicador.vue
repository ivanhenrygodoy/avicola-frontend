<script setup>
import GallinaIcon from '@/components/common/GallinaIcon.vue'

/**
 * Indicador de «pensando» del chat: el logo del proyecto con un pulso suave, el texto y tres puntos que se
 * encienden y suben en secuencia (keyframe `pensando` de tailwind.config.js). Todo es CSS: sin dependencias.
 *
 * `texto` es el mensaje sin los puntos suspensivos finales. Con «reducir movimiento» activado nada se
 * anima: los puntos animados se ocultan y se muestra un «…» fijo, así nunca se ven ambos.
 * Es un `role="status"`: el lector de pantalla lo anuncia una vez; los puntos son decorativos (aria-hidden).
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
      class="w-8 h-8 rounded-full bg-white border border-salvia/40 flex items-center justify-center shrink-0 animate-pulse motion-reduce:animate-none"
    >
      <GallinaIcon class="w-5 h-5 text-bosque" />
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

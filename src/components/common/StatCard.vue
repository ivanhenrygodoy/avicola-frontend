<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  valueColorClass: {
    type: String,
    default: 'text-verdoso',
  },
  // Línea de contexto opcional bajo la cifra (por ejemplo "Entrada 64,3 mil · Salida 2,0 mil")
  subtitle: {
    type: String,
    default: '',
  },
  // Texto emergente opcional sobre la tarjeta (por ejemplo la cifra exacta cuando se muestra abreviada)
  hint: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-borde shadow-xs" :title="hint || undefined">
    <span class="text-xs font-semibold text-verdoso-muted uppercase tracking-wider block">{{ title }}</span>
    <p :class="['text-3xl font-extrabold mt-1 tracking-tight', valueColorClass]">
      {{ value }}
    </p>
    <p v-if="subtitle" class="text-xs text-verdoso-muted mt-1 leading-snug">{{ subtitle }}</p>
  </div>
</template>

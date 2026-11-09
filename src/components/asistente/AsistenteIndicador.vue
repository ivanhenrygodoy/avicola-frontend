<script setup>
defineProps({
  texto: {
    type: String,
    default: 'Consultando datos de la granja...',
  },
})
</script>

<template>
  <div class="flex items-center gap-2.5 py-1.5 px-3 rounded-full bg-bosque-50 border border-salvia/40 text-xs text-verdoso w-fit shadow-2xs">
    <div class="w-3.5 h-3.5 rounded-full border-2 border-salvia border-t-bosque animate-spin shrink-0" />
    <span class="font-medium tracking-tight select-none">{{ texto }}</span>
  </div>
</template>


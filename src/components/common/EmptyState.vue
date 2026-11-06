<script setup>
import { SearchX } from 'lucide-vue-next'

/**
 * Estado vacío corporativo: círculo con icono, título, descripción y, si se
 * indica `actionLabel`, un botón secundario (p. ej. "Limpiar filtros").
 * Es solo el contenido: en una tabla se coloca dentro de un <td colspan>.
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  actionLabel: { type: String, default: '' },
  // Componente de Lucide. El default va en fábrica: Vue llama a cualquier default que sea
  // función, y un componente funcional como SearchX fallaría al invocarse sin contexto.
  icon: { type: [Object, Function], default: () => SearchX },
})

defineEmits(['action'])
</script>

<template>
  <div class="max-w-xs mx-auto flex flex-col items-center gap-3">
    <div class="w-12 h-12 rounded-full bg-salvia-50 flex items-center justify-center text-salvia border border-borde">
      <component :is="icon" class="w-6 h-6" aria-hidden="true" />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-bold text-verdoso">{{ title }}</p>
      <p v-if="description" class="text-xs text-verdoso-muted">{{ description }}</p>
    </div>
    <button
      v-if="actionLabel"
      type="button"
      class="mt-1 px-4 py-1.5 text-xs font-semibold text-bosque bg-salvia-50 hover:bg-salvia-100 rounded-full border border-salvia/40 transition-colors cursor-pointer"
      @click="$emit('action')"
    >
      {{ actionLabel }}
    </button>
  </div>
</template>

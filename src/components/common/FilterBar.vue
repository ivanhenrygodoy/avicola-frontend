<script setup>
defineProps({
  loading: {
    type: Boolean,
    default: false,
  },
  showClear: {
    type: Boolean,
    default: true,
  },
  searchLabel: {
    type: String,
    default: 'Buscar',
  },
  clearLabel: {
    type: String,
    default: 'Limpiar',
  },
})

defineEmits(['search', 'clear'])
</script>

<template>
  <div class="bg-white rounded-2xl border border-borde p-4 sm:p-5 shadow-xs">
    <div class="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
      <!-- Filtros dinámicos -->
      <div class="flex-1">
        <slot />
      </div>

      <!-- Botones de Acción del Filtro y Acción Principal -->
      <div class="flex items-center gap-2 justify-end self-end xl:self-center shrink-0 pt-2 xl:pt-0">
        <button
          type="button"
          @click="$emit('search')"
          :disabled="loading"
          class="px-5 py-2.5 btn-principal text-sm shadow-xs cursor-pointer"
        >
          {{ searchLabel }}
        </button>
        <button
          v-if="showClear"
          type="button"
          @click="$emit('clear')"
          :disabled="loading"
          class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
        >
          {{ clearLabel }}
        </button>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>


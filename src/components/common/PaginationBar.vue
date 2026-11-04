<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  lastPage: {
    type: Number,
    required: true,
  },
  perPage: {
    type: Number,
    default: 5,
  },
  total: {
    type: Number,
    default: 0,
  },
  perPageOptions: {
    type: Array,
    default: () => [5, 10, 20],
  },
  itemLabel: {
    type: String,
    default: 'registros',
  },
})

const emit = defineEmits(['update:page', 'update:perPage'])

const pages = computed(() => {
  const current = props.currentPage
  const total = props.lastPage
  const items = []

  for (let i = 1; i <= total; i++) {
    items.push(i)
  }
  return items
})

const onPageClick = (page) => {
  if (page >= 1 && page <= props.lastPage && page !== props.currentPage) {
    emit('update:page', page)
  }
}

const onPerPageChange = (event) => {
  emit('update:perPage', Number(event.target.value))
}
</script>

<template>
  <div class="p-4 bg-white border-t border-borde flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-verdoso-muted">
    <!-- Selector de registros por página -->
    <div class="flex items-center gap-2">
      <span>Mostrar</span>
      <select
        :value="perPage"
        @change="onPerPageChange"
        class="px-2.5 py-1 bg-white border border-borde rounded-lg text-xs font-semibold text-verdoso focus:outline-none focus:ring-1 focus:ring-bosque cursor-pointer"
      >
        <option v-for="opt in perPageOptions" :key="opt" :value="opt">
          {{ opt }}
        </option>
      </select>
      <span>{{ itemLabel }} por página</span>
      <span class="text-salvia ml-2 font-medium">
        (Total: {{ total }} {{ itemLabel }})
      </span>
    </div>

    <!-- Controles de Navegación de Páginas -->
    <div class="flex items-center gap-1.5">
      <!-- Botón Anterior -->
      <button
        type="button"
        @click="onPageClick(currentPage - 1)"
        :disabled="currentPage <= 1"
        class="p-1.5 rounded-lg border border-borde hover:bg-crema disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        title="Página anterior"
      >
        <ChevronLeft class="w-4 h-4 text-verdoso" />
      </button>

      <!-- Botones numéricos de página -->
      <button
        v-for="page in pages"
        :key="page"
        type="button"
        @click="onPageClick(page)"
        :class="[
          'w-7 h-7 rounded-full text-xs font-semibold transition-all cursor-pointer',
          page === currentPage
            ? 'btn-principal'
            : 'text-verdoso hover:bg-crema'
        ]"
      >
        {{ page }}
      </button>

      <!-- Botón Siguiente -->
      <button
        type="button"
        @click="onPageClick(currentPage + 1)"
        :disabled="currentPage >= lastPage"
        class="p-1.5 rounded-lg border border-borde hover:bg-crema disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
        title="Página siguiente"
      >
        <ChevronRight class="w-4 h-4 text-verdoso" />
      </button>
    </div>
  </div>
</template>


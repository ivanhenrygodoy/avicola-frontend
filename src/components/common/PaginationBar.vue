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

// Hasta MAX_VISIBLES páginas se muestran todas; con más, se recorta con puntos suspensivos
// ("…") manteniendo siempre la primera, la última y las vecinas de la página actual.
const MAX_VISIBLES = 7

const pages = computed(() => {
  const current = props.currentPage
  const total = props.lastPage

  if (total <= MAX_VISIBLES) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const items = [1]
  const desde = Math.max(2, current - 1)
  const hasta = Math.min(total - 1, current + 1)

  if (desde > 2) items.push('…')
  for (let i = desde; i <= hasta; i++) items.push(i)
  if (hasta < total - 1) items.push('…')

  items.push(total)
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

      <!-- Botones numéricos de página (los puntos suspensivos no son clicables) -->
      <template v-for="(page, i) in pages" :key="`${page}-${i}`">
        <span
          v-if="page === '…'"
          class="w-7 h-7 flex items-center justify-center text-xs text-verdoso-muted select-none"
          aria-hidden="true"
        >…</span>
        <button
          v-else
          type="button"
          @click="onPageClick(page)"
          :aria-current="page === currentPage ? 'page' : undefined"
          :aria-label="`Página ${page}`"
          :class="[
            'w-7 h-7 rounded-full text-xs font-semibold transition-all cursor-pointer',
            page === currentPage
              ? 'btn-principal'
              : 'text-verdoso hover:bg-crema'
          ]"
        >
          {{ page }}
        </button>
      </template>

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


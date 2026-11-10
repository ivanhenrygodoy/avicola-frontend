<script setup>
import { computed } from 'vue'
import SectionCard from '@/components/common/SectionCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'

/**
 * Tarjeta con una lista de barras (ranking). Se usa para "Resultado de las interacciones",
 * "Guards más activados" y "Herramientas más usadas".
 *
 * items:     [{ key, label, total }]
 * clickable: cada fila es un botón que emite `select(key)` (por ejemplo, para filtrar el listado de logs)
 * porcentaje: muestra además el % sobre la suma de totales
 */
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  items: { type: Array, default: () => [] },
  colorClass: { type: String, default: 'bg-bosque' },
  clickable: { type: Boolean, default: false },
  porcentaje: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Aún no hay datos en este periodo.' },
})

defineEmits(['select'])

const maximo = computed(() => Math.max(0, ...props.items.map((i) => i.total)))
const suma = computed(() => props.items.reduce((acc, i) => acc + i.total, 0))
const pct = (total) => (suma.value > 0 ? Math.round((total / suma.value) * 100) : 0)
const hayDatos = computed(() => suma.value > 0)
</script>

<template>
  <SectionCard :title="title" :subtitle="subtitle">
    <p v-if="!hayDatos" class="text-sm text-verdoso-muted">{{ emptyText }}</p>

    <ul v-else class="space-y-3">
      <li v-for="item in items" :key="item.key">
        <component
          :is="clickable ? 'button' : 'div'"
          :type="clickable ? 'button' : undefined"
          :title="clickable ? `Ver los logs de ${item.label}` : undefined"
          :class="[
            'w-full text-left',
            clickable ? 'cursor-pointer rounded-lg -mx-1 px-1 py-0.5 hover:bg-bosque-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-salvia' : '',
          ]"
          @click="clickable && $emit('select', item.key)"
        >
          <span class="flex items-center justify-between text-sm mb-1.5 gap-3">
            <span class="font-medium text-verdoso break-all">{{ item.label }}</span>
            <span class="font-bold text-verdoso shrink-0">
              {{ item.total }}<span v-if="porcentaje" class="text-xs font-semibold text-verdoso-muted"> · {{ pct(item.total) }}%</span>
            </span>
          </span>
          <ProgressBar
            :value="item.total"
            :max="porcentaje ? suma : maximo"
            :color-class="colorClass"
            :label="`${item.label}: ${item.total}`"
          />
        </component>
      </li>
    </ul>
  </SectionCard>
</template>

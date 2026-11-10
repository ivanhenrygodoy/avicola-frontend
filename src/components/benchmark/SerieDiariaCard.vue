<script setup>
import { computed } from 'vue'
import SectionCard from '@/components/common/SectionCard.vue'
import LineChart from '@/components/common/LineChart.vue'
import LoadingState from '@/components/common/LoadingState.vue'

/**
 * Tarjeta con un gráfico de líneas por día (SectionCard + LineChart).
 * Se usa para "Interacciones por día" y "Tokens por día".
 *
 * labels: etiquetas del eje X ('d/m')   series: [{ name, color, values }]
 */
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  labels: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  ariaLabel: { type: String, required: true },
  labelEvery: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
  emptyText: { type: String, default: 'Sin interacciones registradas en este periodo.' },
})

const hayDatos = computed(() => props.series.some((s) => s.values.some((v) => v > 0)))
</script>

<template>
  <SectionCard :title="title" :subtitle="subtitle">
    <LoadingState v-if="loading" message="Consultando estadísticas..." submessage="" />

    <p v-else-if="!hayDatos" class="text-sm text-verdoso-muted">{{ emptyText }}</p>

    <div v-else class="border-t border-borde pt-4">
      <LineChart :labels="labels" :series="series" :label-every="labelEvery" :aria-label="ariaLabel" />
    </div>
  </SectionCard>
</template>

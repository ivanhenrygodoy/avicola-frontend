<script setup>
import { computed } from 'vue'
import StatCard from '@/components/common/StatCard.vue'
import { formatMoney } from '@/utils/format'

const props = defineProps({
  resumen: { type: Object, required: true },
})

const kpis = computed(() => [
  { title: 'Población de aves', value: props.resumen.aves.total, color: 'text-bosque' },
  { title: 'Huevos sanos hoy', value: props.resumen.huevos.hoy.aprovechables, color: 'text-bosque' },
  { title: 'Alimento del mes', value: `${props.resumen.alimentacion.kilos_mes} kg`, color: 'text-verdoso' },
  { title: 'Gastos del mes', value: formatMoney(props.resumen.gastos.total_mes), color: 'text-amber-800' },
])
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      v-for="kpi in kpis"
      :key="kpi.title"
      :title="kpi.title"
      :value="kpi.value"
      :value-color-class="kpi.color"
    />
  </div>
</template>

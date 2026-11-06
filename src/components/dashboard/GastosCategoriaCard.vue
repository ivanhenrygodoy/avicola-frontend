<script setup>
import { computed } from 'vue'
import SectionCard from '@/components/common/SectionCard.vue'
import ProgressBar from '@/components/common/ProgressBar.vue'
import { formatMoney } from '@/utils/format'

const props = defineProps({
  gastos: { type: Object, required: true },
})

const maximo = computed(() => Math.max(0, ...props.gastos.por_categoria.map((c) => c.total)))
</script>

<template>
  <SectionCard title="Gastos por categoría" :subtitle="`Total del mes: ${formatMoney(gastos.total_mes)}`">
    <p v-if="gastos.por_categoria.length === 0" class="text-sm text-verdoso-muted">
      No hay gastos registrados este mes.
    </p>

    <ul v-else class="space-y-3">
      <li v-for="c in gastos.por_categoria" :key="c.categoria">
        <div class="flex items-center justify-between text-sm mb-1.5">
          <span class="font-medium text-verdoso">{{ c.categoria }}</span>
          <span class="font-bold text-verdoso">{{ formatMoney(c.total) }}</span>
        </div>
        <ProgressBar
          :value="c.total"
          :max="maximo"
          color-class="bg-tierra"
          :label="`${c.categoria}: ${formatMoney(c.total)}`"
        />
      </li>
    </ul>
  </SectionCard>
</template>

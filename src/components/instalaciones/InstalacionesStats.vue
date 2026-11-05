<script setup>
import StatCard from '@/components/common/StatCard.vue'

defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total_casitas: 0,
      total_divisiones: 0,
      divisiones_activas: 0,
    }),
  },
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <StatCard
      title="Total Casitas"
      :value="stats.total_casitas || 0"
    />

    <StatCard
      title="Total Divisiones / Corrales"
      :value="stats.total_divisiones || 0"
    />

    <StatCard
      title="Divisiones Habilitadas"
      :value="stats.divisiones_activas || 0"
      value-color-class="text-bosque"
    />
  </div>
</template>


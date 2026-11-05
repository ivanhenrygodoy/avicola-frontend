<script setup>
import StatCard from '@/components/common/StatCard.vue'

defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      total_aves: 0,
      gallinas_count: 0,
      chompipes_count: 0,
      patos_count: 0,
    }),
  },
})
</script>

<template>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    <StatCard
      title="Total Población"
      :value="stats.total_aves || 0"
    />

    <StatCard
      title="Gallinas Criollas"
      :value="stats.gallinas_count || 0"
    />

    <StatCard
      title="Chompipes (Pavos)"
      :value="stats.chompipes_count || 0"
    />

    <StatCard
      title="Patos Pichiches"
      :value="stats.patos_count || 0"
    />
  </div>
</template>


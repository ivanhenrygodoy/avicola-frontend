<script setup>
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
  colorClass: { type: String, default: 'bg-bosque' },
  label: { type: String, required: true },
})

// max = 0 (sin datos) se muestra como 0 %, nunca como NaN
const porcentaje = computed(() => {
  if (!props.max || props.max <= 0) return 0
  return Math.min(100, Math.max(0, (props.value / props.max) * 100))
})
</script>

<template>
  <div
    class="h-2 w-full rounded-full bg-bosque-100 overflow-hidden"
    role="progressbar"
    :aria-label="label"
    :aria-valuenow="value"
    aria-valuemin="0"
    :aria-valuemax="max"
  >
    <div
      :class="['h-full rounded-full transition-all duration-300', colorClass]"
      :style="{ width: porcentaje + '%' }"
    />
  </div>
</template>

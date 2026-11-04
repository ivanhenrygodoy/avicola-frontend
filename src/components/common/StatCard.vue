<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [String, Number],
    required: true,
  },
  valueColorClass: {
    type: String,
    default: 'text-verdoso',
  },
})
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-borde shadow-xs">
    <span class="text-xs font-semibold text-verdoso-muted uppercase tracking-wider block">{{ title }}</span>
    <p :class="['text-3xl font-extrabold mt-1 tracking-tight', valueColorClass]">
      {{ value }}
    </p>
  </div>
</template>

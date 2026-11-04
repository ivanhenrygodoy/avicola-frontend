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
  icon: {
    type: [Object, Function],
    required: true,
  },
  iconBgClass: {
    type: String,
    default: 'bg-crema',
  },
  iconColorClass: {
    type: String,
    default: 'text-salvia',
  },
  valueColorClass: {
    type: String,
    default: 'text-verdoso',
  },
})
</script>

<template>
  <div class="bg-white p-5 rounded-2xl border border-borde shadow-xs flex items-center justify-between">
    <div>
      <span class="text-xs font-semibold text-verdoso-muted uppercase tracking-wider">{{ title }}</span>
      <p :class="['text-2xl font-extrabold mt-1', valueColorClass]">
        {{ value }}
      </p>
    </div>
    <div :class="['w-12 h-12 rounded-xl flex items-center justify-center', iconBgClass]">
      <component :is="icon" :class="['w-6 h-6', iconColorClass]" />
    </div>
  </div>
</template>


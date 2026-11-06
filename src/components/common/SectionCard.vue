<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
})
</script>

<template>
  <section class="bg-white p-5 rounded-2xl border border-borde shadow-xs flex flex-col gap-4">
    <header class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-bold text-verdoso tracking-tight">{{ title }}</h3>
        <p v-if="subtitle" class="text-xs text-verdoso-muted mt-0.5">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </header>
    <slot />
  </section>
</template>

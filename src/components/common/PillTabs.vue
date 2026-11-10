<script setup>
/**
 * Interruptor de pestañas tipo píldora (el de "Recolección de Huevos / Raciones de Alimento").
 * Fuente única del marcado: contenedor blanco con borde y píldora activa en `bosque`.
 *
 * modelValue: `value` de la pestaña activa (v-model)
 * tabs:       [{ value, label, icon? }]  (icon = componente de Lucide)
 */
defineProps({
  modelValue: { type: String, required: true },
  tabs: { type: Array, required: true },
  ariaLabel: { type: String, default: 'Secciones' },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="inline-flex p-1 bg-white border border-borde rounded-full shadow-2xs" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      role="tab"
      :aria-selected="modelValue === tab.value"
      :class="[
        'px-5 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer flex items-center gap-2',
        modelValue === tab.value
          ? 'bg-bosque text-white shadow-xs'
          : 'text-verdoso-muted hover:text-verdoso'
      ]"
      @click="$emit('update:modelValue', tab.value)"
    >
      <component :is="tab.icon" v-if="tab.icon" class="w-4 h-4" aria-hidden="true" />
      <span>{{ tab.label }}</span>
    </button>
  </div>
</template>

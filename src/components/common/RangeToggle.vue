<script setup>
/**
 * Selector compacto de rango (7 / 30 días) con píldoras pequeñas. Fuente única del marcado
 * que antes estaba copiado en las tarjetas del dashboard.
 *
 * modelValue: opción activa (v-model)
 * options:    opciones numéricas (por defecto 7 y 30)
 * unitLabel:  unidad que acompaña a cada opción ("días")
 */
defineProps({
  modelValue: { type: Number, required: true },
  options: { type: Array, default: () => [7, 30] },
  unitLabel: { type: String, default: 'días' },
  ariaLabel: { type: String, default: 'Rango de días' },
  loading: { type: Boolean, default: false },
  size: { type: String, default: 'sm', validator: (v) => ['sm', 'md'].includes(v) },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div
    :class="[
      'inline-flex rounded-full border border-borde bg-crema',
      size === 'md' ? 'p-1' : 'p-0.5',
    ]"
    role="group"
    :aria-label="ariaLabel"
  >
    <button
      v-for="opcion in options"
      :key="opcion"
      type="button"
      :disabled="loading"
      :aria-pressed="modelValue === opcion"
      :class="[
        'rounded-full font-semibold transition-colors cursor-pointer disabled:cursor-wait',
        size === 'md' ? 'px-4 py-2 text-sm' : 'px-3 py-1 text-xs',
        modelValue === opcion ? 'bg-bosque text-white' : 'text-verdoso-muted hover:text-bosque',
      ]"
      @click="$emit('update:modelValue', opcion)"
    >
      {{ opcion }} {{ unitLabel }}
    </button>
  </div>
</template>

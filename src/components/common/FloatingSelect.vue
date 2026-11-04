<script setup>
defineProps({
  modelValue: {
    type: [String, Number, Boolean],
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  options: {
    type: Array,
    required: true,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div class="relative pt-1">
    <!-- Floating notch label con corte blanco limpio sobre el borde -->
    <label
      class="absolute -top-1.5 left-4 z-10 px-1.5 bg-white text-xs font-semibold text-salvia pointer-events-none select-none inline-block leading-none"
    >
      {{ label }}
    </label>

    <div class="relative flex items-center">
      <select
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
        class="w-full px-3.5 py-2.5 rounded-xl border border-borde text-sm text-verdoso bg-white focus:outline-none focus:border-bosque focus:ring-1 focus:ring-bosque transition-all cursor-pointer disabled:bg-crema disabled:cursor-not-allowed appearance-none"
      >
        <option
          v-for="opt in options"
          :key="typeof opt === 'object' ? opt.value : opt"
          :value="typeof opt === 'object' ? opt.value : opt"
        >
          {{ typeof opt === 'object' ? opt.label : opt }}
        </option>
      </select>

      <!-- Chevron indicador nativo estilizado -->
      <div class="pointer-events-none absolute right-3 flex items-center text-salvia">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>
  </div>
</template>


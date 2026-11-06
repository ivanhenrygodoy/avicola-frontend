<script setup>
import { computed } from 'vue'

const props = defineProps({
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
  error: {
    type: String,
    default: '',
  },
  labelBgClass: {
    type: String,
    default: 'bg-white',
  },
})

defineEmits(['update:modelValue'])

// Filtra cualquier opción vacía para listar estrictamente los elementos válidos del endpoint
const cleanOptions = computed(() => {
  return (props.options || []).filter((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return opt.value !== '' && opt.label !== ''
    }
    return opt !== ''
  })
})
</script>

<template>
  <div class="relative pt-1 text-left w-full">
    <!-- Floating notch label con corte limpio sobre el borde -->
    <label
      :class="[
        'absolute -top-1.5 left-4 z-10 px-1.5 text-xs font-semibold pointer-events-none select-none inline-block leading-none transition-colors',
        labelBgClass,
        error ? 'text-red-600 font-bold' : 'text-salvia'
      ]"
    >
      {{ label }}
    </label>

    <div class="relative flex items-center">
      <select
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
        :class="[
          'w-full pl-3.5 pr-12 py-2.5 rounded-xl border text-sm text-verdoso bg-white focus:outline-none transition-all cursor-pointer disabled:bg-crema disabled:cursor-not-allowed appearance-none',
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-borde focus:border-bosque focus:ring-1 focus:ring-bosque'
        ]"
      >
        <!-- Opción invisible para que en estado inicial se muestre limpio sin figurar en el desplegable -->
        <option value="" disabled hidden></option>

        <option
          v-for="opt in cleanOptions"
          :key="typeof opt === 'object' ? opt.value : opt"
          :value="typeof opt === 'object' ? opt.value : opt"
        >
          {{ typeof opt === 'object' ? opt.label : opt }}
        </option>
      </select>

      <!-- Botón para quitar selección rápida si el usuario eligió una opción -->
      <button
        v-if="modelValue && !disabled"
        type="button"
        @click.stop="$emit('update:modelValue', '')"
        class="absolute right-8 flex items-center justify-center w-5 h-5 text-salvia hover:text-verdoso transition-colors cursor-pointer rounded-full hover:bg-crema"
        title="Quitar selección"
      >
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Chevron indicador nativo estilizado -->
      <div class="pointer-events-none absolute right-3 flex items-center text-salvia">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </div>
    </div>

    <!-- Error inline debajo del select -->
    <p v-if="error" class="text-xs text-red-600 mt-1 pl-1 font-medium">
      {{ error }}
    </p>
  </div>
</template>

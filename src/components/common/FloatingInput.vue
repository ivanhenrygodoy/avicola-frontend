<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  step: {
    type: [String, Number],
    default: undefined,
  },
  min: {
    type: [String, Number],
    default: undefined,
  },
  max: {
    type: [String, Number],
    default: undefined,
  },
  rows: {
    type: Number,
    default: 3,
  },
  icon: {
    type: [Object, Function],
    default: null,
  },
  labelBgClass: {
    type: String,
    default: 'bg-white',
  },
})

defineEmits(['update:modelValue', 'enter'])
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
      <!-- Textarea si type === 'textarea' -->
      <textarea
        v-if="type === 'textarea'"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :rows="rows"
        @input="$emit('update:modelValue', $event.target.value)"
        :class="[
          'w-full pl-3.5 pr-3.5 py-2.5 rounded-xl border text-sm text-verdoso placeholder:text-verdoso-muted/70 bg-white focus:outline-none transition-all disabled:bg-crema disabled:cursor-not-allowed resize-none',
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-borde focus:border-bosque focus:ring-1 focus:ring-bosque'
        ]"
      ></textarea>

      <!-- Input estándar -->
      <input
        v-else
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :step="step"
        :min="min"
        :max="max"
        @input="$emit('update:modelValue', $event.target.value)"
        @keyup.enter="$emit('enter')"
        :class="[
          'w-full pl-3.5 pr-9 py-2.5 rounded-xl border text-sm text-verdoso placeholder:text-verdoso-muted/70 bg-white focus:outline-none transition-all disabled:bg-crema disabled:cursor-not-allowed',
          error
            ? 'border-red-500 focus:border-red-600 focus:ring-1 focus:ring-red-500'
            : 'border-borde focus:border-bosque focus:ring-1 focus:ring-bosque'
        ]"
      />
      <component
        v-if="icon && type !== 'textarea'"
        :is="icon"
        class="w-4 h-4 text-salvia absolute right-3 pointer-events-none"
      />
    </div>

    <!-- Error inline debajo del input -->
    <p v-if="error" class="text-xs text-red-600 mt-1 pl-1 font-medium">
      {{ error }}
    </p>
  </div>
</template>

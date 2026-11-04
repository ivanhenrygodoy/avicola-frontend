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
  icon: {
    type: [Object, Function],
    default: null,
  },
})

defineEmits(['update:modelValue', 'enter'])
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
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value)"
        @keyup.enter="$emit('enter')"
        class="w-full pl-3.5 pr-9 py-2.5 rounded-xl border border-borde text-sm text-verdoso placeholder:text-verdoso-muted/70 bg-white focus:outline-none focus:border-bosque focus:ring-1 focus:ring-bosque transition-all disabled:bg-crema disabled:cursor-not-allowed"
      />
      <component
        v-if="icon"
        :is="icon"
        class="w-4 h-4 text-salvia absolute right-3 pointer-events-none"
      />
    </div>
  </div>
</template>


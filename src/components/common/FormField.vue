<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  id: {
    type: String,
    default: '',
  },
  type: {
    type: String,
    default: 'text', // text, email, password, number, textarea, select
  },
  placeholder: {
    type: String,
    default: '',
  },
  options: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Number,
    default: 3,
  },
  error: {
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
  // Solo para type="number" y "date": se pasan al <input> (undefined = no se renderiza el atributo)
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
})

defineEmits(['update:modelValue', 'blur', 'enter', 'input'])
</script>

<template>
  <div class="space-y-1 text-left">
    <!-- Etiqueta estándar sobre el campo (sin descriptor notch) -->
    <label
      v-if="label"
      :for="id"
      :class="[
        'block text-xs font-bold uppercase tracking-wider',
        error ? 'text-red-600' : 'text-verdoso'
      ]"
    >
      {{ label }}
      <span v-if="required" class="text-red-500 ml-0.5">*</span>
    </label>

    <div class="relative rounded-xl">
      <!-- Ícono prefijo (ej. en Login) -->
      <div
        v-if="$slots.prefix"
        class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-salvia"
      >
        <slot name="prefix" />
      </div>

      <!-- Acción o ícono sufijo (ej. mostrar/ocultar contraseña) -->
      <div
        v-if="$slots.suffix"
        class="absolute inset-y-0 right-0 pr-3 flex items-center text-salvia"
      >
        <slot name="suffix" />
      </div>

      <!-- Modo Textarea -->
      <textarea
        v-if="type === 'textarea'"
        :id="id"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value); $emit('input', $event)"
        @blur="$emit('blur', $event)"
        :class="[
          'block w-full px-3.5 py-2.5 rounded-xl text-sm text-verdoso bg-white outline-none transition-colors shadow-2xs',
          error
            ? 'border-2 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border border-borde focus:border-bosque focus:ring-1 focus:ring-bosque placeholder:text-verdoso-muted/70',
          disabled ? 'bg-crema cursor-not-allowed opacity-60' : ''
        ]"
      ></textarea>

      <!-- Modo Select -->
      <select
        v-else-if="type === 'select'"
        :id="id"
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value); $emit('input', $event)"
        @blur="$emit('blur', $event)"
        :class="[
          'block w-full px-3.5 py-2.5 rounded-xl text-sm text-verdoso bg-white outline-none transition-colors shadow-2xs cursor-pointer',
          error
            ? 'border-2 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border border-borde focus:border-bosque focus:ring-1 focus:ring-bosque',
          disabled ? 'bg-crema cursor-not-allowed opacity-60' : ''
        ]"
      >
        <slot>
          <option
            v-for="opt in options"
            :key="typeof opt === 'object' ? opt.value : opt"
            :value="typeof opt === 'object' ? opt.value : opt"
          >
            {{ typeof opt === 'object' ? opt.label : opt }}
          </option>
        </slot>
      </select>

      <!-- Modo Input estándar -->
      <input
        v-else
        :id="id"
        :value="modelValue"
        :type="type"
        :step="step"
        :min="min"
        :max="max"
        :placeholder="placeholder"
        :disabled="disabled"
        @input="$emit('update:modelValue', $event.target.value); $emit('input', $event)"
        @blur="$emit('blur', $event)"
        @keyup.enter="$emit('enter')"
        :class="[
          'block w-full py-2.5 rounded-xl text-sm text-verdoso bg-white outline-none transition-colors shadow-2xs',
          $slots.prefix ? 'pl-10' : 'pl-3.5',
          $slots.suffix ? 'pr-10' : 'pr-3.5',
          error
            ? 'border-2 border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border border-borde focus:border-bosque focus:ring-1 focus:ring-bosque placeholder:text-verdoso-muted/70',
          disabled ? 'bg-crema cursor-not-allowed opacity-60' : ''
        ]"
      />
    </div>

    <!-- Mensaje de error en rojo debajo del campo -->
    <p
      v-if="error"
      class="text-xs text-red-500 font-medium mt-1 leading-tight select-none"
    >
      {{ error }}
    </p>
  </div>
</template>

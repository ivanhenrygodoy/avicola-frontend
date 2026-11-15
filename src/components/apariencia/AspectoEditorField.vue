<script setup>
import { computed } from 'vue'
import FormField from '@/components/common/FormField.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

const props = defineProps({
  aspecto: {
    type: Object,
    required: true,
  },
  modelValue: {
    type: String,
    required: true,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])

const esModificado = computed(
  () => String(props.modelValue || '').toUpperCase() !== String(props.aspecto.valor_defecto || '').toUpperCase()
)

const esHexValido = computed(() => /^#[0-9A-Fa-f]{6}$/.test(String(props.modelValue || '').trim()))

const PRESETS_SOMBRA = [
  { value: 'none', label: 'Sin sombra (plano)' },
  { value: '0 1px 2px 0 rgb(0 0 0 / 0.05)', label: 'Sutil (DESIGN.md)' },
  { value: '0 4px 12px -2px rgb(38 51 43 / 0.08)', label: 'Media orgánica' },
  { value: '0 10px 25px -5px rgb(0 0 0 / 0.15)', label: 'Elevada marcada' },
  { value: '0 1px 3px 0 rgb(0 0 0 / 0.35)', label: 'Nocturna sutil' },
  { value: '0 6px 16px -2px rgb(0 0 0 / 0.45)', label: 'Nocturna elevada' },
]

const actualizar = (valor) => {
  emit('update:modelValue', valor)
}
</script>

<template>
  <div class="p-3.5 rounded-xl border border-borde bg-crema-surface/50 space-y-2.5">
    <div class="flex items-center justify-between gap-2">
      <div class="min-w-0">
        <p class="text-xs font-bold text-verdoso truncate">{{ aspecto.etiqueta }}</p>
        <p class="text-[11px] text-verdoso-muted font-mono truncate">{{ aspecto.variable_css }}</p>
      </div>
      <StatusBadge :variant="esModificado ? 'warning' : 'neutral'" size="sm">
        {{ esModificado ? 'Modificado' : 'Por defecto' }}
      </StatusBadge>
    </div>

    <div v-if="aspecto.tipo_control === 'color'" class="flex items-start gap-2.5">
      <label class="relative shrink-0 cursor-pointer" :title="`Seleccionar color para ${aspecto.etiqueta}`">
        <input
          type="color"
          :value="esHexValido ? modelValue : '#244B36'"
          @input="actualizar($event.target.value.toUpperCase())"
          class="w-10 h-10 rounded-xl border border-borde bg-white p-1 cursor-pointer"
        />
      </label>

      <div class="flex-1 min-w-0">
        <FormField
          :model-value="modelValue"
          @update:model-value="actualizar($event)"
          placeholder="#244B36"
          :error="error"
        />
      </div>
    </div>

    <div v-else class="space-y-2">
      <FormField
        type="select"
        :model-value="modelValue"
        :options="PRESETS_SOMBRA"
        @update:model-value="actualizar($event)"
        :error="error"
      />
      <FormField
        :model-value="modelValue"
        placeholder="0 1px 2px 0 rgb(0 0 0 / 0.05)"
        @update:model-value="actualizar($event)"
      />
    </div>

    <div class="flex items-center justify-between text-[11px] text-verdoso-muted">
      <span>Defecto: <code class="font-mono">{{ aspecto.valor_defecto }}</code></span>
      <button
        v-if="esModificado"
        type="button"
        class="text-bosque hover:underline font-semibold cursor-pointer"
        @click="actualizar(aspecto.valor_defecto)"
      >
        Restablecer campo
      </button>
    </div>
  </div>
</template>


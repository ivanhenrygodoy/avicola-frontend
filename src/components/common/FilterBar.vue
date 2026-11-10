<script setup>
import { computed } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import FloatingInput from '@/components/common/FloatingInput.vue'
import FloatingSelect from '@/components/common/FloatingSelect.vue'

/**
 * Barra de filtros dirigida por configuración y diseño adaptativo.
 *
 * Uso: <FilterBar v-model="store.filters" :fields="campos" action-label="Nueva casita"
 *                 @search="..." @clear="..." @action="..." />
 *
 * `fields`: [{ key, type, label, options?, show? }]
 *   - type 'search' → input de texto con lupa
 *   - type 'text'   → input de texto
 *   - type 'date'   → input de fecha
 *   - type 'select' → desplegable (requiere `options`)
 *   - show: false oculta el campo sin quitarlo de la configuración
 *
 * Comportamiento dinámico del layout:
 *   - Si hay pocos campos (<= 4 por defecto): se ubican en una sola fila compacta con los
 *     botones al extremo derecho (modo en línea clásico).
 *   - Si hay múltiples campos (>= 5, como en Benchmark o Gastos): los botones se integran
 *     en el flujo de la siguiente línea alineados al extremo derecho, evitando que floten
 *     descolocados en medio de varias filas.
 *   - La prop opcional `multiRow` permite forzar este comportamiento explícitamente.
 */
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  fields: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  showClear: { type: Boolean, default: true },
  searchLabel: { type: String, default: 'Buscar' },
  clearLabel: { type: String, default: 'Limpiar' },
  // Botón de acción principal ("Nueva casita", "Registrar ave"…): solo si hay etiqueta
  actionLabel: { type: String, default: '' },
  // Fábrica: Vue invoca los defaults que son función, y un componente de Lucide no debe invocarse
  actionIcon: { type: [Object, Function], default: () => Plus },
  // Permite forzar multi-fila (botones en la siguiente línea) o en-línea (botones al lado)
  multiRow: { type: Boolean, default: null },
})

const emit = defineEmits(['update:modelValue', 'search', 'clear', 'action'])

const visibleFields = computed(() => props.fields.filter((f) => f.show !== false))

// Determina si los filtros ocupan múltiples filas en pantallas grandes
const isMultiRow = computed(() => {
  if (props.multiRow !== null) return props.multiRow
  return visibleFields.value.length >= 5
})

// Clases completas para el modo clásico en línea (1 a 4 campos)
const INLINE_GRID_COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
}
const inlineGridClass = computed(() => INLINE_GRID_COLUMNS[Math.min(visibleFields.value.length, 4)] || 'grid-cols-1')

// Rejilla de 5 columnas para modo multi-fila
const multiRowGridClass = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'

// Clases estáticas de col-span para que Tailwind compile y el contenedor de botones
// ocupe el espacio restante en la última fila alineado a la derecha, o fluya a la siguiente
const MULTI_ROW_ACTION_COL_SPANS = {
  1: 'col-span-1 sm:col-span-1 lg:col-span-2 xl:col-span-4',
  2: 'col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-3',
  3: 'col-span-1 sm:col-span-1 lg:col-span-3 xl:col-span-2',
  4: 'col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-1',
  5: 'col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-5',
  6: 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4',
  7: 'col-span-1 sm:col-span-1 lg:col-span-2 xl:col-span-3',
  8: 'col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-2',
  9: 'col-span-1 sm:col-span-1 lg:col-span-3 xl:col-span-1',
  10: 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-5',
}
const actionColSpanClass = computed(() => {
  const count = visibleFields.value.length
  return MULTI_ROW_ACTION_COL_SPANS[count] || 'col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-5'
})

const setField = (key, value) => emit('update:modelValue', { ...props.modelValue, [key]: value })
</script>

<template>
  <div class="bg-white rounded-2xl border border-borde p-4 sm:p-5 shadow-xs">
    <!-- MODO MULTI-FILA: Cuando hay 5+ campos o se activa multiRow -->
    <!-- Los botones se integran en el grid y se orientan/alinean a la siguiente línea -->
    <div v-if="isMultiRow" class="w-full">
      <div v-if="visibleFields.length" :class="['grid gap-4 items-end', multiRowGridClass]">
        <template v-for="field in visibleFields" :key="field.key">
          <FloatingSelect
            v-if="field.type === 'select'"
            :model-value="modelValue[field.key]"
            :label="field.label"
            :options="field.options || []"
            @update:model-value="setField(field.key, $event)"
          />
          <FloatingInput
            v-else
            :model-value="modelValue[field.key]"
            :label="field.label"
            :type="field.type === 'date' ? 'date' : 'text'"
            :icon="field.type === 'search' ? Search : undefined"
            @update:model-value="setField(field.key, $event)"
            @enter="$emit('search')"
          />
        </template>

        <!-- Botones de Acción dentro del Grid (alineados a la siguiente línea / extremo derecho) -->
        <div :class="['flex flex-wrap items-center gap-2 justify-end self-end pt-1', actionColSpanClass]">
          <button
            type="button"
            @click="$emit('search')"
            :disabled="loading"
            class="px-5 py-2.5 btn-principal text-sm shadow-xs cursor-pointer"
          >
            {{ searchLabel }}
          </button>
          <button
            v-if="showClear"
            type="button"
            @click="$emit('clear')"
            :disabled="loading"
            class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
          >
            {{ clearLabel }}
          </button>
          <button
            v-if="actionLabel"
            type="button"
            @click="$emit('action')"
            class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1 cursor-pointer"
          >
            <component :is="actionIcon" class="w-4 h-4" aria-hidden="true" />
            <span>{{ actionLabel }}</span>
          </button>
          <slot name="action" />
        </div>
      </div>
      <slot />
    </div>

    <!-- MODO EN LÍNEA: Pocos campos (1 a 4), caben cómodamente en 1 sola fila en desktop -->
    <div v-else class="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
      <div class="flex-1">
        <div v-if="visibleFields.length" :class="['grid gap-4', inlineGridClass]">
          <template v-for="field in visibleFields" :key="field.key">
            <FloatingSelect
              v-if="field.type === 'select'"
              :model-value="modelValue[field.key]"
              :label="field.label"
              :options="field.options || []"
              @update:model-value="setField(field.key, $event)"
            />
            <FloatingInput
              v-else
              :model-value="modelValue[field.key]"
              :label="field.label"
              :type="field.type === 'date' ? 'date' : 'text'"
              :icon="field.type === 'search' ? Search : undefined"
              @update:model-value="setField(field.key, $event)"
              @enter="$emit('search')"
            />
          </template>
        </div>
        <slot />
      </div>

      <!-- Botones de Acción al extremo derecho en flex-row -->
      <div class="flex items-center gap-2 justify-end self-end xl:self-center shrink-0 pt-2 xl:pt-0">
        <button
          type="button"
          @click="$emit('search')"
          :disabled="loading"
          class="px-5 py-2.5 btn-principal text-sm shadow-xs cursor-pointer"
        >
          {{ searchLabel }}
        </button>
        <button
          v-if="showClear"
          type="button"
          @click="$emit('clear')"
          :disabled="loading"
          class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
        >
          {{ clearLabel }}
        </button>
        <button
          v-if="actionLabel"
          type="button"
          @click="$emit('action')"
          class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1 cursor-pointer"
        >
          <component :is="actionIcon" class="w-4 h-4" aria-hidden="true" />
          <span>{{ actionLabel }}</span>
        </button>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

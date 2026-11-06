<script setup>
import { computed } from 'vue'
import { Plus, Search } from 'lucide-vue-next'
import FloatingInput from '@/components/common/FloatingInput.vue'
import FloatingSelect from '@/components/common/FloatingSelect.vue'

/**
 * Barra de filtros dirigida por configuración.
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
 * Cada campo lee y escribe `modelValue[key]`; Enter en un input dispara `search`.
 * La rejilla se ajusta sola según los campos visibles. Las ranuras `default` (filtros
 * a medida) y `action` (botón a medida) siguen disponibles para casos que no encajen.
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
})

const emit = defineEmits(['update:modelValue', 'search', 'clear', 'action'])

const visibleFields = computed(() => props.fields.filter((f) => f.show !== false))

// Clases completas (no interpoladas) para que Tailwind no las elimine al compilar
const GRID_COLUMNS = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
}
const gridClass = computed(() => GRID_COLUMNS[Math.min(visibleFields.value.length, 5)])

const setField = (key, value) => emit('update:modelValue', { ...props.modelValue, [key]: value })
</script>

<template>
  <div class="bg-white rounded-2xl border border-borde p-4 sm:p-5 shadow-xs">
    <div class="flex flex-col xl:flex-row gap-4 justify-between items-stretch xl:items-center">
      <!-- Filtros dinámicos -->
      <div class="flex-1">
        <div v-if="visibleFields.length" :class="['grid gap-4', gridClass]">
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

      <!-- Botones de Acción del Filtro y Acción Principal -->
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

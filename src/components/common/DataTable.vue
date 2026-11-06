<script setup>
import { computed } from 'vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'

/**
 * Tabla de listado corporativa dirigida por columnas: tarjeta, carga, cabecera, filas,
 * estado vacío y paginación. La vista solo declara columnas y filas; el marcado, los
 * estados y los estilos viven aquí (una sola fuente).
 *
 * columns: [{ key, label, align?: 'left'|'right'|'center', nowrap?: boolean, cellClass?: string }]
 *   - Cada celda se pinta con el slot `#cell-<key>="{ row, value, index }"`;
 *     sin slot muestra `row[key]` (o "—" si está vacío).
 *   - La última columna de acciones suele llevar `key: 'acciones'` y `align: 'right'`.
 * rows:    arreglo de filas.   rowKey: campo único de cada fila (por defecto `id`).
 * loading: muestra LoadingState en lugar de la tabla.
 * Estado vacío: `emptyTitle` / `emptyDescription` / `emptyActionLabel` (emite `empty-action`).
 * Paginación (opcional): pasar `meta` ({ current_page, last_page, per_page, total }) y
 *   `itemLabel`; emite `update:page` y `update:perPage`.
 */
const props = defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, default: () => [] },
  rowKey: { type: String, default: 'id' },
  loading: { type: Boolean, default: false },
  loadingMessage: { type: String, default: '' },
  emptyTitle: { type: String, default: 'No se encontraron registros' },
  emptyDescription: { type: String, default: '' },
  emptyActionLabel: { type: String, default: '' },
  meta: { type: Object, default: null },
  itemLabel: { type: String, default: 'registros' },
})

defineEmits(['update:page', 'update:perPage', 'empty-action'])

// Clases completas (no interpoladas) para que Tailwind no las elimine al compilar
const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' }

const alignClass = (col) => ALIGN[col.align || 'left']
const celdaVacia = (v) => v === null || v === undefined || v === ''

const columnCount = computed(() => props.columns.length)
</script>

<template>
  <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
    <LoadingState v-if="loading" :message="loadingMessage || undefined" />

    <div v-else class="overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-crema/60 border-b border-borde text-verdoso font-bold text-xs uppercase tracking-wider">
          <tr>
            <th
              v-for="col in columns"
              :key="col.key"
              scope="col"
              :class="['px-6 py-4', alignClass(col)]"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>

        <tbody class="divide-y divide-borde">
          <tr v-if="rows.length === 0">
            <td :colspan="columnCount" class="px-6 py-14 text-center">
              <EmptyState
                :title="emptyTitle"
                :description="emptyDescription"
                :action-label="emptyActionLabel"
                @action="$emit('empty-action')"
              />
            </td>
          </tr>

          <tr
            v-for="(row, index) in rows"
            :key="row[rowKey]"
            class="hover:bg-crema/40 transition-colors"
          >
            <td
              v-for="col in columns"
              :key="col.key"
              :class="[
                'px-6 py-4',
                alignClass(col),
                col.nowrap ? 'whitespace-nowrap' : '',
                col.cellClass || '',
              ]"
            >
              <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]" :index="index">
                {{ celdaVacia(row[col.key]) ? '—' : row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <PaginationBar
      v-if="meta && !loading"
      :current-page="meta.current_page"
      :last-page="meta.last_page"
      :per-page="meta.per_page"
      :total="meta.total"
      :item-label="itemLabel"
      @update:page="$emit('update:page', $event)"
      @update:per-page="$emit('update:perPage', $event)"
    />
  </div>
</template>

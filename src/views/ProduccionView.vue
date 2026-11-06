<script setup>
import { ref, computed, onMounted } from 'vue'
import { useProduccionStore } from '@/stores/produccion'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'

// Componentes comunes globales (SOLID - Impeccable)
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import StatCard from '@/components/common/StatCard.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import HuevoFormModal from '@/components/produccion/HuevoFormModal.vue'
import AlimentacionFormModal from '@/components/produccion/AlimentacionFormModal.vue'
import { provideActionLoader } from '@/composables/useActionLoader'
import { formatMoney, formatMoneyOrDash } from '@/utils/format'

// Iconos Lucide
import {
  Egg,
  Wheat,
  Pencil,
  Trash2,
} from 'lucide-vue-next'

const produccionStore = useProduccionStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()

// Pestaña activa ('huevos' | 'alimentacion')
const activeTab = ref('huevos')

// Modales y overlay de carga (único para la vista; los modales de formulario lo reciben por inject)
const showHuevoModal = ref(false)
const huevoSeleccionado = ref(null)
const showAlimentacionModal = ref(false)
const alimentacionSeleccionada = ref(null)
const showDeleteModal = ref(false)
const deleteTarget = ref(null) // { type: 'huevo' | 'alimentacion', id: number, label: string }
const { isSubmitting, message: actionLoaderMessage, run } = provideActionLoader()

// Opciones de Divisiones para filtros (sin opción vacía porque FloatingSelect la maneja)
const divisionFiltroOptions = computed(() => {
  const options = []
  const casitas = instalacionesStore.casitas || []
  casitas.forEach((c) => {
    if (c.divisiones && c.divisiones.length > 0) {
      c.divisiones.forEach((d) => {
        options.push({
          value: d.id,
          label: `${c.nombre} • ${d.nombre}`,
        })
      })
    }
  })
  return options
})

// Opciones de Tipos de Alimento para filtro
const tiposAlimentoFiltroOptions = computed(() => {
  return (produccionStore.tiposAlimento || []).map((t) => ({
    value: t.id,
    label: t.nombre,
  }))
})

// Columnas de las tablas (DataTable las dibuja); cada celda se personaliza con su slot #cell-<key>
const columnasHuevos = [
  { key: 'fecha', label: 'Fecha', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'corral', label: 'Ubicación / Corral', nowrap: true },
  { key: 'recolectados', label: 'Recolectados', align: 'center', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'rotos', label: 'Rotos', align: 'center', nowrap: true },
  { key: 'aprovechables', label: 'Aprovechables', align: 'center', nowrap: true },
  { key: 'observaciones', label: 'Observaciones', cellClass: 'text-xs text-verdoso-muted max-w-xs truncate' },
  { key: 'acciones', label: 'Acciones', align: 'right', nowrap: true },
]

const columnasAlimentacion = [
  { key: 'fecha', label: 'Fecha', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'corral', label: 'Corral / División', nowrap: true },
  { key: 'tipo', label: 'Tipo de Alimento', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'cantidad', label: 'Cantidad Suministrada', align: 'center', nowrap: true, cellClass: 'text-bosque' },
  { key: 'costo', label: 'Costo', align: 'center', nowrap: true, cellClass: 'text-xs text-verdoso-muted' },
  { key: 'observaciones', label: 'Observaciones', cellClass: 'text-xs text-verdoso-muted max-w-xs truncate' },
  { key: 'acciones', label: 'Acciones', align: 'right', nowrap: true },
]

// Configuración de las barras de filtros (FilterBar las dibuja)
const filterFieldsHuevos = computed(() => [
  { key: 'id_division', type: 'select', label: 'Corral / División', options: divisionFiltroOptions.value },
  { key: 'fecha_inicio', type: 'date', label: 'Desde' },
  { key: 'fecha_fin', type: 'date', label: 'Hasta' },
])

const filterFieldsAlimentacion = computed(() => [
  { key: 'id_division', type: 'select', label: 'Corral / División', options: divisionFiltroOptions.value },
  { key: 'id_tipo_alimento', type: 'select', label: 'Tipo de Alimento', options: tiposAlimentoFiltroOptions.value },
  { key: 'fecha_inicio', type: 'date', label: 'Desde' },
  { key: 'fecha_fin', type: 'date', label: 'Hasta' },
])

onMounted(async () => {
  await Promise.allSettled([
    instalacionesStore.fetchCasitas({ per_page: 100 }),
    produccionStore.fetchTiposAlimento(),
    produccionStore.fetchHuevos(),
    produccionStore.fetchAlimentacion(),
  ])
})

// --- ACCIONES DE HUEVOS ---
const handleSearchHuevos = () => {
  produccionStore.setPageHuevos(1)
}

const handleClearHuevos = () => {
  produccionStore.resetFiltersHuevos()
}

const openCreateHuevoModal = () => {
  huevoSeleccionado.value = null
  showHuevoModal.value = true
}

const openEditHuevoModal = (huevo) => {
  huevoSeleccionado.value = huevo
  showHuevoModal.value = true
}

// --- ACCIONES DE ALIMENTACIÓN ---
const handleSearchAlimentacion = () => {
  produccionStore.setPageAlimentacion(1)
}

const handleClearAlimentacion = () => {
  produccionStore.resetFiltersAlimentacion()
}

const openCreateAlimentacionModal = () => {
  alimentacionSeleccionada.value = null
  showAlimentacionModal.value = true
}

const openEditAlimentacionModal = (item) => {
  alimentacionSeleccionada.value = item
  showAlimentacionModal.value = true
}

// --- CONFIRMACIÓN DE ELIMINACIÓN ---
const confirmDelete = (type, item) => {
  deleteTarget.value = {
    type,
    id: item.id,
    label:
      type === 'huevo'
        ? `postura del ${item.fecha} (${item.cantidad_recolectada} huevos)`
        : `ración del ${item.fecha} (${item.cantidad} ${item.unidad_medida})`,
  }
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!deleteTarget.value) return
  const { type, id } = deleteTarget.value

  try {
    if (type === 'huevo') {
      await run('Eliminando registro...', () => produccionStore.removeHuevo(id))
      notify.success('Registro de postura eliminado correctamente.')
    } else {
      await run('Eliminando registro...', () => produccionStore.removeAlimentacion(id))
      notify.success('Registro de alimentación eliminado correctamente.')
    }
    showDeleteModal.value = false
  } catch (err) {
    notify.error('No se pudo eliminar el registro seleccionado.')
  } finally {
    deleteTarget.value = null
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior -->
    <AppHeader subtitle="Alimentación y Postura" />

    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Selector de Pestañas Principal -->
      <PageHeader
        title="Control de Producción y Alimentación"
        subtitle="Registro diario de postura por corral y balance del suministro de raciones."
        bordered
      >
        <template #actions>
          <!-- Toggle Pills -->
          <div class="inline-flex p-1 bg-white border border-borde rounded-full shadow-2xs">
            <button
              type="button"
              @click="activeTab = 'huevos'"
              :class="[
                'px-5 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'huevos'
                  ? 'bg-bosque text-white shadow-xs'
                  : 'text-verdoso-muted hover:text-verdoso'
              ]"
            >
              <Egg class="w-4 h-4" />
              <span>Recolección de Huevos</span>
            </button>
            <button
              type="button"
              @click="activeTab = 'alimentacion'"
              :class="[
                'px-5 py-2 text-sm font-semibold rounded-full transition-all cursor-pointer flex items-center gap-2',
                activeTab === 'alimentacion'
                  ? 'bg-bosque text-white shadow-xs'
                  : 'text-verdoso-muted hover:text-verdoso'
              ]"
            >
              <Wheat class="w-4 h-4" />
              <span>Raciones de Alimento</span>
            </button>
          </div>
        </template>
      </PageHeader>

      <!-- ========================================== -->
      <!-- PESTAÑA 1: RECOLECCIÓN DE HUEVOS (POSTURA) -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'huevos'" class="space-y-6">
        <!-- Indicadores Clave (StatCards) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Recolectados"
            :value="produccionStore.statsHuevos.total_recolectados || 0"
          />
          <StatCard
            title="Huevos Aprovechables"
            :value="produccionStore.statsHuevos.total_aprovechables || 0"
            value-color-class="text-bosque"
          />
          <StatCard
            title="Huevos Rotos / Mermas"
            :value="produccionStore.statsHuevos.total_rotos || 0"
            :value-color-class="produccionStore.statsHuevos.total_rotos > 0 ? 'text-amber-700' : 'text-verdoso'"
          />
          <StatCard
            title="Índice de Merma"
            :value="(produccionStore.statsHuevos.porcentaje_rotura || 0) + '%'"
            value-color-class="text-verdoso-muted"
          />
        </div>

        <!-- Barra de Filtros Reutilizable con FilterBar Component (SOLID - Estándar Idéntico) -->
        <FilterBar
          v-model="produccionStore.filtersHuevos"
          :fields="filterFieldsHuevos"
          :loading="produccionStore.loadingHuevos"
          action-label="Registrar postura"
          @search="handleSearchHuevos"
          @clear="handleClearHuevos"
          @action="openCreateHuevoModal"
        />

        <!-- Tabla de Registros de Postura -->
        <DataTable
          :columns="columnasHuevos"
          :rows="produccionStore.huevos"
          :loading="produccionStore.loadingHuevos"
          :meta="produccionStore.metaHuevos"
          item-label="recolecciones"
          empty-title="No hay registros de postura"
          empty-description="No se encontraron recolecciones de huevos con los filtros seleccionados."
          @update:page="produccionStore.setPageHuevos"
          @update:per-page="produccionStore.setPerPageHuevos"
        >
          <template #cell-fecha="{ row }">{{ row.fecha }}</template>

          <template #cell-corral="{ row }">
            <div class="text-verdoso">{{ row.division?.nombre || 'Corral' }}</div>
            <div class="text-xs text-verdoso-muted">{{ row.division?.casita?.nombre || 'Casita' }}</div>
          </template>

          <template #cell-recolectados="{ row }">{{ row.cantidad_recolectada }}</template>

          <template #cell-rotos="{ row }">
            <StatusBadge v-if="row.cantidad_rotos > 0" variant="warning">{{ row.cantidad_rotos }} rotos</StatusBadge>
            <span v-else class="text-xs text-verdoso-muted">0</span>
          </template>

          <template #cell-aprovechables="{ row }">
            <StatusBadge variant="success">{{ row.cantidad_aprovechables }} sanos</StatusBadge>
          </template>

          <template #cell-observaciones="{ row }">{{ row.observaciones || '—' }}</template>

          <template #cell-acciones="{ row }">
            <div class="inline-flex items-center gap-1">
              <RowActionButton :icon="Pencil" tone="edit" title="Editar registro" @click="openEditHuevoModal(row)" />
              <RowActionButton :icon="Trash2" tone="danger" title="Eliminar registro" @click="confirmDelete('huevo', row)" />
            </div>
          </template>
        </DataTable>
      </div>

      <!-- ============================================== -->
      <!-- PESTAÑA 2: RACIONES DE ALIMENTACIÓN POR CORRAL -->
      <!-- ============================================== -->
      <div v-else class="space-y-6">
        <!-- Indicadores Clave Alimentación -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            title="Total Alimento Suministrado"
            :value="(produccionStore.statsAlimentacion.total_kilos || 0) + ' kg'"
            value-color-class="text-bosque"
          />
          <StatCard
            title="Inversión Estimada en Alimento"
            :value="formatMoney(produccionStore.statsAlimentacion.total_costo)"
          />
          <StatCard
            title="Total Raciones Registradas"
            :value="produccionStore.statsAlimentacion.total_registros || 0"
          />
        </div>

        <!-- Filtros Alimentación Reutilizables (SOLID - Estándar Idéntico) -->
        <FilterBar
          v-model="produccionStore.filtersAlimentacion"
          :fields="filterFieldsAlimentacion"
          :loading="produccionStore.loadingAlimentacion"
          action-label="Registrar ración"
          @search="handleSearchAlimentacion"
          @clear="handleClearAlimentacion"
          @action="openCreateAlimentacionModal"
        />

        <!-- Tabla de Registros de Alimentación -->
        <DataTable
          :columns="columnasAlimentacion"
          :rows="produccionStore.alimentacion"
          :loading="produccionStore.loadingAlimentacion"
          :meta="produccionStore.metaAlimentacion"
          item-label="raciones"
          empty-title="No hay registros de alimentación"
          empty-description="No se encontraron raciones registradas para el filtro indicado."
          @update:page="produccionStore.setPageAlimentacion"
          @update:per-page="produccionStore.setPerPageAlimentacion"
        >
          <template #cell-fecha="{ row }">{{ row.fecha }}</template>

          <template #cell-corral="{ row }">
            <div class="text-verdoso">{{ row.division?.nombre || 'Corral' }}</div>
            <div class="text-xs text-verdoso-muted">{{ row.division?.casita?.nombre || 'Casita' }}</div>
          </template>

          <template #cell-tipo="{ row }">{{ row.tipo_alimento?.nombre || '—' }}</template>

          <template #cell-cantidad="{ row }">{{ row.cantidad }} {{ row.unidad_medida }}</template>

          <template #cell-costo="{ row }">{{ formatMoneyOrDash(row.costo_total) }}</template>

          <template #cell-observaciones="{ row }">{{ row.observaciones || '—' }}</template>

          <template #cell-acciones="{ row }">
            <div class="inline-flex items-center gap-1">
              <RowActionButton :icon="Pencil" tone="edit" title="Editar ración" @click="openEditAlimentacionModal(row)" />
              <RowActionButton :icon="Trash2" tone="danger" title="Eliminar ración" @click="confirmDelete('alimentacion', row)" />
            </div>
          </template>
        </DataTable>
      </div>
    </main>

    <!-- Modales de formulario (estado propio) -->
    <HuevoFormModal
      :is-open="showHuevoModal"
      :huevo="huevoSeleccionado"
      @close="showHuevoModal = false"
    />

    <AlimentacionFormModal
      :is-open="showAlimentacionModal"
      :racion="alimentacionSeleccionada"
      @close="showAlimentacionModal = false"
    />

    <!-- Modal de Confirmación de Eliminación -->
    <BaseConfirmModal
      :is-open="showDeleteModal"
      :title="deleteTarget?.type === 'huevo' ? '¿Eliminar registro de postura?' : '¿Eliminar registro de ración?'"
      :question="`¿Estás seguro de eliminar el registro de ${deleteTarget?.label}?`"
      description="Esta acción no se puede revertir y los totales se actualizarán automáticamente."
      confirm-text="Eliminar Registro"
      cancel-text="Cancelar"
      :is-destructive="true"
      :loading="isSubmitting"
      @confirm="executeDelete"
      @cancel="showDeleteModal = false"
      @close="showDeleteModal = false"
    />

    <!-- Loader de Acción Asíncrona (Reutilizable SOLID) -->
    <ActionLoader
      :show="isSubmitting"
      :message="actionLoaderMessage"
    />
  </div>
</template>

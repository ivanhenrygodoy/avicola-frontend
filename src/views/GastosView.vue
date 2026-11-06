<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGastosStore } from '@/stores/gastos'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'

// Componentes comunes globales (SOLID - Impeccable)
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import StatCard from '@/components/common/StatCard.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import GastoFormModal from '@/components/gastos/GastoFormModal.vue'
import { provideActionLoader } from '@/composables/useActionLoader'
import { formatMoney } from '@/utils/format'

// Iconos Lucide
import {
  DollarSign,
  Receipt,
  Tag,
  Pencil,
  Trash2,
  Calendar,
} from 'lucide-vue-next'

const gastosStore = useGastosStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()

// Modales y overlay de carga (único para la vista; el modal de gasto lo recibe por inject)
const showGastoModal = ref(false)
const gastoSeleccionado = ref(null)
const showDeleteModal = ref(false)
const deleteTarget = ref(null)
const { isSubmitting, message: actionLoaderMessage, run } = provideActionLoader()

// Opciones de categorías de gastos
const categoriaFiltroOptions = computed(() => {
  return gastosStore.categorias.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }))
})

// Opciones de Divisiones / Corrales
const divisionFiltroOptions = computed(() => {
  const options = []
  const casitas = instalacionesStore.casitas || []
  casitas.forEach((c) => {
    if (c.divisiones && c.divisiones.length > 0) {
      c.divisiones.forEach((d) => {
        options.push({
          value: String(d.id),
          label: `${d.nombre} (${c.nombre})`,
        })
      })
    }
  })
  return options
})

// Columnas de la tabla (DataTable la dibuja); cada celda se personaliza con su slot #cell-<key>
const columnas = [
  { key: 'fecha', label: 'Fecha', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'concepto', label: 'Concepto' },
  { key: 'categoria', label: 'Categoría', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'ubicacion', label: 'Ubicación / Corral', nowrap: true },
  { key: 'monto', label: 'Monto', align: 'right', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'proveedor', label: 'Proveedor', nowrap: true, cellClass: 'text-verdoso-muted text-xs' },
  { key: 'acciones', label: 'Acciones', align: 'right', nowrap: true },
]

// Configuración de la barra de filtros (FilterBar la dibuja)
const filterFields = computed(() => [
  { key: 'search', type: 'search', label: 'Buscar por concepto o proveedor' },
  { key: 'id_categoria_gasto', type: 'select', label: 'Categoría de Gasto', options: categoriaFiltroOptions.value },
  { key: 'id_division', type: 'select', label: 'Corral / División', options: divisionFiltroOptions.value },
  { key: 'fecha_inicio', type: 'date', label: 'Desde' },
  { key: 'fecha_fin', type: 'date', label: 'Hasta' },
])

// Búsqueda y Filtros
const handleSearch = () => {
  gastosStore.filters.page = 1
  gastosStore.fetchGastos()
}

const handleClear = () => {
  gastosStore.resetFilters()
}

// Paginación
const handlePageChange = (page) => {
  gastosStore.filters.page = page
  gastosStore.fetchGastos()
}

const handlePerPageChange = (perPage) => {
  gastosStore.filters.per_page = perPage
  gastosStore.filters.page = 1
  gastosStore.fetchGastos()
}

// Apertura del modal de gasto (null = crear)
const openCreateModal = () => {
  gastoSeleccionado.value = null
  showGastoModal.value = true
}

const openEditModal = (item) => {
  gastoSeleccionado.value = item
  showGastoModal.value = true
}

// Eliminación
const confirmDelete = (item) => {
  deleteTarget.value = item
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!deleteTarget.value) return
  try {
    await run('Eliminando gasto...', () => gastosStore.removeGasto(deleteTarget.value.id))
    notify.success('Gasto eliminado correctamente.')
    showDeleteModal.value = false
  } catch (err) {
    notify.error('No se pudo eliminar el gasto seleccionado.')
  } finally {
    deleteTarget.value = null
  }
}

// Inicialización
onMounted(async () => {
  await Promise.all([
    gastosStore.fetchCategorias(),
    gastosStore.fetchGastos(),
    instalacionesStore.fetchCasitas(),
  ])
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior -->
    <AppHeader subtitle="Control de Gastos" />

    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Encabezado de la Sección -->
      <PageHeader
        title="Control de Gastos y Finanzas Operativas"
        subtitle="Registro de egresos por alimentación, insumos veterinarios, mantenimiento e infraestructura."
        bordered
      />

      <!-- Indicadores Clave (StatCards) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gastos (Filtro Actual)"
          :value="formatMoney(gastosStore.stats.total_gastos)"
          value-color-class="text-bosque"
        />
        <StatCard
          title="Total del Mes Actual"
          :value="formatMoney(gastosStore.stats.total_mes_actual)"
          value-color-class="text-verdoso"
        />
        <StatCard
          title="Total de Comprobantes"
          :value="gastosStore.stats.total_registros || 0"
          value-color-class="text-verdoso-muted"
        />
      </div>

      <!-- Barra de Filtros Reutilizable con FilterBar Component -->
      <FilterBar
        v-model="gastosStore.filters"
        :fields="filterFields"
        :loading="gastosStore.loading"
        action-label="Registrar gasto"
        @search="handleSearch"
        @clear="handleClear"
        @action="openCreateModal"
      />

      <!-- Tabla de Gastos -->
      <DataTable
        :columns="columnas"
        :rows="gastosStore.gastos"
        :loading="gastosStore.loading"
        :meta="gastosStore.meta"
        item-label="gastos"
        empty-title="No se encontraron gastos"
        empty-description="Intenta ajustar los filtros de búsqueda o registra un nuevo gasto."
        @update:page="handlePageChange"
        @update:per-page="handlePerPageChange"
      >
        <template #cell-fecha="{ row }">{{ row.fecha }}</template>

        <template #cell-concepto="{ row }">
          <div class="text-verdoso">{{ row.concepto }}</div>
          <div v-if="row.observaciones" class="text-xs text-verdoso-muted truncate max-w-xs">
            {{ row.observaciones }}
          </div>
        </template>

        <template #cell-categoria="{ row }">{{ row.categoria?.nombre || 'General' }}</template>

        <template #cell-ubicacion="{ row }">
          <div class="text-verdoso">{{ row.division?.nombre || 'General' }}</div>
          <div class="text-xs text-verdoso-muted">{{ row.division?.casita?.nombre || 'Toda la granja' }}</div>
        </template>

        <template #cell-monto="{ row }">{{ formatMoney(row.monto) }}</template>

        <template #cell-proveedor="{ row }">{{ row.proveedor || '—' }}</template>

        <template #cell-acciones="{ row }">
          <div class="inline-flex items-center gap-1">
            <RowActionButton :icon="Pencil" tone="edit" title="Editar gasto" @click="openEditModal(row)" />
            <RowActionButton :icon="Trash2" tone="danger" title="Eliminar gasto" @click="confirmDelete(row)" />
          </div>
        </template>
      </DataTable>
    </main>

    <!-- Modal Registrar / Editar Gasto (estado propio) -->
    <GastoFormModal
      :is-open="showGastoModal"
      :gasto="gastoSeleccionado"
      @close="showGastoModal = false"
    />

    <!-- Modal Confirmar Eliminación -->
    <BaseConfirmModal
      :is-open="showDeleteModal"
      title="Eliminar Gasto"
      :message="`¿Estás seguro de que deseas eliminar el gasto por concepto de '${deleteTarget?.concepto}' por valor de ${formatMoney(deleteTarget?.monto)}? Esta acción no se puede deshacer.`"
      confirm-text="Sí, eliminar"
      cancel-text="Cancelar"
      :is-loading="isSubmitting"
      @confirm="executeDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- ActionLoader Reutilizable -->
    <ActionLoader
      :is-open="isSubmitting"
      :message="actionLoaderMessage"
    />
  </div>
</template>


<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAvesStore } from '@/stores/aves'
import { useInstalacionesStore } from '@/stores/instalaciones'

// Componentes comunes globales (SOLID - Impeccable)
import AppHeader from '@/components/common/AppHeader.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import AvesStats from '@/components/aves/AvesStats.vue'

// Modales del módulo Aves
import AveFormModal from '@/components/aves/AveFormModal.vue'
import AveTrasladoModal from '@/components/aves/AveTrasladoModal.vue'
import AveMovimientosModal from '@/components/aves/AveMovimientosModal.vue'
import AveDetalleModal from '@/components/aves/AveDetalleModal.vue'
import AveBajaModal from '@/components/aves/AveBajaModal.vue'
import AveReactivarModal from '@/components/aves/AveReactivarModal.vue'

// Composables
import { provideActionLoader } from '@/composables/useActionLoader'

// Iconos Lucide
import {
  Eye,
  History,
  Pencil,
  Trash2,
  ArrowRightLeft,
  RotateCcw,
} from 'lucide-vue-next'

const avesStore = useAvesStore()
const instalacionesStore = useInstalacionesStore()

// Overlay de carga provisto a todos los modales hijos
const loader = provideActionLoader()
const { isSubmitting, message: actionLoaderMessage } = loader

// Control de modales y ave seleccionada
const targetAve = ref(null)
const showAveModal = ref(false)
const showDetalleModal = ref(false)
const showTrasladoModal = ref(false)
const showMovimientosModal = ref(false)
const showBajaModal = ref(false)
const showReactivarModal = ref(false)

// Opciones dinámicas para filtros desde catálogos
const especieFiltroOptions = computed(() =>
  avesStore.catalogos.especies.map((esp) => ({
    value: String(esp.id),
    label: esp.nombre,
  }))
)

const sexoFiltroOptions = computed(() =>
  avesStore.catalogos.sexos.map((s) => ({
    value: String(s.id),
    label: s.nombre,
  }))
)

const estadoFiltroOptions = [
  { value: 'activa', label: 'Activas' },
  { value: 'salida', label: 'Bajas' },
]

// Definición de columnas de la tabla (DataTable la dibuja)
const columnas = [
  { key: 'nombre', label: 'Ave', cellClass: 'text-verdoso' },
  { key: 'especie', label: 'Especie', cellClass: 'text-verdoso' },
  { key: 'sexo', label: 'Sexo', cellClass: 'text-verdoso' },
  { key: 'raza', label: 'Raza', cellClass: 'text-verdoso' },
  { key: 'proposito', label: 'Propósito', cellClass: 'text-verdoso' },
  { key: 'ubicacion', label: 'Ubicación', cellClass: 'text-verdoso' },
  { key: 'estado', label: 'Estado' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]

// Configuración de la barra de filtros (FilterBar la dibuja)
const filterFields = computed(() => [
  { key: 'search', type: 'search', label: 'Buscar' },
  { key: 'id_especie', type: 'select', label: 'Especie', options: especieFiltroOptions.value },
  { key: 'id_sexo', type: 'select', label: 'Sexo', options: sexoFiltroOptions.value },
  { key: 'estado', type: 'select', label: 'Estado del Ave', options: estadoFiltroOptions },
])

onMounted(async () => {
  await Promise.all([
    avesStore.fetchCatalogos(),
    avesStore.fetchAves(),
    instalacionesStore.fetchCasitas({ per_page: 50 }),
  ])
})

// Acciones de búsqueda y paginación
const handleSearch = async () => {
  avesStore.filters.page = 1
  await avesStore.fetchAves()
}

const handleClear = async () => {
  await avesStore.resetFilters()
}

const handlePageChange = async (page) => {
  await avesStore.setPage(page)
}

const handlePerPageChange = async (perPage) => {
  await avesStore.setPerPage(perPage)
}

// Apertura de modales
const openCreateAve = () => {
  targetAve.value = null
  showAveModal.value = true
}

const openEditAve = (ave) => {
  targetAve.value = ave
  showAveModal.value = true
}

const openDetalle = (ave) => {
  targetAve.value = ave
  showDetalleModal.value = true
}

const openTraslado = (ave) => {
  targetAve.value = ave
  showTrasladoModal.value = true
}

const openMovimientos = (ave) => {
  targetAve.value = ave
  showMovimientosModal.value = true
}

const openBaja = (ave) => {
  targetAve.value = ave
  showBajaModal.value = true
}

const openReactivar = (ave) => {
  targetAve.value = ave
  showReactivarModal.value = true
}

// Callbacks tras mutaciones en los modales
const onAveSaved = async () => {
  await avesStore.fetchAves()
}

const onAveTrasladada = async () => {
  await Promise.all([
    avesStore.fetchAves(),
    instalacionesStore.fetchCasitas({ per_page: 50 }),
  ])
}

const onAveUpdated = async (aveActualizada) => {
  targetAve.value = aveActualizada
  await avesStore.fetchAves()
}

const onAveBajaConfirmed = async () => {
  await avesStore.fetchAves()
}

const onAveReactivadaConfirmed = async () => {
  await avesStore.fetchAves()
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior Reutilizable (SOLID - Impeccable) -->
    <AppHeader subtitle="Inventario de Aves" />

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Encabezado de Página -->
      <PageHeader
        title="Inventario de Aves"
        subtitle="Registro individual, seguimiento zootécnico, pesajes y movimientos con segregación biológica."
      />

      <!-- Estadísticas Reutilizables de Inventario de Aves (SOLID) -->
      <AvesStats :stats="avesStore.stats" />

      <!-- Barra de Filtros Reutilizable con FilterBar Component (SOLID) -->
      <FilterBar
        v-model="avesStore.filters"
        :fields="filterFields"
        :loading="avesStore.loading"
        action-label="Registrar ave"
        @search="handleSearch"
        @clear="handleClear"
        @action="openCreateAve"
      />

      <!-- Tabla de Inventario de Aves (DataTable Reutilizable) -->
      <DataTable
        :columns="columnas"
        :rows="avesStore.aves"
        :loading="avesStore.loading"
        :meta="avesStore.meta"
        item-label="aves"
        empty-title="Sin resultados en el inventario"
        empty-description="No se encontraron aves con los criterios de búsqueda seleccionados."
        empty-action-label="Limpiar filtros"
        @empty-action="handleClear"
        @update:page="handlePageChange"
        @update:per-page="handlePerPageChange"
      >
        <template #cell-nombre="{ row }">{{ row.nombre ? `"${row.nombre}"` : '—' }}</template>

        <template #cell-especie="{ row }">{{ row.especie?.nombre || '—' }}</template>

        <template #cell-sexo="{ row }">{{ row.sexo?.nombre || '—' }}</template>

        <template #cell-raza="{ row }">{{ row.raza || 'Criolla' }}</template>

        <template #cell-proposito="{ row }">{{ row.proposito?.nombre || 'General' }}</template>

        <template #cell-ubicacion="{ row }">{{ row.division?.casita?.nombre ? `${row.division.casita.nombre} • ${row.division.nombre}` : 'Sin asignar' }}</template>

        <template #cell-estado="{ row }">
          <StatusBadge :variant="row.estado === 'activa' ? 'success' : 'danger'">
            {{ row.estado === 'activa' ? 'Activa' : 'Baja' }}
          </StatusBadge>
        </template>

        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <RowActionButton :icon="Eye" title="Ver detalle completo del ave" @click="openDetalle(row)" />
            <RowActionButton :icon="History" title="Ver historial de traslados" @click="openMovimientos(row)" />
            <RowActionButton
              v-if="row.estado === 'activa'"
              :icon="ArrowRightLeft"
              title="Trasladar ave a otra división"
              @click="openTraslado(row)"
            />
            <RowActionButton :icon="Pencil" tone="edit" title="Editar datos del ave" @click="openEditAve(row)" />
            <RowActionButton
              v-if="row.estado === 'activa'"
              :icon="Trash2"
              tone="danger"
              title="Dar de baja ave"
              @click="openBaja(row)"
            />
            <RowActionButton
              v-else
              :icon="RotateCcw"
              tone="success"
              title="Reactivar ave / Marcar como regresada"
              @click="openReactivar(row)"
            />
          </div>
        </template>
      </DataTable>
    </main>

    <!-- Modales Extraídos del Módulo Aves -->
    <AveDetalleModal
      :is-open="showDetalleModal"
      :ave="targetAve"
      @close="showDetalleModal = false"
      @ave-updated="onAveUpdated"
    />

    <AveFormModal
      :is-open="showAveModal"
      :ave="targetAve"
      @close="showAveModal = false"
      @saved="onAveSaved"
    />

    <AveTrasladoModal
      :is-open="showTrasladoModal"
      :ave="targetAve"
      @close="showTrasladoModal = false"
      @trasladado="onAveTrasladada"
    />

    <AveMovimientosModal
      :is-open="showMovimientosModal"
      :ave="targetAve"
      @close="showMovimientosModal = false"
    />

    <AveBajaModal
      :is-open="showBajaModal"
      :ave="targetAve"
      @close="showBajaModal = false"
      @confirmed="onAveBajaConfirmed"
    />

    <AveReactivarModal
      :is-open="showReactivarModal"
      :ave="targetAve"
      @close="showReactivarModal = false"
      @confirmed="onAveReactivadaConfirmed"
    />

    <!-- Overlay de Carga Global Corporativo (provide/inject) -->
    <ActionLoader
      :is-open="isSubmitting"
      :message="actionLoaderMessage"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useInstalacionesStore } from '@/stores/instalaciones'

// Componentes comunes globales (SOLID)
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ConfirmStatusModal from '@/components/common/ConfirmStatusModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import InstalacionesStats from '@/components/instalaciones/InstalacionesStats.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import CasitaFormModal from '@/components/instalaciones/CasitaFormModal.vue'
import DivisionFormModal from '@/components/instalaciones/DivisionFormModal.vue'
import CasitaDetalleModal from '@/components/instalaciones/CasitaDetalleModal.vue'
import { provideActionLoader } from '@/composables/useActionLoader'
import { useConfirmAction } from '@/composables/useConfirmAction'
import { formatDate } from '@/utils/format'

// Iconos
import { Layers, Eye, Pencil, Trash2 } from 'lucide-vue-next'

const store = useInstalacionesStore()

// Overlay de carga único de la vista; los modales y las confirmaciones lo reciben por inject
const loader = provideActionLoader()
const { isSubmitting, message: actionLoaderMessage } = loader

// Modales
const showDetailModal = ref(false)
const showCasitaModal = ref(false)
const casitaSeleccionada = ref(null)
const showDivisionModal = ref(false)
const idCasitaParaDivision = ref(null)

// Confirmación de cambio de estado (habilitar / deshabilitar) de una casita o un corral
const estado = useConfirmAction({
  mensajeCarga: ({ type, item }) => `${item.activa ? 'Deshabilitando' : 'Habilitando'} ${type === 'casita' ? 'casita' : 'corral'}...`,
  accion: ({ type, item }) => (type === 'casita' ? store.toggleCasita(item.id) : store.toggleDivision(item.id)),
  // El texto usa el estado ANTERIOR del objetivo: el mismo que el usuario vio al confirmar
  mensajeExito: ({ item }) => (item.activa ? 'Instalación deshabilitada correctamente.' : 'Instalación habilitada correctamente.'),
  mensajeError: 'Error al cambiar estado de la instalación.',
  loader, // esta vista provee el loader: se pasa explícito (no se puede inyectar a sí misma)
})

const isTargetActive = computed(() => Boolean(estado.target.value?.item?.activa))
const targetTypeLabel = computed(() => (estado.target.value?.type === 'casita' ? 'casita' : 'corral'))
const targetTypeName = computed(() => (estado.target.value?.type === 'casita' ? 'la casita' : 'el corral'))

const statusModalTitle = computed(() => {
  if (!estado.target.value?.item) return ''
  return `${isTargetActive.value ? 'Deshabilitar' : 'Habilitar'} ${targetTypeLabel.value}: ${estado.target.value.item.nombre}`
})
const statusModalQuestion = computed(() => {
  if (!estado.target.value?.item) return ''
  return `¿Desea ${isTargetActive.value ? 'deshabilitar' : 'habilitar'} ${targetTypeName.value} "${estado.target.value.item.nombre}"?`
})
const statusModalDescription = computed(() => {
  if (!estado.target.value?.item) return ''
  return `Se cambiará el estado de ${targetTypeName.value} seleccionada a ${isTargetActive.value ? 'inactiva' : 'activa'}.`
})
const statusConfirmText = computed(() => (isTargetActive.value ? 'Deshabilitar' : 'Habilitar'))

const openToggleCasitaModal = (casita) => estado.request({ type: 'casita', item: casita })
const openToggleDivisionModal = (division) => estado.request({ type: 'division', item: division })

// Confirmación de eliminación de una casita o un corral
const eliminar = useConfirmAction({
  mensajeCarga: ({ type }) => (type === 'casita' ? 'Eliminando casita...' : 'Eliminando corral...'),
  accion: ({ type, item }) => (type === 'casita' ? store.removeCasita(item.id) : store.removeDivision(item.id)),
  mensajeExito: ({ type }) => (type === 'casita' ? 'Casita eliminada correctamente.' : 'Corral eliminado correctamente.'),
  mensajeError: 'No se pudo eliminar el registro.',
  loader,
})

const deleteModalQuestion = computed(() => {
  if (!eliminar.target.value?.item) return ''
  const entidad = eliminar.target.value.type === 'casita' ? 'la casita' : 'el corral'
  return `¿Deseas eliminar ${entidad} "${eliminar.target.value.item.nombre}"?`
})
const deleteModalDescription = computed(() =>
  eliminar.target.value?.type === 'casita'
    ? 'Al confirmar la acción, los cambios no podrán revertirse. La casita solo podrá eliminarse si no contiene divisiones asociadas.'
    : 'Al confirmar la acción, los cambios no podrán revertirse.',
)

const requestDeleteCasita = (casita) => eliminar.request({ type: 'casita', item: casita })
const requestDeleteDivision = (division) => eliminar.request({ type: 'division', item: division })

// Opciones de tipo de instalación alimentadas desde catálogo ctl_tipo_instalacion
const tipoOptions = computed(() => {
  return store.tiposInstalacion.map((t) => ({
    value: t.nombre,
    label: t.nombre,
  }))
})

// Opciones de estado (Vacío por defecto en selector, sin elemento vacío en desplegable)
const estadoOptions = [
  { value: 'true', label: 'Activa' },
  { value: 'false', label: 'Inactiva' },
]

// Columnas de la tabla (DataTable la dibuja); cada celda se personaliza con su slot #cell-<key>
const columnas = [
  { key: 'nombre', label: 'Casita / Galpón', cellClass: 'text-verdoso' },
  { key: 'tipo', label: 'Tipo de instalación', cellClass: 'text-verdoso' },
  { key: 'corrales', label: 'Corrales / Divisiones' },
  { key: 'fecha', label: 'Fecha de registro', cellClass: 'text-verdoso-muted text-xs' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]

// Configuración de la barra de filtros (FilterBar la dibuja)
const filterFields = computed(() => [
  { key: 'buscar', type: 'search', label: 'Buscar' },
  { key: 'tipo', type: 'select', label: 'Tipo de instalación', options: tipoOptions.value },
  { key: 'activa', type: 'select', label: 'Estado', options: estadoOptions },
])

onMounted(async () => {
  await Promise.all([
    store.fetchGranjas(),
    store.fetchTiposInstalacion(),
    store.fetchCasitas(),
  ])
})

// Acciones de Filtro
const handleSearch = async () => {
  store.filters.page = 1
  await store.fetchCasitas()
}

const handleClear = async () => {
  await store.resetFilters()
}

// Paginación
const handlePageChange = async (page) => {
  await store.setPage(page)
}

const handlePerPageChange = async (perPage) => {
  await store.setPerPage(perPage)
}

// Ojito (Detalle de Casita y sus Corrales)
const handleViewDetail = (casita) => {
  store.setSelectedCasita(casita)
  showDetailModal.value = true
}

// Crear / Editar Casita (null = crear)
const openCreateCasita = () => {
  casitaSeleccionada.value = null
  showCasitaModal.value = true
}

const openEditCasita = (casita) => {
  casitaSeleccionada.value = casita
  showCasitaModal.value = true
}

// Agregar Corral desde la ficha de una casita
const openAddDivision = (casita) => {
  idCasitaParaDivision.value = casita.id
  showDivisionModal.value = true
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior Reutilizable (SOLID - Impeccable) -->
    <AppHeader subtitle="Instalaciones y Corrales" />

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Título Central Corporativo (#26332B) -->
      <PageHeader
        title="Gestión de casitas y corrales"
        subtitle="Administración de galpones, tipos de instalación y corrales independientes"
        align="center"
      />

      <!-- Estadísticas Reutilizables de Instalaciones (SOLID) -->
      <InstalacionesStats :stats="store.stats" />

      <!-- Barra de Filtros Reutilizable con FilterBar Component (SOLID) -->
      <FilterBar
        v-model="store.filters"
        :fields="filterFields"
        :loading="store.loading"
        action-label="Nueva casita"
        @search="handleSearch"
        @clear="handleClear"
        @action="openCreateCasita"
      />

      <!-- Tabla de Listado -->
      <DataTable
        :columns="columnas"
        :rows="store.casitas"
        :loading="store.loading"
        :meta="store.meta"
        item-label="casitas"
        empty-title="Sin resultados de casitas"
        empty-description="No se encontraron casitas o galpones con los filtros aplicados."
        empty-action-label="Limpiar filtros"
        @empty-action="handleClear"
        @update:page="handlePageChange"
        @update:per-page="handlePerPageChange"
      >
        <template #cell-nombre="{ row }">{{ row.nombre }}</template>

        <template #cell-tipo="{ row }">{{ row.tipo || 'General' }}</template>

        <template #cell-corrales="{ row }">
          <StatusBadge variant="outline">
            <Layers class="w-3.5 h-3.5 text-salvia" />
            {{ row.divisiones?.length || 0 }} {{ row.divisiones?.length === 1 ? 'corral' : 'corrales' }}
          </StatusBadge>
        </template>

        <template #cell-fecha="{ row }">{{ formatDate(row.created_at) }}</template>

        <template #cell-estado="{ row }">
          <StatusBadge
            as="button"
            :variant="row.activa ? 'success' : 'danger'"
            :title="row.activa ? 'Clic para deshabilitar' : 'Clic para habilitar'"
            @click="openToggleCasitaModal(row)"
          >
            {{ row.activa ? 'Activa' : 'Inactiva' }}
          </StatusBadge>
        </template>

        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <RowActionButton :icon="Eye" title="Ver detalle y corrales de la casita" @click="handleViewDetail(row)" />
            <RowActionButton :icon="Pencil" tone="edit" title="Editar casita" @click="openEditCasita(row)" />
            <RowActionButton :icon="Trash2" tone="danger" title="Eliminar casita" @click="requestDeleteCasita(row)" />
          </div>
        </template>
      </DataTable>
    </main>

    <!-- Ficha de la casita con sus corrales (solo presentación: emite eventos) -->
    <CasitaDetalleModal
      :is-open="showDetailModal"
      :casita="store.selectedCasita"
      @close="showDetailModal = false"
      @add-division="openAddDivision"
      @toggle-division="openToggleDivisionModal"
      @delete-division="requestDeleteDivision"
    />

    <!-- Modales de formulario (estado propio) -->
    <CasitaFormModal
      :is-open="showCasitaModal"
      :casita="casitaSeleccionada"
      @close="showCasitaModal = false"
    />

    <DivisionFormModal
      :is-open="showDivisionModal"
      :id-casita="idCasitaParaDivision"
      @close="showDivisionModal = false"
    />

    <!-- Confirmación de cambio de estado (habilitar / deshabilitar) -->
    <ConfirmStatusModal
      :is-open="estado.isOpen.value"
      :title="statusModalTitle"
      :question="statusModalQuestion"
      :description="statusModalDescription"
      :confirm-text="statusConfirmText"
      :is-destructive="isTargetActive"
      :loading="estado.loading.value"
      @confirm="estado.confirm"
      @close="estado.cancel"
    />

    <!-- Confirmación de eliminación -->
    <BaseConfirmModal
      :is-open="eliminar.isOpen.value"
      :question="deleteModalQuestion"
      :description="deleteModalDescription"
      confirm-text="Aceptar"
      cancel-text="Cancelar"
      :is-destructive="true"
      :loading="eliminar.loading.value"
      @confirm="eliminar.confirm"
      @close="eliminar.cancel"
    />

    <!-- Loader Global de Acciones con paleta corporativa Verde Bosque #244B36 / Salvia #6F9678 -->
    <ActionLoader
      :show="isSubmitting"
      :message="actionLoaderMessage"
    />
  </div>
</template>

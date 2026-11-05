<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProduccionStore } from '@/stores/produccion'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'

// Componentes comunes globales (SOLID - Impeccable)
import BaseModal from '@/components/common/BaseModal.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import StatCard from '@/components/common/StatCard.vue'
import FloatingInput from '@/components/common/FloatingInput.vue'
import FloatingSelect from '@/components/common/FloatingSelect.vue'
import FormField from '@/components/common/FormField.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'

// Iconos Lucide
import {
  Egg,
  Wheat,
  Plus,
  Pencil,
  Trash2,
  Search,
  SearchX,
  AlertCircle,
  Loader2,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const produccionStore = useProduccionStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()

// Pestaña activa ('huevos' | 'alimentacion')
const activeTab = ref('huevos')

// Configuración dinámica de filtros (permite activar/desactivar el buscador de texto libre por sección fácilmente)
const showSearchFilterHuevos = ref(false)
const showSearchFilterAlimentacion = ref(false)

// Modales y loaders
const showHuevoModal = ref(false)
const showAlimentacionModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const showActionLoader = ref(false)
const actionLoaderMessage = ref('')
const deleteTarget = ref(null) // { type: 'huevo' | 'alimentacion', id: number, label: string }

// Formulario Huevos
const defaultHuevoForm = () => ({
  id: null,
  id_division: '',
  fecha: new Date().toISOString().split('T')[0],
  cantidad_recolectada: 0,
  cantidad_rotos: 0,
  observaciones: '',
})
const huevoForm = ref(defaultHuevoForm())
const huevoErrors = ref({})

// Formulario Alimentación
const defaultAlimentacionForm = () => ({
  id: null,
  id_division: '',
  id_tipo_alimento: '',
  fecha: new Date().toISOString().split('T')[0],
  hora: new Date().toTimeString().substring(0, 5),
  cantidad: 1.0,
  unidad_medida: 'kg',
  costo_total: null,
  observaciones: '',
})
const alimentacionForm = ref(defaultAlimentacionForm())
const alimentacionErrors = ref({})

// Cálculo reactivo en vivo de huevos aprovechables
const aprovechablesCalculados = computed(() => {
  const recolectados = Number(huevoForm.value.cantidad_recolectada) || 0
  const rotos = Number(huevoForm.value.cantidad_rotos) || 0
  return Math.max(0, recolectados - rotos)
})

const esRotosInvalido = computed(() => {
  const recolectados = Number(huevoForm.value.cantidad_recolectada) || 0
  const rotos = Number(huevoForm.value.cantidad_rotos) || 0
  return rotos > recolectados
})

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

// Opciones de Divisiones para formularios (FormField select)
const formDivisionOptions = computed(() => {
  return [
    { value: '', label: 'Seleccionar corral o división...' },
    ...divisionFiltroOptions.value,
  ]
})

// Opciones de Tipos de Alimento para filtro
const tiposAlimentoFiltroOptions = computed(() => {
  return (produccionStore.tiposAlimento || []).map((t) => ({
    value: t.id,
    label: t.nombre,
  }))
})

// Opciones de Tipos de Alimento para formulario
const formTipoAlimentoOptions = computed(() => {
  return [
    { value: '', label: 'Seleccionar tipo de alimento...' },
    ...tiposAlimentoFiltroOptions.value,
  ]
})

// Opciones de Unidades de Medida
const unidadOptions = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'lb', label: 'Libras (lb)' },
  { value: 'g', label: 'Gramos (g)' },
]

onMounted(async () => {
  await Promise.allSettled([
    instalacionesStore.fetchCasitas({ per_page: 100 }),
    produccionStore.fetchTiposAlimento(),
    produccionStore.fetchHuevos(),
    produccionStore.fetchAlimentacion(),
  ])
})

// --- VALIDACIONES DE FORMULARIO HUEVOS ---
const validateHuevoForm = () => {
  huevoErrors.value = {}
  let isValid = true

  if (!huevoForm.value.id_division) {
    huevoErrors.value.id_division = 'Debe seleccionar un corral o división.'
    isValid = false
  }

  if (!huevoForm.value.fecha) {
    huevoErrors.value.fecha = 'La fecha de recolección es obligatoria.'
    isValid = false
  }

  const recolectada = Number(huevoForm.value.cantidad_recolectada)
  if (huevoForm.value.cantidad_recolectada === '' || isNaN(recolectada) || recolectada < 0) {
    huevoErrors.value.cantidad_recolectada = 'La cantidad recolectada debe ser mayor o igual a 0.'
    isValid = false
  }

  const rotos = Number(huevoForm.value.cantidad_rotos)
  if (isNaN(rotos) || rotos < 0) {
    huevoErrors.value.cantidad_rotos = 'La cantidad de huevos rotos no puede ser negativa.'
    isValid = false
  } else if (rotos > recolectada) {
    huevoErrors.value.cantidad_rotos = 'Los huevos rotos no pueden superar a los recolectados.'
    isValid = false
  }

  return isValid
}

// --- VALIDACIONES DE FORMULARIO ALIMENTACIÓN ---
const validateAlimentacionForm = () => {
  alimentacionErrors.value = {}
  let isValid = true

  if (!alimentacionForm.value.id_division) {
    alimentacionErrors.value.id_division = 'Debe seleccionar un corral o división.'
    isValid = false
  }

  if (!alimentacionForm.value.id_tipo_alimento) {
    alimentacionErrors.value.id_tipo_alimento = 'Debe seleccionar el tipo de alimento.'
    isValid = false
  }

  if (!alimentacionForm.value.fecha) {
    alimentacionErrors.value.fecha = 'La fecha de suministro es obligatoria.'
    isValid = false
  }

  const cantidad = Number(alimentacionForm.value.cantidad)
  if (alimentacionForm.value.cantidad === '' || isNaN(cantidad) || cantidad <= 0) {
    alimentacionErrors.value.cantidad = 'La cantidad suministrada debe ser mayor a 0.'
    isValid = false
  }

  if (alimentacionForm.value.costo_total !== null && alimentacionForm.value.costo_total !== '') {
    const costo = Number(alimentacionForm.value.costo_total)
    if (isNaN(costo) || costo < 0) {
      alimentacionErrors.value.costo_total = 'El costo no puede ser un valor negativo.'
      isValid = false
    }
  }

  return isValid
}

// --- ACCIONES DE HUEVOS ---
const handleSearchHuevos = () => {
  if (!showSearchFilterHuevos.value) {
    produccionStore.filtersHuevos.search = ''
  }
  produccionStore.setPageHuevos(1)
}

const handleClearHuevos = () => {
  produccionStore.resetFiltersHuevos()
}

const openCreateHuevoModal = () => {
  isEditing.value = false
  huevoForm.value = defaultHuevoForm()
  huevoErrors.value = {}
  showHuevoModal.value = true
}

const openEditHuevoModal = (huevo) => {
  isEditing.value = true
  huevoForm.value = {
    id: huevo.id,
    id_division: huevo.id_division,
    fecha: huevo.fecha ? huevo.fecha.substring(0, 10) : '',
    cantidad_recolectada: huevo.cantidad_recolectada,
    cantidad_rotos: huevo.cantidad_rotos,
    observaciones: huevo.observaciones || '',
  }
  huevoErrors.value = {}
  showHuevoModal.value = true
}

const submitHuevoForm = async () => {
  if (!validateHuevoForm()) {
    return
  }

  isSubmitting.value = true
  actionLoaderMessage.value = isEditing.value
    ? 'Actualizando registro de postura...'
    : 'Registrando postura de huevos...'
  showActionLoader.value = true

  try {
    const payload = {
      id_division: Number(huevoForm.value.id_division),
      fecha: huevoForm.value.fecha,
      cantidad_recolectada: Number(huevoForm.value.cantidad_recolectada),
      cantidad_rotos: Number(huevoForm.value.cantidad_rotos || 0),
      observaciones: huevoForm.value.observaciones?.trim() || null,
    }

    if (isEditing.value) {
      await produccionStore.updateHuevo(huevoForm.value.id, payload)
      notify.success('Registro de postura actualizado exitosamente.')
    } else {
      await produccionStore.addHuevo(payload)
      notify.success('Recolección de huevos registrada exitosamente.')
    }
    showHuevoModal.value = false
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      const errs = err.response.data.errors
      if (errs.id_division) huevoErrors.value.id_division = errs.id_division[0]
      if (errs.fecha) huevoErrors.value.fecha = errs.fecha[0]
      if (errs.cantidad_recolectada) huevoErrors.value.cantidad_recolectada = errs.cantidad_recolectada[0]
      if (errs.cantidad_rotos) huevoErrors.value.cantidad_rotos = errs.cantidad_rotos[0]
      notify.warning(err.response.data?.message || 'Error de validación al registrar postura.')
    } else {
      notify.error(err.response?.data?.message || 'Error al guardar el registro de postura.')
    }
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
}

// --- ACCIONES DE ALIMENTACIÓN ---
const handleSearchAlimentacion = () => {
  if (!showSearchFilterAlimentacion.value) {
    produccionStore.filtersAlimentacion.search = ''
  }
  produccionStore.setPageAlimentacion(1)
}

const handleClearAlimentacion = () => {
  produccionStore.resetFiltersAlimentacion()
}

const openCreateAlimentacionModal = () => {
  isEditing.value = false
  alimentacionForm.value = defaultAlimentacionForm()
  alimentacionErrors.value = {}
  showAlimentacionModal.value = true
}

const openEditAlimentacionModal = (item) => {
  isEditing.value = true
  alimentacionForm.value = {
    id: item.id,
    id_division: item.id_division,
    id_tipo_alimento: item.id_tipo_alimento,
    fecha: item.fecha ? item.fecha.substring(0, 10) : '',
    hora: item.hora ? item.hora.substring(0, 5) : '',
    cantidad: item.cantidad,
    unidad_medida: item.unidad_medida || 'kg',
    costo_total: item.costo_total,
    observaciones: item.observaciones || '',
  }
  alimentacionErrors.value = {}
  showAlimentacionModal.value = true
}

const submitAlimentacionForm = async () => {
  if (!validateAlimentacionForm()) {
    return
  }

  isSubmitting.value = true
  actionLoaderMessage.value = isEditing.value
    ? 'Actualizando registro de ración...'
    : 'Registrando suministro de alimento...'
  showActionLoader.value = true

  try {
    const payload = {
      id_division: Number(alimentacionForm.value.id_division),
      id_tipo_alimento: Number(alimentacionForm.value.id_tipo_alimento),
      fecha: alimentacionForm.value.fecha,
      hora: alimentacionForm.value.hora || null,
      cantidad: Number(alimentacionForm.value.cantidad),
      unidad_medida: alimentacionForm.value.unidad_medida || 'kg',
      costo_total: alimentacionForm.value.costo_total ? Number(alimentacionForm.value.costo_total) : null,
      observaciones: alimentacionForm.value.observaciones?.trim() || null,
    }

    if (isEditing.value) {
      await produccionStore.updateAlimentacion(alimentacionForm.value.id, payload)
      notify.success('Registro de alimentación actualizado exitosamente.')
    } else {
      await produccionStore.addAlimentacion(payload)
      notify.success('Ración de alimento registrada exitosamente.')
    }
    showAlimentacionModal.value = false
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      const errs = err.response.data.errors
      if (errs.id_division) alimentacionErrors.value.id_division = errs.id_division[0]
      if (errs.id_tipo_alimento) alimentacionErrors.value.id_tipo_alimento = errs.id_tipo_alimento[0]
      if (errs.fecha) alimentacionErrors.value.fecha = errs.fecha[0]
      if (errs.cantidad) alimentacionErrors.value.cantidad = errs.cantidad[0]
      if (errs.costo_total) alimentacionErrors.value.costo_total = errs.costo_total[0]
      notify.warning(err.response.data?.message || 'Error de validación al registrar alimentación.')
    } else {
      notify.error(err.response?.data?.message || 'Error al guardar el registro de ración.')
    }
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
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
  isSubmitting.value = true
  actionLoaderMessage.value = 'Eliminando registro...'
  showActionLoader.value = true

  try {
    if (deleteTarget.value.type === 'huevo') {
      await produccionStore.removeHuevo(deleteTarget.value.id)
      notify.success('Registro de postura eliminado correctamente.')
    } else {
      await produccionStore.removeAlimentacion(deleteTarget.value.id)
      notify.success('Registro de alimentación eliminado correctamente.')
    }
    showDeleteModal.value = false
  } catch (err) {
    notify.error('No se pudo eliminar el registro seleccionado.')
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
    deleteTarget.value = null
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior -->
    <AppHeader subtitle="Alimentación y Postura" />

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Selector de Pestañas Principal -->
      <div class="flex items-center justify-between flex-wrap gap-4 border-b border-borde pb-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">
            Control de Producción y Alimentación
          </h2>
          <p class="text-sm text-verdoso-muted mt-1">
            Registro diario de postura por corral y balance del suministro de raciones.
          </p>
        </div>

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
      </div>

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
          :loading="produccionStore.loading"
          @search="handleSearchHuevos"
          @clear="handleClearHuevos"
        >
          <div
            class="grid gap-4"
            :class="showSearchFilterHuevos ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'"
          >
            <!-- Búsqueda libre por texto (Oculto por defecto en esta sección, activable dinámicamente) -->
            <FloatingInput
              v-if="showSearchFilterHuevos"
              v-model="produccionStore.filtersHuevos.search"
              label="Buscar"
              :icon="Search"
              @enter="handleSearchHuevos"
            />
            <!-- División -->
            <FloatingSelect
              v-model="produccionStore.filtersHuevos.id_division"
              label="Corral / División"
              :options="divisionFiltroOptions"
            />
            <!-- Desde -->
            <FloatingInput
              v-model="produccionStore.filtersHuevos.fecha_inicio"
              label="Desde"
              type="date"
              @enter="handleSearchHuevos"
            />
            <!-- Hasta -->
            <FloatingInput
              v-model="produccionStore.filtersHuevos.fecha_fin"
              label="Hasta"
              type="date"
              @enter="handleSearchHuevos"
            />
          </div>

          <template #action>
            <button
              type="button"
              @click="openCreateHuevoModal"
              class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1 cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>Registrar postura</span>
            </button>
          </template>
        </FilterBar>

        <!-- Tabla de Registros de Postura -->
        <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
          <!-- Indicador de Carga Estandarizado con Imagotipo Corporativo (SOLID) -->
          <div v-if="produccionStore.loading" class="p-12 text-center flex flex-col items-center justify-center">
            <div class="relative w-14 h-14 flex items-center justify-center mb-3">
              <div class="absolute inset-0 rounded-full border-4 border-borde border-t-[#244B36] border-r-[#6F9678] animate-spin"></div>
              <GallinaIcon class="w-7 h-7 text-bosque animate-pulse select-none" />
            </div>
            <p class="text-sm font-bold text-verdoso">Consultando registros...</p>
            <p class="text-xs text-verdoso-muted mt-1">Por favor, espere un momento mientras se actualiza el listado.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-crema/60 border-b border-borde text-verdoso font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" class="px-6 py-4">Fecha</th>
                  <th scope="col" class="px-6 py-4">Ubicación / Corral</th>
                  <th scope="col" class="px-6 py-4 text-center">Recolectados</th>
                  <th scope="col" class="px-6 py-4 text-center">Rotos</th>
                  <th scope="col" class="px-6 py-4 text-center">Aprovechables</th>
                  <th scope="col" class="px-6 py-4">Observaciones</th>
                  <th scope="col" class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-borde">
                <tr
                  v-for="item in produccionStore.huevos"
                  :key="item.id"
                  class="hover:bg-crema/40 transition-colors"
                >
                  <!-- Fecha -->
                  <td class="px-6 py-4 whitespace-nowrap font-medium text-verdoso">
                    {{ item.fecha }}
                  </td>

                  <!-- Corral -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-semibold text-verdoso">
                      {{ item.division?.nombre || 'Corral' }}
                    </div>
                    <div class="text-xs text-verdoso-muted">
                      {{ item.division?.casita?.nombre || 'Casita' }}
                    </div>
                  </td>

                  <!-- Recolectados -->
                  <td class="px-6 py-4 whitespace-nowrap text-center font-semibold text-verdoso">
                    {{ item.cantidad_recolectada }}
                  </td>

                  <!-- Rotos -->
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span
                      v-if="item.cantidad_rotos > 0"
                      class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                    >
                      {{ item.cantidad_rotos }} rotos
                    </span>
                    <span v-else class="text-xs text-verdoso-muted">0</span>
                  </td>

                  <!-- Aprovechables -->
                  <td class="px-6 py-4 whitespace-nowrap text-center">
                    <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-bosque-50 text-bosque border border-bosque/20">
                      {{ item.cantidad_aprovechables }} sanos
                    </span>
                  </td>

                  <!-- Observaciones -->
                  <td class="px-6 py-4 text-xs text-verdoso-muted max-w-xs truncate">
                    {{ item.observaciones || '—' }}
                  </td>

                  <!-- Acciones -->
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        @click="openEditHuevoModal(item)"
                        class="p-1.5 text-verdoso-muted hover:text-bosque hover:bg-crema rounded-lg transition-colors cursor-pointer"
                        title="Editar registro"
                      >
                        <Pencil class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="confirmDelete('huevo', item)"
                        class="p-1.5 text-verdoso-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar registro"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Estado Vacío -->
                <tr v-if="produccionStore.huevos.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center text-verdoso-muted">
                    <div class="max-w-xs mx-auto space-y-2">
                      <SearchX class="w-8 h-8 text-salvia mx-auto" />
                      <p class="font-medium text-verdoso">No hay registros de postura</p>
                      <p class="text-xs">No se encontraron recolecciones de huevos con los filtros seleccionados.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginador -->
          <PaginationBar
            :current-page="produccionStore.metaHuevos.current_page"
            :last-page="produccionStore.metaHuevos.last_page"
            :per-page="produccionStore.metaHuevos.per_page"
            :total="produccionStore.metaHuevos.total"
            item-label="recolecciones"
            @update:page="produccionStore.setPageHuevos"
            @update:per-page="produccionStore.setPerPageHuevos"
          />
        </div>
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
            :value="'$' + (Number(produccionStore.statsAlimentacion.total_costo || 0).toFixed(2))"
          />
          <StatCard
            title="Total Raciones Registradas"
            :value="produccionStore.statsAlimentacion.total_registros || 0"
          />
        </div>

        <!-- Filtros Alimentación Reutilizables (SOLID - Estándar Idéntico) -->
        <FilterBar
          :loading="produccionStore.loading"
          @search="handleSearchAlimentacion"
          @clear="handleClearAlimentacion"
        >
          <div
            class="grid gap-3"
            :class="showSearchFilterAlimentacion ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'"
          >
            <!-- Búsqueda libre por texto (Oculto por defecto en esta sección, activable dinámicamente) -->
            <FloatingInput
              v-if="showSearchFilterAlimentacion"
              v-model="produccionStore.filtersAlimentacion.search"
              label="Buscar"
              :icon="Search"
              @enter="handleSearchAlimentacion"
            />
            <FloatingSelect
              v-model="produccionStore.filtersAlimentacion.id_division"
              label="Corral / División"
              :options="divisionFiltroOptions"
            />
            <FloatingSelect
              v-model="produccionStore.filtersAlimentacion.id_tipo_alimento"
              label="Tipo de Alimento"
              :options="tiposAlimentoFiltroOptions"
            />
            <FloatingInput
              v-model="produccionStore.filtersAlimentacion.fecha_inicio"
              label="Desde"
              type="date"
              @enter="handleSearchAlimentacion"
            />
            <FloatingInput
              v-model="produccionStore.filtersAlimentacion.fecha_fin"
              label="Hasta"
              type="date"
              @enter="handleSearchAlimentacion"
            />
          </div>

          <template #action>
            <button
              type="button"
              @click="openCreateAlimentacionModal"
              class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1 cursor-pointer"
            >
              <Plus class="w-4 h-4" />
              <span>Registrar ración</span>
            </button>
          </template>
        </FilterBar>

        <!-- Tabla de Registros de Alimentación -->
        <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
          <!-- Indicador de Carga Estandarizado con Imagotipo Corporativo (SOLID) -->
          <div v-if="produccionStore.loading" class="p-12 text-center flex flex-col items-center justify-center">
            <div class="relative w-14 h-14 flex items-center justify-center mb-3">
              <div class="absolute inset-0 rounded-full border-4 border-borde border-t-[#244B36] border-r-[#6F9678] animate-spin"></div>
              <GallinaIcon class="w-7 h-7 text-bosque animate-pulse select-none" />
            </div>
            <p class="text-sm font-bold text-verdoso">Consultando registros...</p>
            <p class="text-xs text-verdoso-muted mt-1">Por favor, espere un momento mientras se actualiza el listado.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-crema/60 border-b border-borde text-verdoso font-bold text-xs uppercase tracking-wider">
                <tr>
                  <th scope="col" class="px-6 py-4">Fecha y Hora</th>
                  <th scope="col" class="px-6 py-4">Corral / División</th>
                  <th scope="col" class="px-6 py-4">Tipo de Alimento</th>
                  <th scope="col" class="px-6 py-4 text-center">Cantidad Suministrada</th>
                  <th scope="col" class="px-6 py-4 text-center">Costo</th>
                  <th scope="col" class="px-6 py-4">Observaciones</th>
                  <th scope="col" class="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-borde">
                <tr
                  v-for="item in produccionStore.alimentacion"
                  :key="item.id"
                  class="hover:bg-crema/40 transition-colors"
                >
                  <!-- Fecha / Hora -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-medium text-verdoso">{{ item.fecha }}</div>
                    <div v-if="item.hora" class="text-xs text-verdoso-muted">{{ item.hora }}</div>
                  </td>

                  <!-- Corral -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="font-semibold text-verdoso">
                      {{ item.division?.nombre || 'Corral' }}
                    </div>
                    <div class="text-xs text-verdoso-muted">
                      {{ item.division?.casita?.nombre || 'Casita' }}
                    </div>
                  </td>

                  <!-- Tipo de Alimento -->
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-crema text-verdoso border border-borde">
                      {{ item.tipo_alimento?.nombre || 'Alimento' }}
                    </span>
                  </td>

                  <!-- Cantidad -->
                  <td class="px-6 py-4 whitespace-nowrap text-center font-bold text-bosque">
                    {{ item.cantidad }} {{ item.unidad_medida }}
                  </td>

                  <!-- Costo -->
                  <td class="px-6 py-4 whitespace-nowrap text-center text-xs text-verdoso-muted">
                    {{ item.costo_total ? '$' + Number(item.costo_total).toFixed(2) : '—' }}
                  </td>

                  <!-- Observaciones -->
                  <td class="px-6 py-4 text-xs text-verdoso-muted max-w-xs truncate">
                    {{ item.observaciones || '—' }}
                  </td>

                  <!-- Acciones -->
                  <td class="px-6 py-4 whitespace-nowrap text-right">
                    <div class="inline-flex items-center gap-1">
                      <button
                        type="button"
                        @click="openEditAlimentacionModal(item)"
                        class="p-1.5 text-verdoso-muted hover:text-bosque hover:bg-crema rounded-lg transition-colors cursor-pointer"
                        title="Editar ración"
                      >
                        <Pencil class="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        @click="confirmDelete('alimentacion', item)"
                        class="p-1.5 text-verdoso-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Eliminar ración"
                      >
                        <Trash2 class="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>

                <!-- Estado Vacío -->
                <tr v-if="produccionStore.alimentacion.length === 0">
                  <td colspan="7" class="px-6 py-12 text-center text-verdoso-muted">
                    <div class="max-w-xs mx-auto space-y-2">
                      <SearchX class="w-8 h-8 text-salvia mx-auto" />
                      <p class="font-medium text-verdoso">No hay registros de alimentación</p>
                      <p class="text-xs">No se encontraron raciones registradas para el filtro indicado.</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Paginador -->
          <PaginationBar
            :current-page="produccionStore.metaAlimentacion.current_page"
            :last-page="produccionStore.metaAlimentacion.last_page"
            :per-page="produccionStore.metaAlimentacion.per_page"
            :total="produccionStore.metaAlimentacion.total"
            item-label="raciones"
            @update:page="produccionStore.setPageAlimentacion"
            @update:per-page="produccionStore.setPerPageAlimentacion"
          />
        </div>
      </div>
    </main>

    <!-- ========================================== -->
    <!-- MODAL: REGISTRO / EDICIÓN DE POSTURA HUEVOS -->
    <!-- ========================================== -->
    <BaseModal
      :is-open="showHuevoModal"
      :title="isEditing ? 'Editar Registro de Postura' : 'Registrar Recolección de Huevos'"
      max-width="md"
      @close="showHuevoModal = false"
    >
      <form id="huevo-form" @submit.prevent="submitHuevoForm" class="space-y-4" novalidate>
        <!-- División -->
        <FormField
          id="huevo-division"
          v-model="huevoForm.id_division"
          type="select"
          label="Corral / División"
          required
          :options="formDivisionOptions"
          :error="huevoErrors.id_division"
          :disabled="isSubmitting"
          @input="huevoErrors.id_division = ''"
        />

        <!-- Fecha -->
        <FormField
          id="huevo-fecha"
          v-model="huevoForm.fecha"
          type="date"
          label="Fecha de Recolección"
          required
          :error="huevoErrors.fecha"
          :disabled="isSubmitting"
          @input="huevoErrors.fecha = ''"
        />

        <!-- Cantidades (Recolectados y Rotos) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="huevo-recolectada"
            v-model="huevoForm.cantidad_recolectada"
            type="number"
            label="Huevos Recolectados"
            placeholder="0"
            required
            :error="huevoErrors.cantidad_recolectada"
            :disabled="isSubmitting"
            @input="huevoErrors.cantidad_recolectada = ''"
          />

          <FormField
            id="huevo-rotos"
            v-model="huevoForm.cantidad_rotos"
            type="number"
            label="Huevos Rotos / Mermas"
            placeholder="0"
            :error="huevoErrors.cantidad_rotos"
            :disabled="isSubmitting"
            @input="huevoErrors.cantidad_rotos = ''"
          />
        </div>

        <!-- Banner reactivo de cálculo de aprovechables (Impeccable feedback) -->
        <div class="p-3.5 rounded-xl bg-bosque-50 border border-bosque/20 flex items-center justify-between text-sm">
          <span class="font-medium text-verdoso">Huevos Aprovechables (Calculado):</span>
          <span class="text-base font-extrabold text-bosque">{{ aprovechablesCalculados }} unidades</span>
        </div>

        <!-- Alerta de inconsistencia si rotos > recolectados -->
        <div
          v-if="esRotosInvalido"
          class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-red-600" />
          <span>La cantidad de huevos rotos no puede ser mayor al total recolectado.</span>
        </div>

        <!-- Observaciones -->
        <FormField
          id="huevo-observaciones"
          v-model="huevoForm.observaciones"
          type="textarea"
          label="Observaciones (Opcional)"
          placeholder="Ej. Postura matutina, cáscara limpia, nidos con viruta..."
          :rows="2"
          :disabled="isSubmitting"
        />
      </form>

      <template #footer>
        <button
          type="button"
          @click="showHuevoModal = false"
          :disabled="isSubmitting"
          class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="submitHuevoForm"
          :disabled="isSubmitting || esRotosInvalido"
          class="px-5 py-2 btn-principal text-sm cursor-pointer"
        >
          {{ isEditing ? 'Guardar Cambios' : 'Registrar Postura' }}
        </button>
      </template>
    </BaseModal>

    <!-- ============================================== -->
    <!-- MODAL: REGISTRO / EDICIÓN DE ALIMENTACIÓN      -->
    <!-- ============================================== -->
    <BaseModal
      :is-open="showAlimentacionModal"
      :title="isEditing ? 'Editar Ración de Alimento' : 'Registrar Suministro de Ración'"
      max-width="md"
      @close="showAlimentacionModal = false"
    >
      <form id="alimentacion-form" @submit.prevent="submitAlimentacionForm" class="space-y-4" novalidate>
        <!-- División -->
        <FormField
          id="alim-division"
          v-model="alimentacionForm.id_division"
          type="select"
          label="Corral / División"
          required
          :options="formDivisionOptions"
          :error="alimentacionErrors.id_division"
          :disabled="isSubmitting"
          @input="alimentacionErrors.id_division = ''"
        />

        <!-- Tipo de Alimento -->
        <FormField
          id="alim-tipo"
          v-model="alimentacionForm.id_tipo_alimento"
          type="select"
          label="Fórmula / Tipo de Alimento"
          required
          :options="formTipoAlimentoOptions"
          :error="alimentacionErrors.id_tipo_alimento"
          :disabled="isSubmitting"
          @input="alimentacionErrors.id_tipo_alimento = ''"
        />

        <!-- Fecha y Hora -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="alim-fecha"
            v-model="alimentacionForm.fecha"
            type="date"
            label="Fecha"
            required
            :error="alimentacionErrors.fecha"
            :disabled="isSubmitting"
            @input="alimentacionErrors.fecha = ''"
          />

          <FormField
            id="alim-hora"
            v-model="alimentacionForm.hora"
            type="time"
            label="Hora de Suministro"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Cantidad y Unidad -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            id="alim-cantidad"
            v-model="alimentacionForm.cantidad"
            type="number"
            label="Cantidad Suministrada"
            placeholder="1.0"
            required
            :error="alimentacionErrors.cantidad"
            :disabled="isSubmitting"
            @input="alimentacionErrors.cantidad = ''"
          />

          <FormField
            id="alim-unidad"
            v-model="alimentacionForm.unidad_medida"
            type="select"
            label="Unidad de Medida"
            :options="unidadOptions"
            :disabled="isSubmitting"
          />
        </div>

        <!-- Costo Estimado -->
        <FormField
          id="alim-costo"
          v-model="alimentacionForm.costo_total"
          type="number"
          label="Costo Estimado ($)"
          placeholder="0.00"
          :error="alimentacionErrors.costo_total"
          :disabled="isSubmitting"
          @input="alimentacionErrors.costo_total = ''"
        />

        <!-- Observaciones -->
        <FormField
          id="alim-observaciones"
          v-model="alimentacionForm.observaciones"
          type="textarea"
          label="Observaciones (Opcional)"
          placeholder="Ej. Ración matutina, apetito normal..."
          :rows="2"
          :disabled="isSubmitting"
        />
      </form>

      <template #footer>
        <button
          type="button"
          @click="showAlimentacionModal = false"
          :disabled="isSubmitting"
          class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="submitAlimentacionForm"
          :disabled="isSubmitting"
          class="px-5 py-2 btn-principal text-sm cursor-pointer"
        >
          {{ isEditing ? 'Guardar Cambios' : 'Registrar Ración' }}
        </button>
      </template>
    </BaseModal>

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
      :show="showActionLoader"
      :message="actionLoaderMessage"
    />
  </div>
</template>

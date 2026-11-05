<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'

// Componentes comunes globales (SOLID)
import BaseModal from '@/components/common/BaseModal.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ConfirmStatusModal from '@/components/common/ConfirmStatusModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import StatCard from '@/components/common/StatCard.vue'
import FloatingInput from '@/components/common/FloatingInput.vue'
import FloatingSelect from '@/components/common/FloatingSelect.vue'
import FormField from '@/components/common/FormField.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import InstalacionesStats from '@/components/instalaciones/InstalacionesStats.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'

// Iconos
import {
  Home,
  Layers,
  Plus,
  CheckCircle2,
  XCircle,
  LogOut,
  User,
  LayoutDashboard,
  Building,
  Loader2,
  Search,
  Eye,
  Pencil,
  Trash2,
  SearchX,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const store = useInstalacionesStore()
const notify = useNotificationStore()

// Modales
const showDetailModal = ref(false)
const showCasitaModal = ref(false)
const showDivisionModal = ref(false)
const isEditingCasita = ref(false)
const isSubmitting = ref(false)

// Modal de Confirmación de Estado Dinámico (Habilitar / Deshabilitar)
const showStatusModal = ref(false)
const statusTarget = ref(null) // { type: 'casita' | 'division', item: object }
const isStatusLoading = ref(false)

// Modal de Confirmación de Eliminación (SOLID)
const showDeleteModal = ref(false)
const deleteTarget = ref(null) // { type: 'casita' | 'division', item: object }
const isDeleteLoading = ref(false)

// Loader Global de Acciones (Colores corporativos Verde Bosque / Salvia)
const showActionLoader = ref(false)
const actionLoaderMessage = ref('Procesando acción...')

// Computadas para Modal Dinámico de Estado
const isTargetActive = computed(() => Boolean(statusTarget.value?.item?.activa))
const targetTypeLabel = computed(() => statusTarget.value?.type === 'casita' ? 'casita' : 'corral')
const targetTypeName = computed(() => statusTarget.value?.type === 'casita' ? 'la casita' : 'el corral')

const statusModalTitle = computed(() => {
  if (!statusTarget.value?.item) return ''
  const action = isTargetActive.value ? 'Deshabilitar' : 'Habilitar'
  return `${action} ${targetTypeLabel.value}: ${statusTarget.value.item.nombre}`
})

const statusModalQuestion = computed(() => {
  if (!statusTarget.value?.item) return ''
  const action = isTargetActive.value ? 'deshabilitar' : 'habilitar'
  return `¿Desea ${action} ${targetTypeName.value} "${statusTarget.value.item.nombre}"?`
})

const statusModalDescription = computed(() => {
  if (!statusTarget.value?.item) return ''
  const newStatus = isTargetActive.value ? 'inactiva' : 'activa'
  return `Se cambiará el estado de ${targetTypeName.value} seleccionada a ${newStatus}.`
})

const statusConfirmText = computed(() => (isTargetActive.value ? 'Deshabilitar' : 'Habilitar'))
const statusIsDestructive = computed(() => isTargetActive.value)

const openToggleCasitaModal = (casita) => {
  statusTarget.value = { type: 'casita', item: casita }
  showStatusModal.value = true
}

const openToggleDivisionModal = (division) => {
  statusTarget.value = { type: 'division', item: division }
  showStatusModal.value = true
}

// Computadas y acciones para Eliminación
const deleteModalQuestion = computed(() => {
  if (!deleteTarget.value?.item) return ''
  const entity = deleteTarget.value.type === 'casita' ? 'la casita' : 'el corral'
  return `¿Deseas eliminar ${entity} "${deleteTarget.value.item.nombre}"?`
})

const deleteModalDescription = computed(() => {
  if (deleteTarget.value?.type === 'casita') {
    return 'Al confirmar la acción, los cambios no podrán revertirse. La casita solo podrá eliminarse si no contiene divisiones asociadas.'
  }
  return 'Al confirmar la acción, los cambios no podrán revertirse.'
})

const requestDeleteCasita = (casita) => {
  deleteTarget.value = { type: 'casita', item: casita }
  showDeleteModal.value = true
}

const requestDeleteDivision = (division) => {
  deleteTarget.value = { type: 'division', item: division }
  showDeleteModal.value = true
}

const handleConfirmDelete = async () => {
  if (!deleteTarget.value?.item) return
  isDeleteLoading.value = true
  actionLoaderMessage.value = deleteTarget.value.type === 'casita'
    ? 'Eliminando casita...'
    : 'Eliminando corral...'
  showActionLoader.value = true

  try {
    if (deleteTarget.value.type === 'casita') {
      await store.removeCasita(deleteTarget.value.item.id)
      notify.success('Casita eliminada correctamente.')
    } else {
      await store.removeDivision(deleteTarget.value.item.id)
      notify.success('Corral eliminado correctamente.')
    }
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error al eliminar:', err)
    const msg = err.response?.data?.message || 'No se pudo eliminar el registro.'
    if (err.response?.status === 422) {
      notify.warning(msg)
    } else {
      notify.error(msg)
    }
  } finally {
    isDeleteLoading.value = false
    showActionLoader.value = false
  }
}

const handleConfirmStatus = async () => {
  if (!statusTarget.value?.item) return
  isStatusLoading.value = true
  actionLoaderMessage.value = isTargetActive.value
    ? `Deshabilitando ${targetTypeLabel.value}...`
    : `Habilitando ${targetTypeLabel.value}...`
  showActionLoader.value = true

  try {
    if (statusTarget.value.type === 'casita') {
      await store.toggleCasita(statusTarget.value.item.id)
    } else {
      await store.toggleDivision(statusTarget.value.item.id)
    }
    notify.success(isTargetActive.value ? 'Instalación deshabilitada correctamente.' : 'Instalación habilitada correctamente.')
    showStatusModal.value = false
  } catch (err) {
    console.error('Error al cambiar estado:', err)
    const msg = err.response?.data?.message || 'Error al cambiar estado de la instalación.'
    if (err.response?.status === 422) {
      notify.warning(msg)
    } else {
      notify.error(msg)
    }
  } finally {
    isStatusLoading.value = false
    showActionLoader.value = false
  }
}

// Formularios
const casitaForm = ref({
  id: null,
  id_granja: 1,
  nombre: '',
  tipo: 'Gallinero',
  descripcion: '',
})

const casitaErrors = ref({
  nombre: '',
})

const divisionForm = ref({
  id_casita: null,
  nombre: '',
  descripcion: '',
})

const divisionErrors = ref({
  nombre: '',
})

// Opciones de tipo de instalación alimentadas desde catálogo ctl_tipo_instalacion
const tipoOptions = computed(() => {
  return store.tiposInstalacion.map((t) => ({
    value: t.nombre,
    label: t.nombre,
  }))
})

const formTipoOptions = computed(() => {
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

onMounted(async () => {
  await Promise.all([
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

// Crear / Editar Casita
const openCreateCasita = () => {
  isEditingCasita.value = false
  casitaErrors.value = { nombre: '' }
  casitaForm.value = {
    id: null,
    id_granja: 1,
    nombre: '',
    tipo: 'Gallinero',
    descripcion: '',
  }
  showCasitaModal.value = true
}

const openEditCasita = (casita) => {
  isEditingCasita.value = true
  casitaErrors.value = { nombre: '' }
  casitaForm.value = {
    id: casita.id,
    id_granja: casita.id_granja || 1,
    nombre: casita.nombre,
    tipo: casita.tipo,
    descripcion: casita.descripcion || '',
  }
  showCasitaModal.value = true
}

const handleSubmitCasita = async () => {
  casitaErrors.value.nombre = ''
  if (!casitaForm.value.nombre || !casitaForm.value.nombre.trim()) {
    casitaErrors.value.nombre = 'El nombre de la casita es obligatorio'
    return
  }

  isSubmitting.value = true
  actionLoaderMessage.value = isEditingCasita.value ? 'Guardando cambios en la casita...' : 'Creando nueva casita...'
  showActionLoader.value = true

  try {
    if (isEditingCasita.value) {
      await store.updateCasita(casitaForm.value.id, {
        nombre: casitaForm.value.nombre.trim(),
        tipo: casitaForm.value.tipo,
        descripcion: casitaForm.value.descripcion || '',
      })
      notify.success('Casita actualizada exitosamente.')
    } else {
      await store.addCasita({
        id_granja: casitaForm.value.id_granja || 1,
        nombre: casitaForm.value.nombre.trim(),
        tipo: casitaForm.value.tipo,
        descripcion: casitaForm.value.descripcion || '',
      })
      notify.success('Casita creada exitosamente.')
    }
    showCasitaModal.value = false
  } catch (err) {
    console.error('Error al guardar la casita:', err)
    const msg = err.response?.data?.message || 'Error al guardar la casita.'
    if (err.response?.status === 422) {
      if (err.response?.data?.errors?.nombre) {
        casitaErrors.value.nombre = err.response.data.errors.nombre[0]
      }
      notify.warning(msg)
    } else {
      notify.error(msg)
    }
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
}

// Agregar Corral / División
const openAddDivision = (idCasita) => {
  divisionErrors.value = { nombre: '' }
  divisionForm.value = {
    id_casita: idCasita,
    nombre: '',
    descripcion: '',
  }
  showDivisionModal.value = true
}

const handleSubmitDivision = async () => {
  divisionErrors.value.nombre = ''
  if (!divisionForm.value.nombre || !divisionForm.value.nombre.trim()) {
    divisionErrors.value.nombre = 'El nombre del corral es obligatorio'
    return
  }

  isSubmitting.value = true
  actionLoaderMessage.value = 'Guardando nuevo corral...'
  showActionLoader.value = true

  try {
    await store.addDivision({
      id_casita: divisionForm.value.id_casita,
      nombre: divisionForm.value.nombre.trim(),
      descripcion: divisionForm.value.descripcion || '',
    })
    notify.success('Corral agregado exitosamente.')
    showDivisionModal.value = false
  } catch (err) {
    console.error('Error al guardar corral:', err)
    const msg = err.response?.data?.message || 'Error al guardar el corral.'
    if (err.response?.status === 422) {
      if (err.response?.data?.errors?.nombre) {
        divisionErrors.value.nombre = err.response.data.errors.nombre[0]
      }
      notify.warning(msg)
    } else {
      notify.error(msg)
    }
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
}

// Formateo de fecha
const formatDate = (isoString) => {
  if (!isoString) return '24/01/2026'
  const date = new Date(isoString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior Reutilizable (SOLID - Impeccable) -->
    <AppHeader subtitle="Instalaciones y Corrales" />

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Título Central Corporativo (#26332B) -->
      <div class="text-center pt-2 pb-1">
        <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">
          Gestión de casitas y corrales
        </h2>
        <p class="text-xs sm:text-sm text-verdoso-muted mt-1">
          Administración de galpones, tipos de instalación y corrales independientes
        </p>
      </div>

      <!-- Estadísticas Reutilizables de Instalaciones (SOLID) -->
      <InstalacionesStats :stats="store.stats" />

      <!-- Barra de Filtros Reutilizable con FilterBar Component (SOLID) -->
      <FilterBar
        :loading="store.loading"
        @search="handleSearch"
        @clear="handleClear"
      >
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Buscar (configurable con prop placeholder, en blanco por defecto) -->
          <FloatingInput
            v-model="store.filters.buscar"
            label="Buscar"
            :icon="Search"
            @enter="handleSearch"
          />

          <!-- Tipo de Instalación -->
          <FloatingSelect
            v-model="store.filters.tipo"
            label="Tipo de instalación"
            :options="tipoOptions"
          />

          <!-- Estado -->
          <FloatingSelect
            v-model="store.filters.activa"
            label="Estado"
            :options="estadoOptions"
          />
        </div>

        <template #action>
          <button
            @click="openCreateCasita"
            class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1"
          >
            <Plus class="w-4 h-4" />
            <span>Nueva casita</span>
          </button>
        </template>
      </FilterBar>

      <!-- Tabla de Listado -->
      <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
        <!-- Indicador de Carga Estandarizado con Imagotipo Corporativo GallinaIcon -->
        <div v-if="store.loading" class="p-12 text-center flex flex-col items-center justify-center">
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
                <th scope="col" class="px-6 py-4">Casita / Galpón</th>
                <th scope="col" class="px-6 py-4">Tipo de instalación</th>
                <th scope="col" class="px-6 py-4">Corrales / Divisiones</th>
                <th scope="col" class="px-6 py-4">Fecha de registro</th>
                <th scope="col" class="px-6 py-4 text-center">Estado</th>
                <th scope="col" class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde/70">
              <!-- Estado vacío mejorado (Empty State - Impeccable) -->
              <tr
                v-if="store.casitas.length === 0"
                class="hover:bg-crema/40 transition-colors"
              >
                <td colspan="6" class="px-6 py-14 text-center">
                  <div class="max-w-xs mx-auto flex flex-col items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-salvia-50 flex items-center justify-center text-salvia border border-borde">
                      <SearchX class="w-6 h-6" />
                    </div>
                    <div class="space-y-1">
                      <p class="text-sm font-bold text-verdoso">Sin resultados de casitas</p>
                      <p class="text-xs text-verdoso-muted">No se encontraron casitas o galpones con los filtros aplicados.</p>
                    </div>
                    <button
                      type="button"
                      @click="handleClear"
                      class="mt-1 px-4 py-1.5 text-xs font-semibold text-bosque bg-salvia-50 hover:bg-salvia-100 rounded-full border border-salvia/40 transition-colors cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                </td>
              </tr>

              <tr
                v-for="casita in store.casitas"
                :key="casita.id"
                class="hover:bg-crema/30 transition-colors"
              >
                <!-- Nombre de Casita (Solo nombre, sin leyenda secundaria) -->
                <td class="px-6 py-4">
                  <div class="font-bold text-verdoso">{{ casita.nombre }}</div>
                </td>

                <!-- Tipo -->
                <td class="px-6 py-4 text-verdoso font-medium">
                  {{ casita.tipo || 'General' }}
                </td>

                <!-- Cantidad de Corrales -->
                <td class="px-6 py-4">
                  <span class="inline-flex items-center gap-1.5 text-xs font-semibold text-verdoso bg-crema px-2.5 py-1 rounded-full border border-borde">
                    <Layers class="w-3.5 h-3.5 text-salvia" />
                    {{ casita.divisiones?.length || 0 }} {{ casita.divisiones?.length === 1 ? 'corral' : 'corrales' }}
                  </span>
                </td>

                <!-- Fecha de Registro -->
                <td class="px-6 py-4 text-verdoso-muted text-xs">
                  {{ formatDate(casita.created_at) }}
                </td>

                <!-- Estado (Verde suave / Rojo suave con border semántico) -->
                <td class="px-6 py-4 text-center">
                  <button
                    @click="openToggleCasitaModal(casita)"
                    :title="casita.activa ? 'Clic para deshabilitar' : 'Clic para habilitar'"
                    :class="[
                      'inline-block px-3 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border',
                      casita.activa
                        ? 'bg-bosque-50 text-bosque border-bosque/20 hover:bg-bosque-100'
                        : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                    ]"
                  >
                    {{ casita.activa ? 'Activa' : 'Inactiva' }}
                  </button>
                </td>

                <!-- Acciones (Ojito 👁️, Lápiz ✏️, Basura 🗑️) con aria-label y toque ergonómico -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5 text-salvia">
                    <!-- Ojito: Ver Detalle y Divisiones -->
                    <button
                      @click="handleViewDetail(casita)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-bosque hover:bg-salvia-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver detalle y corrales"
                      aria-label="Ver detalle y corrales de la casita"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <!-- Lápiz: Editar Casita -->
                    <button
                      @click="openEditCasita(casita)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-tierra hover:bg-tierra-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar casita"
                      aria-label="Editar casita"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>

                    <!-- Basurero: Eliminar Casita -->
                    <button
                      @click="requestDeleteCasita(casita)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar casita"
                      aria-label="Eliminar casita"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Barra de Paginación Reutilizable (PaginationBar - SOLID) -->
        <PaginationBar
          :current-page="store.meta.current_page"
          :last-page="store.meta.last_page"
          :per-page="store.meta.per_page"
          :total="store.meta.total"
          item-label="casitas"
          @update:page="handlePageChange"
          @update:per-page="handlePerPageChange"
        />
      </div>
    </main>

    <!-- Modal Detalle (El Ojito 👁️) Usando BaseModal Reutilizable -->
    <BaseModal
      :is-open="showDetailModal && !!store.selectedCasita"
      max-width="2xl"
      @close="showDetailModal = false"
    >
      <template #header>
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-salvia/20 text-bosque">
              {{ store.selectedCasita?.tipo || 'Galpón' }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                store.selectedCasita?.activa ? 'bg-[#DDF3E3] text-bosque' : 'bg-[#FEE2E2] text-red-800'
              ]"
            >
              {{ store.selectedCasita?.activa ? 'Activa' : 'Inactiva' }}
            </span>
          </div>
          <h3 class="text-xl font-bold text-verdoso mt-1">
            {{ store.selectedCasita?.nombre }}
          </h3>
          <p class="text-xs text-verdoso-muted mt-0.5">
            {{ store.selectedCasita?.descripcion || 'Sin descripción detallada' }}
          </p>
        </div>
      </template>

      <!-- Listado de Divisiones / Corrales -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-salvia uppercase tracking-wider">
            Corrales y Divisiones Asociadas ({{ store.selectedCasita?.divisiones?.length || 0 }})
          </h4>
          <button
            @click="openAddDivision(store.selectedCasita.id)"
            class="px-3 py-1.5 btn-principal text-xs flex items-center gap-1"
          >
            <Plus class="w-3.5 h-3.5" /> Agregar Corral
          </button>
        </div>

        <div
          v-if="!store.selectedCasita?.divisiones || store.selectedCasita?.divisiones.length === 0"
          class="p-8 text-center text-verdoso-muted italic bg-crema rounded-xl border border-dashed border-borde text-xs"
        >
          No hay corrales registrados en esta casita. Puedes agregar el primero con el botón superior.
        </div>

        <div
          v-for="div in store.selectedCasita?.divisiones"
          :key="div.id"
          class="p-4 rounded-xl border border-borde bg-white hover:border-salvia transition-all flex items-center justify-between gap-4 shadow-2xs"
        >
          <div>
            <div class="flex items-center gap-2">
              <p class="text-sm font-bold text-verdoso">{{ div.nombre }}</p>
              <span class="text-xs text-salvia font-mono">#{{ div.id }}</span>
            </div>
            <p class="text-xs text-verdoso-muted mt-1">
              {{ div.descripcion || 'Espacio físico asignado para albergue de aves' }}
            </p>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click="openToggleDivisionModal(div)"
              :class="[
                'px-3 py-1 text-xs font-semibold rounded-full transition-colors flex items-center gap-1 cursor-pointer',
                div.activa
                  ? 'bg-[#DDF3E3] text-bosque hover:bg-[#cbeed4]'
                  : 'bg-crema text-verdoso-muted hover:bg-borde'
              ]"
              :title="div.activa ? 'Clic para deshabilitar corral' : 'Clic para habilitar corral'"
            >
              <component :is="div.activa ? CheckCircle2 : XCircle" class="w-3.5 h-3.5" />
              <span>{{ div.activa ? 'Habilitado' : 'Inactivo' }}</span>
            </button>

            <button
              @click="requestDeleteDivision(div)"
              class="p-1.5 text-salvia hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar división"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <!-- Footer centrado -->
      <template #footer>
        <button
          type="button"
          @click="showDetailModal = false"
          class="px-6 py-2 btn-secundario text-sm"
        >
          Cerrar
        </button>
      </template>
    </BaseModal>

    <!-- Modal: Crear / Editar Casita (BaseModal con botones centrados) -->
    <BaseModal
      :is-open="showCasitaModal"
      :title="isEditingCasita ? 'Editar Casita' : 'Crear Nueva Casita'"
      max-width="md"
      @close="showCasitaModal = false"
    >
      <form id="casita-form" @submit.prevent="handleSubmitCasita" class="space-y-4" novalidate>
        <FormField
          id="casita-nombre"
          v-model="casitaForm.nombre"
          label="Nombre de la Casita"
          placeholder="Ej. Casita 4"
          required
          :error="casitaErrors.nombre"
          @input="casitaErrors.nombre = ''"
        />

        <FormField
          id="casita-tipo"
          v-model="casitaForm.tipo"
          type="select"
          label="Tipo de Instalación"
          :options="formTipoOptions"
        />

        <FormField
          id="casita-descripcion"
          v-model="casitaForm.descripcion"
          type="textarea"
          label="Descripción"
          placeholder="Detalles constructivos, ubicación física..."
          :rows="3"
        />
      </form>

      <!-- Botones del modal CENTRADOS (SOLID) -->
      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            @click="showCasitaModal = false"
            class="px-6 py-2 btn-secundario text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleSubmitCasita"
            :disabled="isSubmitting"
            class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>{{ isEditingCasita ? 'Guardar Cambios' : 'Crear Casita' }}</span>
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal: Nueva División (Dentro de una Casita) -->
    <BaseModal
      :is-open="showDivisionModal"
      title="Agregar Corral a la Casita"
      max-width="md"
      @close="showDivisionModal = false"
    >
      <form id="division-form" @submit.prevent="handleSubmitDivision" class="space-y-4" novalidate>
        <FormField
          id="division-nombre"
          v-model="divisionForm.nombre"
          label="Nombre del Corral"
          placeholder="Ej. División 3 o Espacio Cuarentena"
          required
          :error="divisionErrors.nombre"
          @input="divisionErrors.nombre = ''"
        />

        <FormField
          id="division-descripcion"
          v-model="divisionForm.descripcion"
          type="textarea"
          label="Descripción"
          placeholder="Especies admitidas, condiciones físicas..."
          :rows="3"
        />
      </form>

      <!-- Botones del modal CENTRADOS (SOLID) -->
      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            @click="showDivisionModal = false"
            class="px-6 py-2 btn-secundario text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleSubmitDivision"
            :disabled="isSubmitting"
            class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>Guardar Corral</span>
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- Modal Dinámico de Confirmación de Cambio de Estado (Habilitar / Deshabilitar) -->
    <ConfirmStatusModal
      :is-open="showStatusModal"
      :title="statusModalTitle"
      :question="statusModalQuestion"
      :description="statusModalDescription"
      :confirm-text="statusConfirmText"
      :is-destructive="statusIsDestructive"
      :loading="isStatusLoading"
      @confirm="handleConfirmStatus"
      @close="showStatusModal = false"
    />

    <!-- Modal Dinámico de Confirmación de Eliminación (SOLID - Reutilizable) -->
    <BaseConfirmModal
      :is-open="showDeleteModal"
      :question="deleteModalQuestion"
      :description="deleteModalDescription"
      confirm-text="Aceptar"
      cancel-text="Cancelar"
      :is-destructive="true"
      :loading="isDeleteLoading"
      @confirm="handleConfirmDelete"
      @close="showDeleteModal = false"
    />

    <!-- Loader Global de Acciones con paleta corporativa Verde Bosque #244B36 / Salvia #6F9678 -->
    <ActionLoader
      :show="showActionLoader"
      :message="actionLoaderMessage"
    />
  </div>
</template>

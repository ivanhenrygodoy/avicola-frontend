<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAvesStore } from '@/stores/aves'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'

// Componentes comunes globales (SOLID)
import BaseModal from '@/components/common/BaseModal.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import StatCard from '@/components/common/StatCard.vue'
import FloatingInput from '@/components/common/FloatingInput.vue'
import FloatingSelect from '@/components/common/FloatingSelect.vue'
import FormField from '@/components/common/FormField.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import AvesStats from '@/components/aves/AvesStats.vue'
import AppHeader from '@/components/common/AppHeader.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'

// Iconos Lucide
import {
  Home,
  LayoutDashboard,
  Layers,
  Plus,
  Search,
  Eye,
  History,
  Pencil,
  Trash2,
  ArrowRightLeft,
  RotateCcw,
  User,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Scale,
  SearchX,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()
const avesStore = useAvesStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()

// Modales
const showAveModal = ref(false)
const showDetalleModal = ref(false)
const showTrasladoModal = ref(false)
const showMovimientosModal = ref(false)
const showDeleteModal = ref(false)
const showReactivarModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)

// Loader global
const showActionLoader = ref(false)
const actionLoaderMessage = ref('Procesando solicitud...')

// Ave en proceso
const targetAve = ref(null)

// Formulario de Registro / Edición (usa catálogos ctl_especie, ctl_sexo, ctl_proposito)
const aveForm = ref({
  id: null,
  codigo: '',
  nombre: '',
  id_especie: '',
  id_sexo: '',
  id_proposito: '',
  raza: 'Criolla',
  id_division: '',
  fecha_ingreso: new Date().toISOString().split('T')[0],
  fecha_nacimiento: '',
  peso_actual_kg: '',
  observaciones: '',
})

// Errores de validación reactivos para FormField
const aveErrors = ref({
  codigo: '',
  id_especie: '',
  id_sexo: '',
})

// Formulario de Traslado
const trasladoForm = ref({
  id_casita_destino: '',
  id_division_destino: '',
  motivo: 'Rotación de pastoreo y balance de corral',
  observaciones: '',
  fecha: new Date().toISOString().split('T')[0],
})

const trasladoErrors = ref({
  id_division_destino: '',
})

// Opciones dinámicas alimentadas desde endpoints ctl_especie y ctl_sexo
const especieFiltroOptions = computed(() => {
  return avesStore.catalogos.especies.map((esp) => ({
    value: String(esp.id),
    label: esp.nombre,
  }))
})

const sexoFiltroOptions = computed(() => {
  return avesStore.catalogos.sexos.map((s) => ({
    value: String(s.id),
    label: s.nombre,
  }))
})

const formEspecieOptions = computed(() => {
  return avesStore.catalogos.especies.map((esp) => ({
    value: esp.id,
    label: esp.nombre,
  }))
})

const formSexoOptions = computed(() => {
  return avesStore.catalogos.sexos.map((s) => ({
    value: s.id,
    label: s.nombre,
  }))
})

const formPropositoOptions = computed(() => {
  const list = [{ value: '', label: '-- Sin propósito definido --' }]
  avesStore.catalogos.propositos.forEach((p) => {
    list.push({ value: p.id, label: p.nombre })
  })
  return list
})

const estadoFiltroOptions = [
  { value: 'activa', label: 'Activas' },
  { value: 'salida', label: 'Bajas' },
]

// Divisiones agrupadas para el formulario de Ave
const divisionesDisponibles = computed(() => {
  const list = [{ value: '', label: '-- Sin asignación inicial --' }]
  instalacionesStore.casitas.forEach((casita) => {
    if (casita.divisiones && casita.divisiones.length > 0) {
      casita.divisiones.forEach((div) => {
        if (div.activa) {
          list.push({
            value: div.id,
            label: `${casita.nombre} • ${div.nombre}`,
          })
        }
      })
    }
  })
  return list
})

// Divisiones filtradas por casita para el modal de traslado
const divisionesTrasladoOptions = computed(() => {
  if (!trasladoForm.value.id_casita_destino) return []
  const casita = instalacionesStore.casitas.find(
    (c) => String(c.id) === String(trasladoForm.value.id_casita_destino)
  )
  if (!casita || !casita.divisiones) return []
  return casita.divisiones.filter((d) => d.activa)
})

// Advertencia biológica preventiva en el modal de traslado
const advertenciaBiologica = computed(() => {
  if (!targetAve.value || !trasladoForm.value.id_division_destino) return null

  const targetDivId = Number(trasladoForm.value.id_division_destino)
  // Buscar si hay aves de otra especie en esa división
  const avesEnDestino = avesStore.aves.filter(
    (a) => a.id_division === targetDivId && a.id !== targetAve.value.id && a.estado === 'activa'
  )

  if (avesEnDestino.length > 0) {
    const otraAve = avesEnDestino[0]
    if (otraAve.id_especie !== targetAve.value.id_especie) {
      const especieExistente = otraAve.especie?.nombre || 'otra especie'
      const especieAve = targetAve.value.especie?.nombre || 'esta especie'
      return `¡Atención! La división destino alberga ${especieExistente}s. Las directrices biológicas prohíben mezclar ${especieAve}s con ${especieExistente}s.`
    }
  }
  return null
})

onMounted(async () => {
  await Promise.all([
    avesStore.fetchCatalogos(),
    avesStore.fetchAves(),
    instalacionesStore.fetchCasitas({ per_page: 50 }),
  ])
})

// Acciones de Filtro
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

// Modal Crear Ave
const openCreateAve = () => {
  isEditing.value = false
  targetAve.value = null
  aveErrors.value = { codigo: '', id_especie: '', id_sexo: '' }
  aveForm.value = {
    id: null,
    codigo: '',
    nombre: '',
    id_especie: avesStore.catalogos.especies[0]?.id || '',
    id_sexo: avesStore.catalogos.sexos[0]?.id || '',
    id_proposito: avesStore.catalogos.propositos[0]?.id || '',
    raza: 'Criolla',
    id_division: '',
    fecha_ingreso: new Date().toISOString().split('T')[0],
    fecha_nacimiento: '',
    peso_actual_kg: '',
    observaciones: '',
  }
  showAveModal.value = true
}

// Modal Editar Ave
const openEditAve = (ave) => {
  isEditing.value = true
  targetAve.value = ave
  aveErrors.value = { codigo: '', id_especie: '', id_sexo: '' }
  aveForm.value = {
    id: ave.id,
    codigo: ave.codigo,
    nombre: ave.nombre || '',
    id_especie: ave.id_especie || ave.especie?.id || '',
    id_sexo: ave.id_sexo || ave.sexo?.id || '',
    id_proposito: ave.id_proposito || ave.proposito?.id || '',
    raza: ave.raza || '',
    id_division: ave.id_division || '',
    fecha_ingreso: ave.fecha_ingreso || '',
    fecha_nacimiento: ave.fecha_nacimiento || '',
    peso_actual_kg: ave.peso_actual_kg || '',
    observaciones: ave.observaciones || '',
  }
  showAveModal.value = true
}

// Submit Crear / Editar Ave
const handleSubmitAve = async () => {
  aveErrors.value = { codigo: '', id_especie: '', id_sexo: '' }
  let hasError = false

  if (!aveForm.value.codigo || !aveForm.value.codigo.trim()) {
    aveErrors.value.codigo = 'El código identificador del ave es obligatorio'
    hasError = true
  }
  if (!aveForm.value.id_especie) {
    aveErrors.value.id_especie = 'La especie es obligatoria'
    hasError = true
  }
  if (!aveForm.value.id_sexo) {
    aveErrors.value.id_sexo = 'El sexo es obligatorio'
    hasError = true
  }

  if (hasError) return

  isSubmitting.value = true
  actionLoaderMessage.value = isEditing.value
    ? `Guardando cambios de ${aveForm.value.codigo}...`
    : `Registrando ave ${aveForm.value.codigo}...`
  showActionLoader.value = true

  try {
    const payload = {
      ...aveForm.value,
      codigo: aveForm.value.codigo.trim(),
      nombre: aveForm.value.nombre?.trim() || null,
      id_especie: Number(aveForm.value.id_especie),
      id_sexo: Number(aveForm.value.id_sexo),
      id_proposito: aveForm.value.id_proposito ? Number(aveForm.value.id_proposito) : null,
      id_division: aveForm.value.id_division ? Number(aveForm.value.id_division) : null,
      peso_actual_kg: aveForm.value.peso_actual_kg ? Number(aveForm.value.peso_actual_kg) : null,
    }

    if (isEditing.value) {
      await avesStore.updateAve(aveForm.value.id, payload)
      notify.success('Ave actualizada exitosamente.')
    } else {
      await avesStore.addAve(payload)
      notify.success('Ave registrada exitosamente.')
    }
    showAveModal.value = false
  } catch (err) {
    console.error('Error al guardar ave:', err)
    const msg = err.response?.data?.message || 'Error al procesar la información del ave.'
    if (err.response?.status === 422) {
      if (err.response.data?.errors) {
        if (err.response.data.errors.codigo) aveErrors.value.codigo = err.response.data.errors.codigo[0]
        if (err.response.data.errors.id_especie) aveErrors.value.id_especie = err.response.data.errors.id_especie[0]
        if (err.response.data.errors.id_sexo) aveErrors.value.id_sexo = err.response.data.errors.id_sexo[0]
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

// Modal Trasladar Ave
const openTraslado = (ave) => {
  targetAve.value = ave
  trasladoErrors.value = { id_division_destino: '' }

  const casitaActualId = ave.division?.id_casita || ''
  trasladoForm.value = {
    id_casita_destino: casitaActualId ? String(casitaActualId) : '',
    id_division_destino: '',
    motivo: 'Rotación de pastoreo y balance de corral',
    observaciones: '',
    fecha: new Date().toISOString().split('T')[0],
  }
  showTrasladoModal.value = true
}

// Cuando cambia la casita destino, resetear corral seleccionado
watch(
  () => trasladoForm.value.id_casita_destino,
  () => {
    trasladoForm.value.id_division_destino = ''
  }
)

const handleSubmitTraslado = async () => {
  trasladoErrors.value = { id_division_destino: '' }

  if (!trasladoForm.value.id_division_destino) {
    trasladoErrors.value.id_division_destino = 'Debes seleccionar la división de destino'
    return
  }

  isSubmitting.value = true
  actionLoaderMessage.value = `Trasladando ave ${targetAve.value.codigo}...`
  showActionLoader.value = true

  try {
    await avesStore.trasladarAve(targetAve.value.id, {
      id_division_destino: Number(trasladoForm.value.id_division_destino),
      motivo: trasladoForm.value.motivo,
      observaciones: trasladoForm.value.observaciones,
      fecha: trasladoForm.value.fecha,
    })
    notify.success(`Ave ${targetAve.value.codigo} trasladada correctamente.`)
    showTrasladoModal.value = false
  } catch (err) {
    console.error('Error al trasladar ave:', err)
    const msg = err.response?.data?.message || 'Error al ejecutar el traslado.'
    if (err.response?.status === 422) {
      if (err.response.data?.errors?.id_division_destino) {
        trasladoErrors.value.id_division_destino = err.response.data.errors.id_division_destino[0]
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

// Modal Detalle Completo del Ave (Sólo Lectura - El Ojito 👁️)
const openDetalle = (ave) => {
  targetAve.value = ave
  showDetalleModal.value = true
}

// Modal Ver Historial de Movimientos
const openMovimientos = async (ave) => {
  targetAve.value = ave
  showMovimientosModal.value = true
  await avesStore.fetchMovimientos(ave.id)
}

// Modal Dar de Baja
const defaultBajaForm = () => ({
  motivo: 'Baja / Salida',
  observaciones: '',
})
const bajaForm = ref(defaultBajaForm())

const openDeleteAve = (ave) => {
  targetAve.value = ave
  bajaForm.value = defaultBajaForm()
  showDeleteModal.value = true
}

const handleConfirmDelete = async () => {
  if (!targetAve.value) return
  isSubmitting.value = true
  actionLoaderMessage.value = `Dando de baja a ${targetAve.value.codigo}...`
  showActionLoader.value = true

  try {
    await avesStore.removeAve(targetAve.value.id, {
      motivo: bajaForm.value.motivo?.trim() || 'Baja / Salida',
      observaciones: bajaForm.value.observaciones?.trim() || null,
    })
    notify.success(`El ave ${targetAve.value.codigo} ha sido dada de baja correctamente y se registró el movimiento de salida.`)
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error al dar de baja ave:', err)
    notify.error('Error al procesar la baja del ave.')
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
}

// Modal Reactivar / Reincorporar Ave
const defaultReactivarForm = () => ({
  id_division_destino: '',
  observaciones: '',
})
const reactivarForm = ref(defaultReactivarForm())

const openReactivarAve = (ave) => {
  targetAve.value = ave
  reactivarForm.value = defaultReactivarForm()
  showReactivarModal.value = true
}

const handleConfirmReactivar = async () => {
  if (!targetAve.value) return
  isSubmitting.value = true
  actionLoaderMessage.value = `Reactivando ave ${targetAve.value.codigo}...`
  showActionLoader.value = true

  try {
    const payload = {
      observaciones: reactivarForm.value.observaciones?.trim() || null,
    }
    if (reactivarForm.value.id_division_destino) {
      payload.id_division_destino = Number(reactivarForm.value.id_division_destino)
    }

    await avesStore.reactivarAve(targetAve.value.id, payload)
    notify.success(`El ave ${targetAve.value.codigo} ha sido reactivada e incorporada exitosamente, registrando el movimiento de reingreso.`)
    showReactivarModal.value = false
  } catch (err) {
    console.error('Error al reactivar ave:', err)
    notify.error(err.response?.data?.message || 'Error al procesar la reactivación del ave.')
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
}

// Formateo de fechas
const formatDate = (dateString) => {
  if (!dateString) return '—'
  const date = new Date(dateString)
  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Logout
const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior Reutilizable (SOLID - Impeccable) -->
    <AppHeader subtitle="Inventario de Aves" />

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Estadísticas Reutilizables de Inventario de Aves (SOLID) -->
      <AvesStats :stats="avesStore.stats" />

      <!-- Barra de Filtros Reutilizable con FilterBar Component (SOLID) -->
      <FilterBar
        :loading="avesStore.loading"
        @search="handleSearch"
        @clear="handleClear"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Búsqueda por código, nombre o raza con lupa (en blanco) -->
          <FloatingInput
            v-model="avesStore.filters.search"
            label="Buscar"
            :icon="Search"
            @enter="handleSearch"
          />

          <!-- Filtro Especie (Catálogo ctl_especie sin icono, vacío por defecto) -->
          <FloatingSelect
            v-model="avesStore.filters.id_especie"
            label="Especie"
            :options="especieFiltroOptions"
          />

          <!-- Filtro Sexo (Catálogo ctl_sexo, vacío por defecto) -->
          <FloatingSelect
            v-model="avesStore.filters.id_sexo"
            label="Sexo"
            :options="sexoFiltroOptions"
          />

          <!-- Filtro Estado (Vacío inicialmente, sin 'Todos los estados') -->
          <FloatingSelect
            v-model="avesStore.filters.estado"
            label="Estado del Ave"
            :options="estadoFiltroOptions"
          />
        </div>

        <template #action>
          <button
            @click="openCreateAve"
            class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1"
          >
            <Plus class="w-4 h-4" />
            <span>Registrar ave</span>
          </button>
        </template>
      </FilterBar>

      <!-- Tabla de Inventario de Aves -->
      <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
        <!-- Indicador de Carga Estandarizado con Imagotipo Corporativo GallinaIcon -->
        <div v-if="avesStore.loading" class="p-12 text-center flex flex-col items-center justify-center">
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
                <th scope="col" class="px-6 py-4">Ave</th>
                <th scope="col" class="px-6 py-4">Especie</th>
                <th scope="col" class="px-6 py-4">Sexo</th>
                <th scope="col" class="px-6 py-4">Raza</th>
                <th scope="col" class="px-6 py-4">Propósito</th>
                <th scope="col" class="px-6 py-4">Ubicación</th>
                <th scope="col" class="px-6 py-4">Estado</th>
                <th scope="col" class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>

            <tbody class="divide-y divide-borde">
              <!-- Estado vacío mejorado (Empty State - Impeccable) -->
              <tr v-if="avesStore.aves.length === 0">
                <td colspan="8" class="px-6 py-14 text-center">
                  <div class="max-w-xs mx-auto flex flex-col items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-salvia-50 flex items-center justify-center text-salvia border border-borde">
                      <SearchX class="w-6 h-6" />
                    </div>
                    <div class="space-y-1">
                      <p class="text-sm font-bold text-verdoso">Sin resultados en el inventario</p>
                      <p class="text-xs text-verdoso-muted">No se encontraron aves con los criterios de búsqueda seleccionados.</p>
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
                v-for="ave in avesStore.aves"
                :key="ave.id"
                class="hover:bg-crema/30 transition-colors"
              >
                <!-- Ave / Nombre -->
                <td class="px-6 py-4 font-bold text-verdoso">
                  {{ ave.nombre ? `"${ave.nombre}"` : '—' }}
                </td>

                <!-- Especie (Solo texto plano) -->
                <td class="px-6 py-4 text-verdoso">
                  {{ ave.especie?.nombre || '—' }}
                </td>

                <!-- Sexo (Solo texto plano) -->
                <td class="px-6 py-4 text-verdoso">
                  {{ ave.sexo?.nombre || '—' }}
                </td>

                <!-- Raza (Solo texto plano) -->
                <td class="px-6 py-4 text-verdoso">
                  {{ ave.raza || 'Criolla' }}
                </td>

                <!-- Propósito (Solo texto plano) -->
                <td class="px-6 py-4 text-verdoso">
                  {{ ave.proposito?.nombre || 'General' }}
                </td>

                <!-- Ubicación (Solo Casita, sin división) -->
                <td class="px-6 py-4 text-verdoso font-medium">
                  {{ ave.division?.casita?.nombre || 'Sin asignar' }}
                </td>

                <!-- Estado (Único con pill de color y border semántico) -->
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                      ave.estado === 'activa'
                        ? 'bg-bosque-50 text-bosque border-bosque/20'
                        : 'bg-red-50 text-red-700 border-red-200'
                    ]"
                  >
                    {{ ave.estado === 'activa' ? 'Activa' : 'Baja' }}
                  </span>
                </td>

                <!-- Acciones (Detalle 👁️, Historial 🕒, Trasladar ⇄, Lápiz ✏️, Basura 🗑️ / Reactivar 🔄) con accesibilidad aria-label y toque ergonómico -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5 text-salvia">
                    <!-- Ojito: Ver Detalle Completo del Ave (Lectura) -->
                    <button
                      @click="openDetalle(ave)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-bosque hover:bg-salvia-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver detalle completo del ave"
                      aria-label="Ver detalle completo del ave"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <!-- Historial: Ver Historial de Movimientos y Traslados -->
                    <button
                      @click="openMovimientos(ave)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-bosque hover:bg-salvia-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver historial de traslados"
                      aria-label="Ver historial de traslados"
                    >
                      <History class="w-4 h-4" />
                    </button>

                    <!-- Trasladar Ave (Separación Biológica) -->
                    <button
                      v-if="ave.estado === 'activa'"
                      @click="openTraslado(ave)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-bosque hover:bg-bosque-50 rounded-lg transition-colors cursor-pointer"
                      title="Trasladar ave a otra división"
                      aria-label="Trasladar ave a otra división"
                    >
                      <ArrowRightLeft class="w-4 h-4 text-bosque" />
                    </button>

                    <!-- Lápiz: Editar Ave -->
                    <button
                      @click="openEditAve(ave)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-tierra hover:bg-tierra-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar datos del ave"
                      aria-label="Editar datos del ave"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>

                    <!-- Basurero: Dar de baja (solo cuando está activa) -->
                    <button
                      v-if="ave.estado === 'activa'"
                      @click="openDeleteAve(ave)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Dar de baja ave"
                      aria-label="Dar de baja ave"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>

                    <!-- Icono de Retorno: Reactivar / Reincorporar ave (cuando está de baja) -->
                    <button
                      v-else
                      @click="openReactivarAve(ave)"
                      class="p-2 min-w-[34px] min-h-[34px] inline-flex items-center justify-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                      title="Reactivar ave / Marcar como regresada"
                      aria-label="Reactivar ave / Marcar como regresada"
                    >
                      <RotateCcw class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginador Reutilizable -->
        <PaginationBar
          :current-page="avesStore.meta.current_page"
          :last-page="avesStore.meta.last_page"
          :per-page="avesStore.meta.per_page"
          :total="avesStore.meta.total"
          item-label="aves"
          @update:page="handlePageChange"
          @update:per-page="handlePerPageChange"
        />
      </div>
    </main>

    <!-- MODAL 0: Ficha Técnica Detallada del Ave (Sólo Lectura - Ojito 👁️) -->
    <BaseModal
      :is-open="showDetalleModal && !!targetAve"
      max-width="lg"
      @close="showDetalleModal = false"
    >
      <template #header>
        <div>
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-salvia/20 text-bosque">
              {{ targetAve?.especie?.nombre || 'Ave' }}
            </span>
            <span
              :class="[
                'px-2 py-0.5 rounded-full text-xs font-semibold',
                targetAve?.estado === 'activa' ? 'bg-[#DDF3E3] text-bosque' : 'bg-[#FEE2E2] text-red-800'
              ]"
            >
              {{ targetAve?.estado === 'activa' ? 'Activa' : 'Baja' }}
            </span>
          </div>
          <h3 class="text-xl font-bold text-verdoso mt-1">
            {{ targetAve?.nombre ? `"${targetAve?.nombre}"` : targetAve?.codigo }}
          </h3>
          <p class="text-xs text-verdoso-muted font-mono mt-0.5">
            Código Identificador: <span class="font-bold text-verdoso">{{ targetAve?.codigo }}</span>
          </p>
        </div>
      </template>

      <!-- Ficha Técnica en Grid de Solo Lectura -->
      <div class="space-y-4">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <!-- Especie -->
          <div class="p-3 bg-crema/40 border border-borde rounded-xl">
            <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Especie</span>
            <span class="text-sm font-semibold text-verdoso mt-0.5 block">
              {{ targetAve?.especie?.nombre || '—' }}
            </span>
          </div>

          <!-- Sexo -->
          <div class="p-3 bg-crema/40 border border-borde rounded-xl">
            <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Sexo</span>
            <span class="text-sm font-semibold text-verdoso mt-0.5 block">
              {{ targetAve?.sexo?.nombre || '—' }}
            </span>
          </div>

          <!-- Raza -->
          <div class="p-3 bg-crema/40 border border-borde rounded-xl">
            <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Raza</span>
            <span class="text-sm font-semibold text-verdoso mt-0.5 block">
              {{ targetAve?.raza || 'Criolla' }}
            </span>
          </div>

          <!-- Propósito -->
          <div class="p-3 bg-crema/40 border border-borde rounded-xl">
            <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Propósito</span>
            <span class="text-sm font-semibold text-verdoso mt-0.5 block">
              {{ targetAve?.proposito?.nombre || '—' }}
            </span>
          </div>

          <!-- Peso Actual -->
          <div class="p-3 bg-crema/40 border border-borde rounded-xl">
            <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Peso Actual</span>
            <span class="text-sm font-semibold text-verdoso mt-0.5 block">
              {{ targetAve?.peso_actual_kg ? `${targetAve.peso_actual_kg} kg` : 'No registrado' }}
            </span>
          </div>

          <!-- Fecha de Ingreso -->
          <div class="p-3 bg-crema/40 border border-borde rounded-xl">
            <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Fecha de Ingreso</span>
            <span class="text-sm font-semibold text-verdoso mt-0.5 block">
              {{ formatDate(targetAve?.fecha_ingreso) }}
            </span>
          </div>
        </div>

        <!-- Ubicación Física Actual (Casita y Corral) -->
        <div class="p-4 bg-crema/40 border border-borde rounded-xl space-y-1">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Ubicación Física Actual</span>
          <div class="flex items-center gap-2 text-sm text-verdoso font-semibold">
            <span>{{ targetAve?.division?.casita?.nombre || 'Sin casita asignada' }}</span>
            <span v-if="targetAve?.division">•</span>
            <span v-if="targetAve?.division" class="text-salvia font-normal">{{ targetAve.division.nombre }}</span>
          </div>
        </div>

        <!-- Observaciones -->
        <div v-if="targetAve?.observaciones" class="p-4 bg-crema/40 border border-borde rounded-xl space-y-1">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Observaciones y Rasgos</span>
          <p class="text-xs text-verdoso leading-relaxed whitespace-pre-line">
            {{ targetAve.observaciones }}
          </p>
        </div>
      </div>

      <!-- Footer CENTRADO -->
      <template #footer>
        <button
          type="button"
          @click="showDetalleModal = false"
          class="px-6 py-2 btn-secundario text-sm"
        >
          Cerrar
        </button>
      </template>
    </BaseModal>

    <!-- MODAL 1: Registrar / Editar Ave (Usa FormField.vue con catálogos ctl_especie y ctl_sexo) -->
    <BaseModal
      :is-open="showAveModal"
      :title="isEditing ? `Editar Ave: ${aveForm.codigo}` : 'Registrar Nueva Ave'"
      max-width="lg"
      @close="showAveModal = false"
    >
      <form id="ave-form" @submit.prevent="handleSubmitAve" class="space-y-4" novalidate>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Código Identificador -->
          <FormField
            id="ave-codigo"
            v-model="aveForm.codigo"
            label="Código Identificador"
            placeholder="Ej. AVE-015"
            required
            :error="aveErrors.codigo"
            @input="aveErrors.codigo = ''"
          />

          <!-- Sobrenombre -->
          <FormField
            id="ave-nombre"
            v-model="aveForm.nombre"
            label="Sobrenombre"
            placeholder="Ej. Canela, Pardo"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Especie (Catálogo ctl_especie) -->
          <FormField
            id="ave-especie"
            v-model="aveForm.id_especie"
            type="select"
            label="Especie"
            required
            :options="formEspecieOptions"
            :error="aveErrors.id_especie"
            @input="aveErrors.id_especie = ''"
          />

          <!-- Sexo (Catálogo ctl_sexo) -->
          <FormField
            id="ave-sexo"
            v-model="aveForm.id_sexo"
            type="select"
            label="Sexo"
            required
            :options="formSexoOptions"
            :error="aveErrors.id_sexo"
            @input="aveErrors.id_sexo = ''"
          />

          <!-- Raza -->
          <FormField
            id="ave-raza"
            v-model="aveForm.raza"
            label="Raza"
            placeholder="Ej. Criolla"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Propósito (Catálogo ctl_proposito) -->
          <FormField
            id="ave-proposito"
            v-model="aveForm.id_proposito"
            type="select"
            label="Propósito"
            :options="formPropositoOptions"
          />

          <!-- Corral / División Inicial -->
          <FormField
            id="ave-division"
            v-model="aveForm.id_division"
            type="select"
            label="Ubicación Inicial (Corral)"
            :options="divisionesDisponibles"
          />
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- Fecha de Ingreso -->
          <FormField
            id="ave-fecha-ingreso"
            v-model="aveForm.fecha_ingreso"
            type="date"
            label="Fecha de Ingreso"
          />

          <!-- Peso Actual en KG -->
          <FormField
            id="ave-peso"
            v-model="aveForm.peso_actual_kg"
            type="number"
            step="0.01"
            label="Peso Actual (kg)"
            placeholder="Ej. 2.15"
          />
        </div>

        <!-- Observaciones -->
        <FormField
          id="ave-observaciones"
          v-model="aveForm.observaciones"
          type="textarea"
          label="Observaciones y Señales Físicas"
          placeholder="Color del plumaje, docilidad, señas particulares..."
          :rows="2"
        />
      </form>

      <!-- Botones CENTRADOS -->
      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            @click="showAveModal = false"
            class="px-6 py-2 btn-secundario text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleSubmitAve"
            :disabled="isSubmitting"
            class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Ave' }}</span>
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 2: Trasladar Ave (Separación Biológica) -->
    <BaseModal
      :is-open="showTrasladoModal"
      :title="`Traslado de Ave: ${targetAve?.codigo} (${targetAve?.especie?.nombre || 'Ave'})`"
      max-width="md"
      @close="showTrasladoModal = false"
    >
      <form id="traslado-form" @submit.prevent="handleSubmitTraslado" class="space-y-4" novalidate>
        <!-- Resumen de ubicación actual -->
        <div class="p-3.5 bg-crema/60 border border-borde rounded-xl text-xs space-y-1">
          <p class="font-bold text-verdoso">Ubicación actual:</p>
          <p class="text-salvia">
            {{ targetAve?.division ? `${targetAve.division.casita?.nombre} • ${targetAve.division.nombre}` : 'Sin asignación' }}
          </p>
        </div>

        <!-- Selector Casita Destino -->
        <div>
          <label class="block text-xs font-bold text-verdoso uppercase tracking-wider mb-1">
            Casita Destino <span class="text-red-500 ml-0.5">*</span>
          </label>
          <select
            v-model="trasladoForm.id_casita_destino"
            class="w-full px-3.5 py-2.5 border border-borde rounded-xl text-sm focus:ring-1 focus:ring-bosque focus:border-bosque outline-none bg-white text-verdoso cursor-pointer"
          >
            <option value="">-- Seleccionar Casita --</option>
            <option
              v-for="c in instalacionesStore.casitas"
              :key="c.id"
              :value="String(c.id)"
            >
              {{ c.nombre }} ({{ c.tipo || 'General' }})
            </option>
          </select>
        </div>

        <!-- Selector División Destino con validación de error -->
        <div>
          <label
            :class="[
              'block text-xs font-bold uppercase tracking-wider mb-1',
              trasladoErrors.id_division_destino ? 'text-red-600' : 'text-verdoso'
            ]"
          >
            Corral / División Destino <span class="text-red-500 ml-0.5">*</span>
          </label>
          <select
            v-model="trasladoForm.id_division_destino"
            :disabled="!trasladoForm.id_casita_destino"
            @change="trasladoErrors.id_division_destino = ''"
            :class="[
              'w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-colors cursor-pointer',
              trasladoErrors.id_division_destino
                ? 'border-2 border-red-500 focus:ring-1 focus:ring-red-500'
                : 'border border-borde focus:ring-1 focus:ring-bosque focus:border-bosque bg-white text-verdoso',
              !trasladoForm.id_casita_destino ? 'opacity-50 cursor-not-allowed bg-crema' : ''
            ]"
          >
            <option value="">-- Seleccionar División --</option>
            <option
              v-for="d in divisionesTrasladoOptions"
              :key="d.id"
              :value="d.id"
            >
              {{ d.nombre }}
            </option>
          </select>
          <p
            v-if="trasladoErrors.id_division_destino"
            class="text-xs text-red-500 font-medium mt-1 select-none"
          >
            {{ trasladoErrors.id_division_destino }}
          </p>
        </div>

        <!-- Alerta preventiva si hay conflicto biológico -->
        <div
          v-if="advertenciaBiologica"
          class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 animate-fade-in"
        >
          <AlertTriangle class="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <span>{{ advertenciaBiologica }}</span>
        </div>

        <!-- Motivo del Traslado -->
        <FormField
          id="traslado-motivo"
          v-model="trasladoForm.motivo"
          label="Motivo del Traslado"
          placeholder="Ej. Rotación de pastoreo, Aislamiento sanitario..."
        />

        <!-- Observaciones -->
        <FormField
          id="traslado-obs"
          v-model="trasladoForm.observaciones"
          type="textarea"
          label="Observaciones Adicionales"
          placeholder="Condiciones del ave al momento del traslado..."
          :rows="2"
        />
      </form>

      <!-- Botones CENTRADOS -->
      <template #footer>
        <div class="flex items-center justify-center gap-3 w-full">
          <button
            type="button"
            @click="showTrasladoModal = false"
            class="px-6 py-2 btn-secundario text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleSubmitTraslado"
            :disabled="isSubmitting || !!advertenciaBiologica"
            class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
            <span>Confirmar Traslado</span>
          </button>
        </div>
      </template>
    </BaseModal>

    <!-- MODAL 3: Historial Cronológico de Movimientos (Ojito 👁️) -->
    <BaseModal
      :is-open="showMovimientosModal"
      :title="`Historial de Traslados: ${targetAve?.codigo} (${targetAve?.nombre || targetAve?.especie?.nombre || 'Ave'})`"
      max-width="lg"
      @close="showMovimientosModal = false"
    >
      <div v-if="avesStore.loadingMovimientos" class="p-8 text-center">
        <Loader2 class="w-6 h-6 animate-spin mx-auto text-bosque mb-2" />
        <p class="text-xs text-verdoso-muted">Cargando movimientos históricos...</p>
      </div>

      <div v-else-if="avesStore.movimientos.length === 0" class="p-8 text-center text-verdoso-muted text-sm">
        No se registran movimientos para esta ave.
      </div>

      <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        <div
          v-for="mov in avesStore.movimientos"
          :key="mov.id"
          class="p-4 bg-crema/40 border border-borde rounded-2xl space-y-2 hover:bg-crema/70 transition-colors"
        >
          <div class="flex items-center justify-between text-xs">
            <span class="font-bold text-verdoso flex items-center gap-1">
              <Calendar class="w-3.5 h-3.5 text-salvia" />
              {{ formatDate(mov.fecha) }}
            </span>
            <div class="flex items-center gap-2">
              <span
                v-if="mov.motivo"
                :class="[
                  'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                  mov.motivo.toLowerCase().includes('reingreso')
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : mov.motivo.toLowerCase().includes('baja') || mov.motivo.toLowerCase().includes('salida')
                    ? 'bg-red-50 text-red-800 border-red-200'
                    : 'bg-bosque-50 text-bosque border-bosque/20'
                ]"
              >
                {{ mov.motivo }}
              </span>
              <span class="text-salvia font-mono">#{{ mov.id }}</span>
            </div>
          </div>

          <div class="flex items-center gap-2 text-xs font-semibold text-verdoso">
            <span class="text-salvia">De:</span>
            <span>
              {{
                mov.division_origen
                  ? `${mov.division_origen.casita?.nombre ? mov.division_origen.casita.nombre + ' • ' : ''}${mov.division_origen.nombre}`
                  : (mov.motivo?.toLowerCase().includes('reingreso') ? 'Reingreso (Fuera de plantel)' : 'Ingreso inicial')
              }}
            </span>
            <ArrowRightLeft class="w-3.5 h-3.5 text-bosque" />
            <span class="text-salvia">A:</span>
            <span class="text-bosque">
              {{
                mov.division_destino
                  ? `${mov.division_destino.casita?.nombre ? mov.division_destino.casita.nombre + ' • ' : ''}${mov.division_destino.nombre}`
                  : (mov.motivo?.toLowerCase().includes('baja') || mov.motivo?.toLowerCase().includes('salida') ? 'Baja / Salida' : 'Sin asignación inicial')
              }}
            </span>
          </div>

          <p v-if="mov.motivo" class="text-xs text-verdoso-muted">
            <span class="font-semibold text-verdoso">Motivo:</span> {{ mov.motivo }}
          </p>

          <p v-if="mov.observaciones" class="text-xs text-verdoso-muted italic">
            {{ mov.observaciones }}
          </p>
        </div>
      </div>

      <!-- Footer CENTRADO -->
      <template #footer>
        <button
          type="button"
          @click="showMovimientosModal = false"
          class="px-6 py-2 btn-secundario text-sm"
        >
          Cerrar
        </button>
      </template>
    </BaseModal>

    <!-- MODAL 4: Dar de Baja a Ave (Genera Movimiento de Salida) -->
    <BaseModal
      :is-open="showDeleteModal"
      title="Dar de Baja a Ave"
      max-width="md"
      @close="showDeleteModal = false"
    >
      <form id="baja-form" @submit.prevent="handleConfirmDelete" class="space-y-4">
        <div class="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
          <Trash2 class="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
          <div class="text-xs text-red-900 space-y-1">
            <p class="font-bold text-sm">
              ¿Dar de baja a {{ targetAve?.codigo }} ({{ targetAve?.nombre || targetAve?.especie?.nombre }})?
            </p>
            <p>
              El ave pasará a estado <strong>Baja</strong> y se registrará automáticamente su movimiento de <strong>Baja / Salida</strong> en el historial.
            </p>
          </div>
        </div>

        <FormField
          id="baja-motivo"
          v-model="bajaForm.motivo"
          label="Motivo de la Baja"
          placeholder="Ej. Baja / Salida, Venta, Muerte natural, Descarte"
          :disabled="isSubmitting"
        />

        <FormField
          id="baja-obs"
          v-model="bajaForm.observaciones"
          type="textarea"
          label="Observaciones (Opcional)"
          placeholder="Detalles sobre el estado o causa de la baja..."
          :rows="2"
          :disabled="isSubmitting"
        />
      </form>

      <template #footer>
        <button
          type="button"
          @click="showDeleteModal = false"
          :disabled="isSubmitting"
          class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirmDelete"
          :disabled="isSubmitting"
          class="px-6 py-2 bg-red-700 text-white hover:bg-red-800 rounded-xl font-medium text-sm shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Trash2 v-else class="w-4 h-4" />
          <span>Confirmar Baja</span>
        </button>
      </template>
    </BaseModal>

    <!-- MODAL 5: Reactivar e Incorporar Ave (Genera Movimiento de Reingreso) -->
    <BaseModal
      :is-open="showReactivarModal"
      title="Reactivar e Incorporar Ave"
      max-width="md"
      @close="showReactivarModal = false"
    >
      <form id="reactivar-form" @submit.prevent="handleConfirmReactivar" class="space-y-4">
        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
          <RotateCcw class="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
          <div class="text-xs text-emerald-900 space-y-1">
            <p class="font-bold text-sm">
              ¿Reactivar al ave {{ targetAve?.codigo }} ({{ targetAve?.nombre || targetAve?.especie?.nombre }})?
            </p>
            <p>
              El ave volverá a estar <strong>Activa</strong> y se generará automáticamente su movimiento de <strong>Reingreso</strong> en el historial.
            </p>
          </div>
        </div>

        <!-- Asignación de corral opcional -->
        <FormField
          id="reactivar-division"
          v-model="reactivarForm.id_division_destino"
          type="select"
          label="Corral / División de Destino"
          :options="divisionesDisponibles"
          :disabled="isSubmitting"
        />

        <!-- Observaciones de reingreso -->
        <FormField
          id="reactivar-obs"
          v-model="reactivarForm.observaciones"
          type="textarea"
          label="Observaciones del Reingreso (Opcional)"
          placeholder="Ej. Ave recuperada, retorno de cuarentena, etc."
          :rows="2"
          :disabled="isSubmitting"
        />
      </form>

      <template #footer>
        <button
          type="button"
          @click="showReactivarModal = false"
          :disabled="isSubmitting"
          class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirmReactivar"
          :disabled="isSubmitting"
          class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <RotateCcw v-else class="w-4 h-4" />
          <span>Confirmar Reingreso</span>
        </button>
      </template>
    </BaseModal>

    <!-- Overlay de Carga Global Corporativo -->
    <ActionLoader
      :show="showActionLoader"
      :message="actionLoaderMessage"
    />
  </div>
</template>

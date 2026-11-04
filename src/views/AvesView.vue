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
  User,
  LogOut,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Scale,
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

// Opciones dinámicas alimentadas desde ctl_especie y ctl_sexo
const especieFiltroOptions = computed(() => {
  const options = [{ value: '', label: 'Todas las especies' }]
  avesStore.catalogos.especies.forEach((esp) => {
    options.push({ value: String(esp.id), label: `${esp.icono || ''} ${esp.nombre}` })
  })
  return options
})

const formEspecieOptions = computed(() => {
  return avesStore.catalogos.especies.map((esp) => ({
    value: esp.id,
    label: `${esp.icono || ''} ${esp.nombre}`,
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
  { value: 'salida', label: 'Bajas / Salidas' },
  { value: 'todos', label: 'Todos los estados' },
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
const openDeleteAve = (ave) => {
  targetAve.value = ave
  showDeleteModal.value = true
}

const handleConfirmDelete = async () => {
  if (!targetAve.value) return
  isSubmitting.value = true
  actionLoaderMessage.value = `Dando de baja a ${targetAve.value.codigo}...`
  showActionLoader.value = true

  try {
    await avesStore.removeAve(targetAve.value.id)
    notify.success('Registro de ave actualizado correctamente.')
    showDeleteModal.value = false
  } catch (err) {
    console.error('Error al dar de baja ave:', err)
    notify.error('Error al procesar la baja del ave.')
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
    <!-- Navbar Superior -->
    <header class="bg-white border-b border-borde sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-bosque text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🐔
            </div>
            <div>
              <h1 class="text-base font-bold text-verdoso leading-tight">
                Granja Avícola Inteligente
              </h1>
              <span class="text-xs text-salvia font-semibold">Inventario de Aves</span>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-1">
            <router-link
              to="/"
              class="px-3 py-2 text-sm font-medium rounded-lg text-verdoso-muted hover:text-verdoso hover:bg-crema flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard class="w-4 h-4 text-salvia" /> Dashboard
            </router-link>
            <router-link
              to="/instalaciones"
              class="px-3 py-2 text-sm font-medium rounded-lg text-verdoso-muted hover:text-verdoso hover:bg-crema flex items-center gap-1.5 transition-colors"
            >
              <Home class="w-4 h-4 text-salvia" /> Instalaciones
            </router-link>
            <router-link
              to="/aves"
              class="px-3 py-2 text-sm font-semibold rounded-lg text-bosque bg-bosque-50 flex items-center gap-1.5 transition-colors"
            >
              <Layers class="w-4 h-4 text-bosque" /> Inventario de Aves
            </router-link>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-2 text-sm text-verdoso bg-crema px-3 py-1.5 rounded-full border border-borde">
            <User class="w-4 h-4 text-salvia" />
            <span class="font-medium">{{ authStore.user?.name || 'Administrador' }}</span>
          </div>

          <button
            @click="handleLogout"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Tarjetas Métricas KPI Superiores (Sin rectángulos sombreados internos) -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Población"
          :value="avesStore.stats.total_aves || 14"
        />

        <StatCard
          title="Gallinas Criollas"
          :value="avesStore.stats.gallinas_count || 10"
        />

        <StatCard
          title="Chompipes (Pavos)"
          :value="avesStore.stats.chompipes_count || 2"
        />

        <StatCard
          title="Patos Pichiches"
          :value="avesStore.stats.patos_count || 2"
        />
      </div>

      <!-- Barra de Filtros con Floating Inputs (Sin validación de requeridos) -->
      <div class="bg-white rounded-2xl border border-borde p-4 sm:p-6 shadow-xs space-y-4">
        <div class="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1">
            <!-- Búsqueda por código o sobrenombre -->
            <FloatingInput
              v-model="avesStore.filters.search"
              label="Buscar por código o nombre..."
              @enter="handleSearch"
            />

            <!-- Filtro Especie (Catálogo ctl_especie) -->
            <FloatingSelect
              v-model="avesStore.filters.id_especie"
              label="Especie"
              :options="especieFiltroOptions"
            />

            <!-- Filtro Estado -->
            <FloatingSelect
              v-model="avesStore.filters.estado"
              label="Estado del Ave"
              :options="estadoFiltroOptions"
            />
          </div>

          <!-- Botones de Acción de Filtro -->
          <div class="flex items-center gap-2 justify-end self-end lg:self-center pt-2 lg:pt-0">
            <button
              @click="handleSearch"
              class="px-5 py-2.5 btn-principal text-sm shadow-xs"
            >
              Buscar
            </button>
            <button
              @click="handleClear"
              class="px-5 py-2.5 btn-secundario text-sm"
            >
              Limpiar
            </button>
            <button
              @click="openCreateAve"
              class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1"
            >
              <Plus class="w-4 h-4" />
              <span>Registrar ave</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla de Inventario de Aves -->
      <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
        <!-- Indicador de Carga -->
        <div v-if="avesStore.loading" class="p-12 text-center">
          <Loader2 class="w-8 h-8 animate-spin mx-auto text-bosque mb-2" />
          <p class="text-sm text-verdoso-muted">Consultando inventario de aves...</p>
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
              <tr v-if="avesStore.aves.length === 0">
                <td colspan="8" class="px-6 py-12 text-center text-verdoso-muted">
                  No se encontraron aves con los criterios de búsqueda seleccionados.
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

                <!-- Estado (Único con pill de color) -->
                <td class="px-6 py-4">
                  <span
                    :class="[
                      'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold',
                      ave.estado === 'activa'
                        ? 'bg-[#DDF3E3] text-bosque'
                        : 'bg-red-100 text-red-800'
                    ]"
                  >
                    {{ ave.estado === 'activa' ? 'Activa' : 'Baja / Salida' }}
                  </span>
                </td>

                <!-- Acciones (Detalle 👁️, Historial 🕒, Trasladar ⇄, Lápiz ✏️, Basura 🗑️) -->
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-1.5 text-salvia">
                    <!-- Ojito: Ver Detalle Completo del Ave (Lectura) -->
                    <button
                      @click="openDetalle(ave)"
                      class="p-1.5 hover:text-bosque hover:bg-salvia-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver detalle completo del ave"
                    >
                      <Eye class="w-4 h-4" />
                    </button>

                    <!-- Historial: Ver Historial de Movimientos y Traslados -->
                    <button
                      @click="openMovimientos(ave)"
                      class="p-1.5 hover:text-bosque hover:bg-salvia-50 rounded-lg transition-colors cursor-pointer"
                      title="Ver historial de traslados"
                    >
                      <History class="w-4 h-4" />
                    </button>

                    <!-- Trasladar Ave (Separación Biológica) -->
                    <button
                      v-if="ave.estado === 'activa'"
                      @click="openTraslado(ave)"
                      class="p-1.5 hover:text-bosque hover:bg-[#DDF3E3] rounded-lg transition-colors cursor-pointer"
                      title="Trasladar ave a otra división"
                    >
                      <ArrowRightLeft class="w-4 h-4 text-bosque" />
                    </button>

                    <!-- Lápiz: Editar Ave -->
                    <button
                      @click="openEditAve(ave)"
                      class="p-1.5 hover:text-tierra hover:bg-tierra-50 rounded-lg transition-colors cursor-pointer"
                      title="Editar datos del ave"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>

                    <!-- Basurero: Dar de baja -->
                    <button
                      @click="openDeleteAve(ave)"
                      class="p-1.5 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Dar de baja / eliminar ave"
                    >
                      <Trash2 class="w-4 h-4" />
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
              {{ targetAve?.estado === 'activa' ? 'Activa' : 'Baja / Salida' }}
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
            <span class="text-salvia font-mono">Movimiento #{{ mov.id }}</span>
          </div>

          <div class="flex items-center gap-2 text-xs font-semibold text-verdoso">
            <span class="text-salvia">De:</span>
            <span>{{ mov.division_origen?.nombre || 'Ingreso inicial' }}</span>
            <ArrowRightLeft class="w-3.5 h-3.5 text-bosque" />
            <span class="text-salvia">A:</span>
            <span class="text-bosque">{{ mov.division_destino?.nombre || 'Salida' }}</span>
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

    <!-- MODAL 4: Confirmación de Baja / Eliminación -->
    <BaseConfirmModal
      :is-open="showDeleteModal"
      title="¿Dar de baja a esta ave?"
      :message="`¿Estás seguro de registrar la salida de ${targetAve?.codigo} (${targetAve?.nombre || targetAve?.especie?.nombre})? Se conservará su historial cronológico de movimientos.`"
      confirm-text="Confirmar Baja"
      cancel-text="Cancelar"
      :is-loading="isSubmitting"
      @confirm="handleConfirmDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- Overlay de Carga Global Corporativo -->
    <ActionLoader
      :is-open="showActionLoader"
      :message="actionLoaderMessage"
    />
  </div>
</template>

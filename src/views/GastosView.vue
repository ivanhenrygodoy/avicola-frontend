<script setup>
import { ref, computed, onMounted } from 'vue'
import { useGastosStore } from '@/stores/gastos'
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
  DollarSign,
  Receipt,
  Tag,
  Plus,
  Pencil,
  Trash2,
  Search,
  SearchX,
  Calendar,
} from 'lucide-vue-next'

const gastosStore = useGastosStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()

// Modales y loaders
const showGastoModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const isSubmitting = ref(false)
const showActionLoader = ref(false)
const actionLoaderMessage = ref('')
const deleteTarget = ref(null)

// Formulario de Gastos
const defaultGastoForm = () => ({
  id: null,
  id_categoria_gasto: '',
  id_division: '',
  fecha: new Date().toISOString().split('T')[0],
  monto: '',
  concepto: '',
  proveedor: '',
  observaciones: '',
})

const gastoForm = ref(defaultGastoForm())
const gastoErrors = ref({
  id_categoria_gasto: '',
  monto: '',
  concepto: '',
  fecha: '',
})

// Opciones de categorías de gastos
const categoriaFiltroOptions = computed(() => {
  return gastosStore.categorias.map((c) => ({
    value: String(c.id),
    label: c.nombre,
  }))
})

const categoriaFormOptions = computed(() => {
  return gastosStore.categorias.map((c) => ({
    value: c.id,
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

const divisionFormOptions = computed(() => {
  const options = [{ value: '', label: '-- General (Toda la granja) --' }]
  const casitas = instalacionesStore.casitas || []
  casitas.forEach((c) => {
    if (c.divisiones && c.divisiones.length > 0) {
      c.divisiones.forEach((d) => {
        options.push({
          value: d.id,
          label: `${d.nombre} (${c.nombre})`,
        })
      })
    }
  })
  return options
})

// Convertir fecha serializada d-m-Y a YYYY-MM-DD para <input type="date">
const toInputDate = (val) => {
  if (!val) return new Date().toISOString().split('T')[0]
  if (typeof val === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(val)) {
    const [d, m, y] = val.split('-')
    return `${y}-${m}-${d}`
  }
  return val.substring(0, 10)
}

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

// Apertura de Modales
const openCreateModal = () => {
  isEditing.value = false
  gastoForm.value = defaultGastoForm()
  gastoErrors.value = { id_categoria_gasto: '', monto: '', concepto: '', fecha: '' }
  showGastoModal.value = true
}

const openEditModal = (item) => {
  isEditing.value = true
  gastoForm.value = {
    id: item.id,
    id_categoria_gasto: item.id_categoria_gasto,
    id_division: item.id_division || '',
    fecha: toInputDate(item.fecha),
    monto: item.monto,
    concepto: item.concepto,
    proveedor: item.proveedor || '',
    observaciones: item.observaciones || '',
  }
  gastoErrors.value = { id_categoria_gasto: '', monto: '', concepto: '', fecha: '' }
  showGastoModal.value = true
}

// Envío del Formulario
const handleSubmit = async () => {
  gastoErrors.value = { id_categoria_gasto: '', monto: '', concepto: '', fecha: '' }

  let hasError = false
  if (!gastoForm.value.id_categoria_gasto) {
    gastoErrors.value.id_categoria_gasto = 'Debes seleccionar una categoría'
    hasError = true
  }
  if (!gastoForm.value.fecha) {
    gastoErrors.value.fecha = 'La fecha del gasto es obligatoria'
    hasError = true
  }
  if (!gastoForm.value.monto || Number(gastoForm.value.monto) <= 0) {
    gastoErrors.value.monto = 'El monto debe ser mayor a 0'
    hasError = true
  }
  if (!gastoForm.value.concepto?.trim()) {
    gastoErrors.value.concepto = 'El concepto o descripción es obligatorio'
    hasError = true
  }

  if (hasError) return

  isSubmitting.value = true
  actionLoaderMessage.value = isEditing.value ? 'Actualizando gasto...' : 'Guardando gasto...'
  showActionLoader.value = true

  const payload = {
    id_categoria_gasto: Number(gastoForm.value.id_categoria_gasto),
    id_division: gastoForm.value.id_division ? Number(gastoForm.value.id_division) : null,
    fecha: gastoForm.value.fecha,
    monto: Number(gastoForm.value.monto),
    concepto: gastoForm.value.concepto.trim(),
    proveedor: gastoForm.value.proveedor?.trim() || null,
    observaciones: gastoForm.value.observaciones?.trim() || null,
  }

  try {
    if (isEditing.value) {
      await gastosStore.updateGasto(gastoForm.value.id, payload)
      notify.success('Gasto actualizado exitosamente.')
    } else {
      await gastosStore.addGasto(payload)
      notify.success('Gasto registrado exitosamente.')
    }
    showGastoModal.value = false
  } catch (err) {
    console.error('Error guardando gasto:', err)
    if (err.response?.status === 422 && err.response.data?.errors) {
      const errs = err.response.data.errors
      if (errs.id_categoria_gasto) gastoErrors.value.id_categoria_gasto = errs.id_categoria_gasto[0]
      if (errs.monto) gastoErrors.value.monto = errs.monto[0]
      if (errs.concepto) gastoErrors.value.concepto = errs.concepto[0]
      if (errs.fecha) gastoErrors.value.fecha = errs.fecha[0]
    } else {
      notify.error('No se pudo procesar el gasto.')
    }
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
  }
}

// Eliminación
const confirmDelete = (item) => {
  deleteTarget.value = item
  showDeleteModal.value = true
}

const executeDelete = async () => {
  if (!deleteTarget.value) return
  isSubmitting.value = true
  actionLoaderMessage.value = 'Eliminando gasto...'
  showActionLoader.value = true

  try {
    await gastosStore.removeGasto(deleteTarget.value.id)
    notify.success('Gasto eliminado correctamente.')
    showDeleteModal.value = false
  } catch (err) {
    notify.error('No se pudo eliminar el gasto seleccionado.')
  } finally {
    isSubmitting.value = false
    showActionLoader.value = false
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
      <div class="flex items-center justify-between flex-wrap gap-4 border-b border-borde pb-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">
            Control de Gastos y Finanzas Operativas
          </h2>
          <p class="text-sm text-verdoso-muted mt-1">
            Registro de egresos por alimentación, insumos veterinarios, mantenimiento e infraestructura.
          </p>
        </div>
      </div>

      <!-- Indicadores Clave (StatCards) -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Gastos (Filtro Actual)"
          :value="`$${(gastosStore.stats.total_gastos || 0).toFixed(2)}`"
          value-color-class="text-bosque"
        />
        <StatCard
          title="Total del Mes Actual"
          :value="`$${(gastosStore.stats.total_mes_actual || 0).toFixed(2)}`"
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
        :loading="gastosStore.loading"
        @search="handleSearch"
        @clear="handleClear"
      >
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
          <!-- Búsqueda libre por texto -->
          <FloatingInput
            v-model="gastosStore.filters.search"
            label="Buscar por concepto o proveedor"
            :icon="Search"
            @enter="handleSearch"
          />

          <!-- Categoría -->
          <FloatingSelect
            v-model="gastosStore.filters.id_categoria_gasto"
            label="Categoría de Gasto"
            :options="categoriaFiltroOptions"
          />

          <!-- División / Corral -->
          <FloatingSelect
            v-model="gastosStore.filters.id_division"
            label="Corral / División"
            :options="divisionFiltroOptions"
          />

          <!-- Fecha Inicio -->
          <FloatingInput
            v-model="gastosStore.filters.fecha_inicio"
            label="Desde"
            type="date"
            @enter="handleSearch"
          />

          <!-- Fecha Fin -->
          <FloatingInput
            v-model="gastosStore.filters.fecha_fin"
            label="Hasta"
            type="date"
            @enter="handleSearch"
          />
        </div>

        <template #action>
          <button
            type="button"
            @click="openCreateModal"
            class="px-5 py-2.5 btn-principal text-sm shadow-xs flex items-center gap-1.5 ml-1 cursor-pointer"
          >
            <Plus class="w-4 h-4" />
            <span>Registrar gasto</span>
          </button>
        </template>
      </FilterBar>

      <!-- Tabla de Gastos -->
      <div class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
        <!-- Indicador de Carga Estandarizado con Imagotipo Corporativo (SOLID) -->
        <div v-if="gastosStore.loading" class="p-12 text-center flex flex-col items-center justify-center">
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
                <th scope="col" class="px-6 py-4">Concepto</th>
                <th scope="col" class="px-6 py-4">Categoría</th>
                <th scope="col" class="px-6 py-4">Ubicación / Corral</th>
                <th scope="col" class="px-6 py-4 text-right">Monto</th>
                <th scope="col" class="px-6 py-4">Proveedor</th>
                <th scope="col" class="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-borde">
              <tr
                v-for="item in gastosStore.gastos"
                :key="item.id"
                class="hover:bg-crema/40 transition-colors"
              >
                <!-- Fecha (formateada desde backend) -->
                <td class="px-6 py-4 whitespace-nowrap text-verdoso">
                  {{ item.fecha }}
                </td>

                <!-- Concepto -->
                <td class="px-6 py-4">
                  <div class="text-verdoso">
                    {{ item.concepto }}
                  </div>
                  <div v-if="item.observaciones" class="text-xs text-verdoso-muted truncate max-w-xs">
                    {{ item.observaciones }}
                  </div>
                </td>

                <!-- Categoría (texto normal estándar) -->
                <td class="px-6 py-4 whitespace-nowrap text-verdoso">
                  {{ item.categoria?.nombre || 'General' }}
                </td>

                <!-- Ubicación / Corral (combinado) -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-verdoso">
                    {{ item.division?.nombre || 'General' }}
                  </div>
                  <div class="text-xs text-verdoso-muted">
                    {{ item.division?.casita?.nombre || 'Toda la granja' }}
                  </div>
                </td>

                <!-- Monto -->
                <td class="px-6 py-4 whitespace-nowrap text-right text-verdoso">
                  ${{ Number(item.monto).toFixed(2) }}
                </td>

                <!-- Proveedor -->
                <td class="px-6 py-4 whitespace-nowrap text-verdoso-muted text-xs">
                  {{ item.proveedor || '—' }}
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-right">
                  <div class="inline-flex items-center gap-1">
                    <button
                      type="button"
                      @click="openEditModal(item)"
                      class="p-1.5 text-verdoso-muted hover:text-bosque hover:bg-crema rounded-lg transition-colors cursor-pointer"
                      title="Editar gasto"
                    >
                      <Pencil class="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      @click="confirmDelete(item)"
                      class="p-1.5 text-verdoso-muted hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar gasto"
                    >
                      <Trash2 class="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Estado Vacío -->
              <tr v-if="gastosStore.gastos.length === 0">
                <td colspan="7" class="px-6 py-12 text-center text-verdoso-muted">
                  <div class="flex flex-col items-center justify-center">
                    <SearchX class="w-10 h-10 text-salvia/40 mb-2" />
                    <p class="text-sm font-semibold text-verdoso">No se encontraron gastos</p>
                    <p class="text-xs text-verdoso-muted mt-0.5">
                      Intenta ajustar los filtros de búsqueda o registra un nuevo gasto.
                    </p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <PaginationBar
          :current-page="gastosStore.meta.current_page"
          :last-page="gastosStore.meta.last_page"
          :per-page="gastosStore.meta.per_page"
          :total="gastosStore.meta.total"
          item-label="gastos"
          @update:page="handlePageChange"
          @update:per-page="handlePerPageChange"
        />
      </div>
    </main>

    <!-- Modal Registrar / Editar Gasto -->
    <BaseModal
      :is-open="showGastoModal"
      :title="isEditing ? 'Editar Gasto Operativo' : 'Registrar Nuevo Gasto'"
      max-width="lg"
      @close="showGastoModal = false"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Fecha y Monto -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Fecha *" :error="gastoErrors.fecha" required>
            <FloatingInput
              v-model="gastoForm.fecha"
              type="date"
              label="Fecha del Gasto *"
              :disabled="isSubmitting"
            />
          </FormField>

          <FormField label="Monto ($) *" :error="gastoErrors.monto" required>
            <FloatingInput
              v-model="gastoForm.monto"
              type="number"
              step="0.01"
              min="0.01"
              label="Monto ($) *"
              placeholder="0.00"
              :disabled="isSubmitting"
            />
          </FormField>
        </div>

        <!-- Categoría -->
        <FormField label="Categoría de Gasto *" :error="gastoErrors.id_categoria_gasto" required>
          <FloatingSelect
            v-model="gastoForm.id_categoria_gasto"
            label="Categoría *"
            :options="categoriaFormOptions"
            :disabled="isSubmitting"
          />
        </FormField>

        <!-- Concepto -->
        <FormField label="Concepto / Descripción *" :error="gastoErrors.concepto" required>
          <FloatingInput
            v-model="gastoForm.concepto"
            label="Concepto *"
            placeholder="Ej. Compra de concentrado para postura..."
            :disabled="isSubmitting"
          />
        </FormField>

        <!-- Ubicación / Corral (Opcional) -->
        <FloatingSelect
          v-model="gastoForm.id_division"
          label="Corral / Casita Asignada (Opcional)"
          :options="divisionFormOptions"
          :disabled="isSubmitting"
        />

        <!-- Proveedor -->
        <FloatingInput
          v-model="gastoForm.proveedor"
          label="Proveedor / Comercio (Opcional)"
          placeholder="Ej. Distribuidora Agropecuaria El Sol"
          :disabled="isSubmitting"
        />

        <!-- Observaciones -->
        <FloatingInput
          v-model="gastoForm.observaciones"
          type="textarea"
          label="Observaciones (Opcional)"
          placeholder="Detalles adicionales, número de factura o comprobante..."
          :rows="2"
          :disabled="isSubmitting"
        />

        <!-- Footer Acciones -->
        <div class="pt-4 flex items-center justify-end gap-3 border-t border-borde">
          <button
            type="button"
            @click="showGastoModal = false"
            class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
            :disabled="isSubmitting"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-6 py-2.5 btn-principal text-sm shadow-xs cursor-pointer flex items-center gap-1.5"
            :disabled="isSubmitting"
          >
            <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Gasto' }}</span>
          </button>
        </div>
      </form>
    </BaseModal>

    <!-- Modal Confirmar Eliminación -->
    <BaseConfirmModal
      :is-open="showDeleteModal"
      title="Eliminar Gasto"
      :message="`¿Estás seguro de que deseas eliminar el gasto por concepto de '${deleteTarget?.concepto}' por valor de $${Number(deleteTarget?.monto || 0).toFixed(2)}? Esta acción no se puede deshacer.`"
      confirm-text="Sí, eliminar"
      cancel-text="Cancelar"
      :is-loading="isSubmitting"
      @confirm="executeDelete"
      @cancel="showDeleteModal = false"
    />

    <!-- ActionLoader Reutilizable -->
    <ActionLoader
      :is-open="showActionLoader"
      :message="actionLoaderMessage"
    />
  </div>
</template>


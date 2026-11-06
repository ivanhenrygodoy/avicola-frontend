<script setup>
import { ref, watch } from 'vue'
import {
  FileText,
  Scale,
  ClipboardList,
  Plus,
  Trash2,
  Loader2,
} from 'lucide-vue-next'
import { useAvesStore } from '@/stores/aves'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { formatDate, toInputDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de ficha técnica detallada del ave con pestañas:
 *  1. Ficha General (datos zootécnicos y ubicación)
 *  2. Control de Peso (registro cronológico de pesajes)
 *  3. Bitácora Sanitaria (registro de incidencias, vacunas, salud)
 *
 *   <AveDetalleModal :is-open="show" :ave="ave" @close="show = false" @ave-updated="..." />
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ave: { type: Object, default: null },
})

const emit = defineEmits(['close', 'ave-updated'])

const avesStore = useAvesStore()
const notify = useNotificationStore()

const detalleTab = ref('ficha')

// Formulario de pesaje
const defaultPesoForm = () => ({
  fecha: toInputDate(null, new Date().toISOString().split('T')[0]),
  peso_kg: '',
  observaciones: '',
})
const pesoForm = ref(defaultPesoForm())
const pesoErrors = useFormErrors(['peso_kg'])
const isSubmittingPeso = ref(false)

// Formulario de bitácora sanitaria
const tipoObsOptions = [
  { value: 'Salud', label: 'Salud' },
  { value: 'Comportamiento', label: 'Comportamiento' },
  { value: 'Vacunación', label: 'Vacunación' },
  { value: 'Incidencia', label: 'Incidencia' },
  { value: 'Nutrición', label: 'Nutrición' },
  { value: 'General', label: 'General' },
]

const defaultObsForm = () => ({
  fecha: toInputDate(null, new Date().toISOString().split('T')[0]),
  tipo: 'Salud',
  titulo: '',
  descripcion: '',
  accion_tomada: '',
})
const obsForm = ref(defaultObsForm())
const obsErrors = useFormErrors(['titulo', 'descripcion'])
const isSubmittingObs = ref(false)

const OBSERVACION_VARIANT = {
  Salud: 'danger',
  Vacunación: 'success',
  Comportamiento: 'info',
  Nutrición: 'warning',
  Incidencia: 'alert',
}

watch(
  () => [props.isOpen, props.ave],
  async ([abierto, a]) => {
    if (!abierto || !a?.id) return
    detalleTab.value = 'ficha'
    pesoForm.value = defaultPesoForm()
    obsForm.value = defaultObsForm()
    pesoErrors.clear()
    obsErrors.clear()

    try {
      await Promise.all([
        avesStore.fetchPesos(a.id),
        avesStore.fetchObservaciones(a.id),
      ])
    } catch (err) {
      console.error('Error cargando historial de seguimiento del ave:', err)
    }
  }
)

const handleSubmitPeso = async () => {
  pesoErrors.clear()
  if (!pesoForm.value.peso_kg || Number(pesoForm.value.peso_kg) <= 0) {
    pesoErrors.set('peso_kg', 'Ingresa un peso válido mayor a 0 kg')
    return
  }

  isSubmittingPeso.value = true
  try {
    const res = await avesStore.addPeso(props.ave.id, {
      fecha: pesoForm.value.fecha,
      peso_kg: Number(pesoForm.value.peso_kg),
      observaciones: pesoForm.value.observaciones || null,
    })
    if (res?.ave?.peso_actual_kg !== undefined) {
      emit('ave-updated', { ...props.ave, peso_actual_kg: res.ave.peso_actual_kg })
    }
    notify.success('Pesaje registrado correctamente.')
    pesoForm.value = defaultPesoForm()
  } catch (err) {
    console.error('Error al registrar peso:', err)
    notify.error('No se pudo registrar el pesaje.')
  } finally {
    isSubmittingPeso.value = false
  }
}

const handleDeletePeso = async (idPeso) => {
  try {
    const res = await avesStore.deletePeso(props.ave.id, idPeso)
    if (res?.ave?.peso_actual_kg !== undefined) {
      emit('ave-updated', { ...props.ave, peso_actual_kg: res.ave.peso_actual_kg })
    }
    notify.success('Registro de pesaje eliminado.')
  } catch (err) {
    console.error('Error eliminando pesaje:', err)
    notify.error('No se pudo eliminar el pesaje.')
  }
}

const handleSubmitObs = async () => {
  obsErrors.clear()
  if (!String(obsForm.value.titulo || '').trim()) {
    obsErrors.set('titulo', 'El título o motivo es obligatorio')
    return
  }
  if (!String(obsForm.value.descripcion || '').trim()) {
    obsErrors.set('descripcion', 'La descripción es obligatoria')
    return
  }

  isSubmittingObs.value = true
  try {
    await avesStore.addObservacion(props.ave.id, {
      fecha: obsForm.value.fecha,
      tipo: obsForm.value.tipo,
      titulo: obsForm.value.titulo.trim(),
      descripcion: obsForm.value.descripcion.trim(),
      accion_tomada: obsForm.value.accion_tomada?.trim() || null,
    })
    notify.success('Evento de bitácora registrado.')
    obsForm.value = defaultObsForm()
  } catch (err) {
    console.error('Error registrando observación:', err)
    notify.error('No se pudo registrar la observación.')
  } finally {
    isSubmittingObs.value = false
  }
}

const handleDeleteObs = async (idObs) => {
  try {
    await avesStore.deleteObservacion(props.ave.id, idObs)
    notify.success('Registro de bitácora eliminado.')
  } catch (err) {
    console.error('Error eliminando evento:', err)
    notify.error('No se pudo eliminar el registro.')
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen && !!ave"
    max-width="4xl"
    @close="$emit('close')"
  >
    <template #header>
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <StatusBadge variant="neutral">{{ ave?.especie?.nombre || 'Ave' }}</StatusBadge>
            <StatusBadge :variant="ave?.estado === 'activa' ? 'success' : 'danger'">
              {{ ave?.estado === 'activa' ? 'Activa' : 'Baja' }}
            </StatusBadge>
          </div>
          <span class="text-xs text-verdoso-muted font-mono">
            Código: <span class="font-bold text-verdoso">{{ ave?.codigo }}</span>
          </span>
        </div>

        <h3 class="text-xl font-bold text-verdoso">
          {{ ave?.nombre ? `"${ave?.nombre}"` : ave?.codigo }}
        </h3>

        <!-- Navegación de Pestañas Ergonómica (SOLID - Impeccable) -->
        <div class="flex items-center gap-2 border-b border-borde pt-1">
          <button
            type="button"
            @click="detalleTab = 'ficha'"
            :class="[
              'px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer',
              detalleTab === 'ficha'
                ? 'border-bosque text-bosque bg-salvia-50/60 font-bold'
                : 'border-transparent text-verdoso-muted hover:text-verdoso hover:bg-salvia-50/20'
            ]"
          >
            <FileText class="w-4 h-4" />
            <span>Ficha General</span>
          </button>
          <button
            type="button"
            @click="detalleTab = 'pesos'"
            :class="[
              'px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer',
              detalleTab === 'pesos'
                ? 'border-bosque text-bosque bg-salvia-50/60 font-bold'
                : 'border-transparent text-verdoso-muted hover:text-verdoso hover:bg-salvia-50/20'
            ]"
          >
            <Scale class="w-4 h-4" />
            <span>Control de Peso</span>
            <StatusBadge size="sm">{{ avesStore.pesos.length }}</StatusBadge>
          </button>
          <button
            type="button"
            @click="detalleTab = 'bitacora'"
            :class="[
              'px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer',
              detalleTab === 'bitacora'
                ? 'border-bosque text-bosque bg-salvia-50/60 font-bold'
                : 'border-transparent text-verdoso-muted hover:text-verdoso hover:bg-salvia-50/20'
            ]"
          >
            <ClipboardList class="w-4 h-4" />
            <span>Bitácora Sanitaria</span>
            <StatusBadge size="sm">{{ avesStore.observaciones.length }}</StatusBadge>
          </button>
        </div>
      </div>
    </template>

    <!-- PESTAÑA 1: FICHA GENERAL (Solo Lectura) -->
    <div v-if="detalleTab === 'ficha'" class="space-y-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <!-- Especie -->
        <div class="p-3.5 bg-white border border-borde rounded-xl shadow-2xs">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Especie</span>
          <span class="text-sm font-semibold text-verdoso mt-0.5 block">
            {{ ave?.especie?.nombre || '—' }}
          </span>
        </div>

        <!-- Sexo -->
        <div class="p-3.5 bg-white border border-borde rounded-xl shadow-2xs">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Sexo</span>
          <span class="text-sm font-semibold text-verdoso mt-0.5 block">
            {{ ave?.sexo?.nombre || '—' }}
          </span>
        </div>

        <!-- Raza -->
        <div class="p-3.5 bg-white border border-borde rounded-xl shadow-2xs">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Raza</span>
          <span class="text-sm font-semibold text-verdoso mt-0.5 block">
            {{ ave?.raza || 'Criolla' }}
          </span>
        </div>

        <!-- Propósito -->
        <div class="p-3.5 bg-white border border-borde rounded-xl shadow-2xs">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Propósito</span>
          <span class="text-sm font-semibold text-verdoso mt-0.5 block">
            {{ ave?.proposito?.nombre || '—' }}
          </span>
        </div>

        <!-- Peso Actual -->
        <div class="p-3.5 bg-white border border-borde rounded-xl shadow-2xs">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Peso Actual</span>
          <span class="text-sm font-semibold text-bosque mt-0.5 block">
            {{ ave?.peso_actual_kg ? `${ave.peso_actual_kg} kg` : 'No registrado' }}
          </span>
        </div>

        <!-- Fecha de Ingreso -->
        <div class="p-3.5 bg-white border border-borde rounded-xl shadow-2xs">
          <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Fecha de Ingreso</span>
          <span class="text-sm font-semibold text-verdoso mt-0.5 block">
            {{ formatDate(ave?.fecha_ingreso) }}
          </span>
        </div>
      </div>

      <!-- Ubicación Física Actual (Casita y Corral) -->
      <div class="p-4 bg-white border border-borde rounded-xl shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Ubicación Física Actual</span>
        <div class="flex items-center gap-2 text-sm text-verdoso">
          <span class="font-semibold">{{ ave?.division?.casita?.nombre || 'Sin casita asignada' }}</span>
          <span v-if="ave?.division">•</span>
          <span v-if="ave?.division" class="text-salvia">{{ ave.division.nombre }}</span>
        </div>
      </div>

      <!-- Observaciones -->
      <div v-if="ave?.observaciones" class="p-4 bg-white border border-borde rounded-xl shadow-2xs space-y-1">
        <span class="text-[11px] font-bold text-salvia uppercase tracking-wider block">Observaciones y Rasgos</span>
        <p class="text-xs text-verdoso leading-relaxed whitespace-pre-line">
          {{ ave.observaciones }}
        </p>
      </div>
    </div>

    <!-- PESTAÑA 2: CONTROL DE PESO -->
    <div v-else-if="detalleTab === 'pesos'" class="space-y-5">
      <!-- Formulario para agregar pesaje -->
      <div class="p-5 bg-white border border-borde rounded-2xl shadow-2xs space-y-4">
        <div class="border-b border-borde pb-2.5">
          <h4 class="text-sm font-bold text-verdoso">Registrar Nuevo Pesaje</h4>
          <p class="text-xs text-verdoso-muted mt-0.5">Captura el pesaje de control para actualizar el registro del ave.</p>
        </div>

        <form @submit.prevent="handleSubmitPeso" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="peso-fecha"
              v-model="pesoForm.fecha"
              type="date"
              label="Fecha de Pesaje"
              required
              :disabled="isSubmittingPeso"
            />
            <FormField
              id="peso-kg"
              v-model="pesoForm.peso_kg"
              type="number"
              step="0.01"
              min="0.01"
              label="Peso (kg)"
              placeholder="Ej. 2.15"
              required
              :error="pesoErrors.fields.peso_kg"
              :disabled="isSubmittingPeso"
              @input="pesoErrors.set('peso_kg', '')"
            />
            <FormField
              id="peso-notas"
              v-model="pesoForm.observaciones"
              label="Notas (Opcional)"
              placeholder="Ej. Control quincenal"
              :disabled="isSubmittingPeso"
            />
          </div>

          <div class="flex items-center justify-end pt-1">
            <button
              type="submit"
              class="px-6 py-2.5 btn-principal text-xs flex items-center gap-1.5 shadow-xs cursor-pointer font-semibold"
              :disabled="isSubmittingPeso"
            >
              <Plus class="w-4 h-4" />
              <span>Registrar Pesaje</span>
            </button>
          </div>
        </form>
      </div>

      <!-- Historial de Pesajes -->
      <div class="border border-borde rounded-2xl overflow-hidden bg-white shadow-2xs">
        <div v-if="avesStore.loadingPesos" class="py-8 text-center text-xs text-salvia flex items-center justify-center gap-2">
          <Loader2 class="w-4 h-4 animate-spin" />
          Cargando historial de peso...
        </div>
        <div v-else-if="avesStore.pesos.length === 0" class="py-10 text-center text-xs text-verdoso-muted">
          <Scale class="w-8 h-8 text-salvia/40 mx-auto mb-2" />
          No hay registros de pesaje para esta ave.
        </div>
        <table v-else class="w-full text-left text-xs">
          <thead class="bg-crema/60 text-salvia font-bold uppercase tracking-wider text-[11px] border-b border-borde">
            <tr>
              <th class="px-5 py-3">Fecha</th>
              <th class="px-5 py-3">Peso</th>
              <th class="px-5 py-3">Observaciones</th>
              <th class="px-5 py-3">Registrado Por</th>
              <th class="px-5 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-borde text-verdoso">
            <tr v-for="p in avesStore.pesos" :key="p.id" class="hover:bg-salvia-50/30 transition-colors">
              <td class="px-5 py-3 whitespace-nowrap">{{ formatDate(p.fecha) }}</td>
              <td class="px-5 py-3 whitespace-nowrap text-bosque">{{ p.peso_kg }} kg</td>
              <td class="px-5 py-3">{{ p.observaciones || '—' }}</td>
              <td class="px-5 py-3 text-salvia">{{ p.usuario?.name || 'Sistema' }}</td>
              <td class="px-5 py-3 text-right">
                <RowActionButton :icon="Trash2" tone="danger" size="sm" title="Eliminar pesaje" @click="handleDeletePeso(p.id)" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- PESTAÑA 3: BITÁCORA SANITARIA -->
    <div v-else-if="detalleTab === 'bitacora'" class="space-y-5">
      <!-- Formulario para agregar observación -->
      <div class="p-5 bg-white border border-borde rounded-2xl shadow-2xs space-y-4">
        <div class="border-b border-borde pb-2.5">
          <h4 class="text-sm font-bold text-verdoso">Registrar Evento Sanitario o de Conducta</h4>
          <p class="text-xs text-verdoso-muted mt-0.5">Bitácora de salud, vacunas, tratamientos o incidencias zootécnicas.</p>
        </div>

        <form @submit.prevent="handleSubmitObs" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              id="obs-fecha"
              v-model="obsForm.fecha"
              type="date"
              label="Fecha del Evento"
              required
              :disabled="isSubmittingObs"
            />
            <FormField
              id="obs-tipo"
              v-model="obsForm.tipo"
              type="select"
              label="Tipo de Evento"
              required
              :options="tipoObsOptions"
              :disabled="isSubmittingObs"
            />
            <FormField
              id="obs-titulo"
              v-model="obsForm.titulo"
              label="Título / Motivo"
              placeholder="Ej. Revisión ocular / Vacuna"
              required
              :error="obsErrors.fields.titulo"
              :disabled="isSubmittingObs"
              @input="obsErrors.set('titulo', '')"
            />
          </div>

          <FormField
            id="obs-descripcion"
            v-model="obsForm.descripcion"
            type="textarea"
            label="Descripción del Evento"
            placeholder="Detalle de los síntomas observados o procedimiento aplicado..."
            required
            :rows="2"
            :error="obsErrors.fields.descripcion"
            :disabled="isSubmittingObs"
            @input="obsErrors.set('descripcion', '')"
          />

          <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
            <div class="sm:col-span-8">
              <FormField
                id="obs-accion"
                v-model="obsForm.accion_tomada"
                label="Acción Tomada (Opcional)"
                placeholder="Ej. Aislamiento temporal / Administración de vitaminas..."
                :disabled="isSubmittingObs"
              />
            </div>
            <div class="sm:col-span-4 flex justify-end">
              <button
                type="submit"
                class="w-full sm:w-auto px-6 py-2.5 btn-principal text-xs flex items-center justify-center gap-1.5 shadow-xs cursor-pointer font-semibold"
                :disabled="isSubmittingObs"
              >
                <Plus class="w-4 h-4" />
                <span>Registrar Evento</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Timeline / Lista de Eventos -->
      <div class="border border-borde rounded-2xl overflow-hidden p-4 bg-crema/20 space-y-3">
        <div v-if="avesStore.loadingObservaciones" class="py-8 text-center text-xs text-salvia flex items-center justify-center gap-2">
          <Loader2 class="w-4 h-4 animate-spin" />
          Cargando bitácora sanitaria...
        </div>
        <div v-else-if="avesStore.observaciones.length === 0" class="py-10 text-center text-xs text-verdoso-muted">
          <ClipboardList class="w-8 h-8 text-salvia/40 mx-auto mb-2" />
          No hay eventos sanitarios u observaciones registradas para esta ave.
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="obs in avesStore.observaciones"
            :key="obs.id"
            class="p-4 bg-white border border-borde rounded-xl shadow-2xs hover:border-salvia/60 transition-all"
          >
            <div class="flex items-center justify-between text-xs mb-2">
              <div class="flex items-center gap-2">
                <StatusBadge :variant="OBSERVACION_VARIANT[obs.tipo] || 'neutral'" size="sm">
                  {{ obs.tipo }}
                </StatusBadge>
                <span class="text-salvia text-[11px] font-mono">{{ formatDate(obs.fecha) }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] text-verdoso-muted font-normal">{{ obs.usuario?.name || 'Sistema' }}</span>
                <RowActionButton :icon="Trash2" tone="danger" size="sm" title="Eliminar evento" @click="handleDeleteObs(obs.id)" />
              </div>
            </div>
            <h5 class="text-sm font-semibold text-verdoso">{{ obs.titulo }}</h5>
            <p class="text-xs text-verdoso-muted mt-1 leading-relaxed">{{ obs.descripcion }}</p>
            <div v-if="obs.accion_tomada" class="mt-3 p-2.5 bg-salvia-50/70 border border-salvia/20 rounded-xl text-xs text-verdoso flex items-start gap-1.5">
              <span class="font-bold text-bosque whitespace-nowrap">Acción tomada:</span>
              <span>{{ obs.accion_tomada }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer CENTRADO -->
    <template #footer>
      <div class="flex justify-center w-full">
        <button
          type="button"
          @click="$emit('close')"
          class="px-6 py-2 btn-secundario text-sm"
        >
          Cerrar
        </button>
      </div>
    </template>
  </BaseModal>
</template>


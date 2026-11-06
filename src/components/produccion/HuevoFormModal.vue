<script setup>
import { computed, ref, watch } from 'vue'
import { AlertCircle } from 'lucide-vue-next'
import { useProduccionStore } from '@/stores/produccion'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import { toInputDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de alta y edición de una recolección de huevos, con estado propio.
 *
 *   <HuevoFormModal :is-open="show" :huevo="seleccionado" @close="show = false" />
 *
 * `huevo`: el registro a editar, o `null` para crear. El formulario se reinicia cada vez
 * que el modal se abre. El overlay de carga es el de la vista (useActionLoader).
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  huevo: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const produccionStore = useProduccionStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const isEditing = computed(() => props.huevo !== null)

const defaultForm = () => ({
  id: null,
  id_division: '',
  fecha: new Date().toISOString().split('T')[0],
  cantidad_recolectada: 0,
  cantidad_rotos: 0,
  observaciones: '',
})

const form = ref(defaultForm())
const errors = useFormErrors(['id_division', 'fecha', 'cantidad_recolectada', 'cantidad_rotos'])

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const h = props.huevo
    form.value = h
      ? {
          id: h.id,
          id_division: h.id_division,
          fecha: toInputDate(h.fecha),
          cantidad_recolectada: h.cantidad_recolectada,
          cantidad_rotos: h.cantidad_rotos,
          observaciones: h.observaciones || '',
        }
      : defaultForm()
  },
)

// FormField no agrega opción vacía: va incluida para que el campo arranque sin selección
const divisionOptions = computed(() => {
  const options = [{ value: '', label: 'Seleccionar corral o división...' }]
  for (const casita of instalacionesStore.casitas || []) {
    for (const d of casita.divisiones || []) {
      options.push({ value: d.id, label: `${casita.nombre} • ${d.nombre}` })
    }
  }
  return options
})

// Cálculo reactivo en vivo de huevos aprovechables
const aprovechables = computed(() => {
  const recolectados = Number(form.value.cantidad_recolectada) || 0
  const rotos = Number(form.value.cantidad_rotos) || 0
  return Math.max(0, recolectados - rotos)
})

const esRotosInvalido = computed(() => {
  const recolectados = Number(form.value.cantidad_recolectada) || 0
  const rotos = Number(form.value.cantidad_rotos) || 0
  return rotos > recolectados
})

const validar = () => {
  errors.clear()

  if (!form.value.id_division) errors.set('id_division', 'Debe seleccionar un corral o división.')
  if (!form.value.fecha) errors.set('fecha', 'La fecha de recolección es obligatoria.')

  const recolectada = Number(form.value.cantidad_recolectada)
  if (form.value.cantidad_recolectada === '' || isNaN(recolectada) || recolectada < 0) {
    errors.set('cantidad_recolectada', 'La cantidad recolectada debe ser mayor o igual a 0.')
  }

  const rotos = Number(form.value.cantidad_rotos)
  if (isNaN(rotos) || rotos < 0) {
    errors.set('cantidad_rotos', 'La cantidad de huevos rotos no puede ser negativa.')
  } else if (rotos > recolectada) {
    errors.set('cantidad_rotos', 'Los huevos rotos no pueden superar a los recolectados.')
  }

  return !errors.has()
}

const submit = async () => {
  if (!validar()) return

  const payload = {
    id_division: Number(form.value.id_division),
    fecha: form.value.fecha,
    cantidad_recolectada: Number(form.value.cantidad_recolectada),
    cantidad_rotos: Number(form.value.cantidad_rotos || 0),
    observaciones: form.value.observaciones?.trim() || null,
  }

  try {
    if (isEditing.value) {
      await run('Actualizando registro de postura...', () => produccionStore.updateHuevo(form.value.id, payload))
      notify.success('Registro de postura actualizado exitosamente.')
    } else {
      await run('Registrando postura de huevos...', () => produccionStore.addHuevo(payload))
      notify.success('Recolección de huevos registrada exitosamente.')
    }
    emit('saved')
    emit('close')
  } catch (err) {
    if (errors.applyServerErrors(err)) {
      notify.warning(err.response.data?.message || 'Error de validación al registrar postura.')
    } else {
      notify.error(err.response?.data?.message || 'Error al guardar el registro de postura.')
    }
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="isEditing ? 'Editar Registro de Postura' : 'Registrar Recolección de Huevos'"
    max-width="md"
    @close="emit('close')"
  >
    <form id="huevo-form" class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        id="huevo-division"
        v-model="form.id_division"
        type="select"
        label="Corral / División"
        required
        :options="divisionOptions"
        :error="errors.fields.id_division"
        :disabled="isSubmitting"
        @input="errors.set('id_division', '')"
      />

      <FormField
        id="huevo-fecha"
        v-model="form.fecha"
        type="date"
        label="Fecha de Recolección"
        required
        :error="errors.fields.fecha"
        :disabled="isSubmitting"
        @input="errors.set('fecha', '')"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="huevo-recolectada"
          v-model="form.cantidad_recolectada"
          type="number"
          label="Huevos Recolectados"
          placeholder="0"
          required
          :error="errors.fields.cantidad_recolectada"
          :disabled="isSubmitting"
          @input="errors.set('cantidad_recolectada', '')"
        />

        <FormField
          id="huevo-rotos"
          v-model="form.cantidad_rotos"
          type="number"
          label="Huevos Rotos / Mermas"
          placeholder="0"
          :error="errors.fields.cantidad_rotos"
          :disabled="isSubmitting"
          @input="errors.set('cantidad_rotos', '')"
        />
      </div>

      <!-- Banner reactivo de cálculo de aprovechables -->
      <div class="p-3.5 rounded-xl bg-bosque-50 border border-bosque/20 flex items-center justify-between text-sm">
        <span class="font-medium text-verdoso">Huevos Aprovechables (Calculado):</span>
        <span class="text-base font-extrabold text-bosque">{{ aprovechables }} unidades</span>
      </div>

      <!-- Alerta de inconsistencia si rotos > recolectados -->
      <div
        v-if="esRotosInvalido"
        class="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2"
      >
        <AlertCircle class="w-4 h-4 shrink-0 text-red-600" />
        <span>La cantidad de huevos rotos no puede ser mayor al total recolectado.</span>
      </div>

      <FormField
        id="huevo-observaciones"
        v-model="form.observaciones"
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
        class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        :disabled="isSubmitting"
        @click="emit('close')"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="px-5 py-2 btn-principal text-sm cursor-pointer"
        :disabled="isSubmitting || esRotosInvalido"
        @click="submit"
      >
        {{ isEditing ? 'Guardar Cambios' : 'Registrar Postura' }}
      </button>
    </template>
  </BaseModal>
</template>

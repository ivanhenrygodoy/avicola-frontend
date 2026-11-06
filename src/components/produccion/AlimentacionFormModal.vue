<script setup>
import { computed, ref, watch } from 'vue'
import { useProduccionStore } from '@/stores/produccion'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import { toInputDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de alta y edición de una ración de alimento, con estado propio.
 *
 *   <AlimentacionFormModal :is-open="show" :racion="seleccionada" @close="show = false" />
 *
 * `racion`: el registro a editar, o `null` para crear. El formulario se reinicia cada vez
 * que el modal se abre. El overlay de carga es el de la vista (useActionLoader).
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  racion: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const produccionStore = useProduccionStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const isEditing = computed(() => props.racion !== null)

const defaultForm = () => ({
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

const form = ref(defaultForm())
const errors = useFormErrors(['id_division', 'id_tipo_alimento', 'fecha', 'cantidad', 'costo_total'])

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const r = props.racion
    form.value = r
      ? {
          id: r.id,
          id_division: r.id_division,
          id_tipo_alimento: r.id_tipo_alimento,
          fecha: toInputDate(r.fecha),
          hora: r.hora ? r.hora.substring(0, 5) : '',
          cantidad: r.cantidad,
          unidad_medida: r.unidad_medida || 'kg',
          costo_total: r.costo_total,
          observaciones: r.observaciones || '',
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

const tipoAlimentoOptions = computed(() => [
  { value: '', label: 'Seleccionar tipo de alimento...' },
  ...(produccionStore.tiposAlimento || []).map((t) => ({ value: t.id, label: t.nombre })),
])

const unidadOptions = [
  { value: 'kg', label: 'Kilogramos (kg)' },
  { value: 'lb', label: 'Libras (lb)' },
  { value: 'g', label: 'Gramos (g)' },
]

const validar = () => {
  errors.clear()

  if (!form.value.id_division) errors.set('id_division', 'Debe seleccionar un corral o división.')
  if (!form.value.id_tipo_alimento) errors.set('id_tipo_alimento', 'Debe seleccionar el tipo de alimento.')
  if (!form.value.fecha) errors.set('fecha', 'La fecha de suministro es obligatoria.')

  const cantidad = Number(form.value.cantidad)
  if (form.value.cantidad === '' || isNaN(cantidad) || cantidad <= 0) {
    errors.set('cantidad', 'La cantidad suministrada debe ser mayor a 0.')
  }

  if (form.value.costo_total !== null && form.value.costo_total !== '') {
    const costo = Number(form.value.costo_total)
    if (isNaN(costo) || costo < 0) errors.set('costo_total', 'El costo no puede ser un valor negativo.')
  }

  return !errors.has()
}

const submit = async () => {
  if (!validar()) return

  const payload = {
    id_division: Number(form.value.id_division),
    id_tipo_alimento: Number(form.value.id_tipo_alimento),
    fecha: form.value.fecha,
    hora: form.value.hora || null,
    cantidad: Number(form.value.cantidad),
    unidad_medida: form.value.unidad_medida || 'kg',
    costo_total: form.value.costo_total ? Number(form.value.costo_total) : null,
    observaciones: form.value.observaciones?.trim() || null,
  }

  try {
    if (isEditing.value) {
      await run('Actualizando registro de ración...', () => produccionStore.updateAlimentacion(form.value.id, payload))
      notify.success('Registro de alimentación actualizado exitosamente.')
    } else {
      await run('Registrando suministro de alimento...', () => produccionStore.addAlimentacion(payload))
      notify.success('Ración de alimento registrada exitosamente.')
    }
    emit('saved')
    emit('close')
  } catch (err) {
    if (errors.applyServerErrors(err)) {
      notify.warning(err.response.data?.message || 'Error de validación al registrar alimentación.')
    } else {
      notify.error(err.response?.data?.message || 'Error al guardar el registro de ración.')
    }
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="isEditing ? 'Editar Ración de Alimento' : 'Registrar Suministro de Ración'"
    max-width="md"
    @close="emit('close')"
  >
    <form id="alimentacion-form" class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        id="alim-division"
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
        id="alim-tipo"
        v-model="form.id_tipo_alimento"
        type="select"
        label="Fórmula / Tipo de Alimento"
        required
        :options="tipoAlimentoOptions"
        :error="errors.fields.id_tipo_alimento"
        :disabled="isSubmitting"
        @input="errors.set('id_tipo_alimento', '')"
      />

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="alim-fecha"
          v-model="form.fecha"
          type="date"
          label="Fecha"
          required
          :error="errors.fields.fecha"
          :disabled="isSubmitting"
          @input="errors.set('fecha', '')"
        />

        <FormField
          id="alim-hora"
          v-model="form.hora"
          type="time"
          label="Hora de Suministro"
          :disabled="isSubmitting"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="alim-cantidad"
          v-model="form.cantidad"
          type="number"
          label="Cantidad Suministrada"
          placeholder="1.0"
          required
          :error="errors.fields.cantidad"
          :disabled="isSubmitting"
          @input="errors.set('cantidad', '')"
        />

        <FormField
          id="alim-unidad"
          v-model="form.unidad_medida"
          type="select"
          label="Unidad de Medida"
          :options="unidadOptions"
          :disabled="isSubmitting"
        />
      </div>

      <FormField
        id="alim-costo"
        v-model="form.costo_total"
        type="number"
        label="Costo Estimado ($)"
        placeholder="0.00"
        :error="errors.fields.costo_total"
        :disabled="isSubmitting"
        @input="errors.set('costo_total', '')"
      />

      <FormField
        id="alim-observaciones"
        v-model="form.observaciones"
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
        class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        :disabled="isSubmitting"
        @click="emit('close')"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="px-5 py-2 btn-principal text-sm cursor-pointer"
        :disabled="isSubmitting"
        @click="submit"
      >
        {{ isEditing ? 'Guardar Cambios' : 'Registrar Ración' }}
      </button>
    </template>
  </BaseModal>
</template>

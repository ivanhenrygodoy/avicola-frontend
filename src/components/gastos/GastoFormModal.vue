<script setup>
import { computed, ref, watch } from 'vue'
import { useGastosStore } from '@/stores/gastos'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import { toInputDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de alta y edición de un gasto operativo, con estado propio: formulario, errores,
 * validación local, envío y mapeo del 422 viven aquí. La vista solo decide cuándo abrirlo.
 *
 *   <GastoFormModal :is-open="show" :gasto="seleccionado" @close="show = false" @saved="..." />
 *
 * `gasto`: el registro a editar, o `null` para crear. Se reinicia el formulario cada vez
 * que el modal se abre. El overlay de carga es el de la vista (useActionLoader).
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  gasto: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const gastosStore = useGastosStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const isEditing = computed(() => props.gasto !== null)

const defaultForm = () => ({
  id: null,
  id_categoria_gasto: '',
  id_division: '',
  fecha: toInputDate(null, new Date().toISOString().split('T')[0]),
  monto: '',
  concepto: '',
  proveedor: '',
  observaciones: '',
})

const form = ref(defaultForm())
const errors = useFormErrors(['id_categoria_gasto', 'monto', 'concepto', 'fecha'])

// Cada apertura parte de cero (crear) o de los datos del gasto (editar)
watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const g = props.gasto
    form.value = g
      ? {
          id: g.id,
          id_categoria_gasto: g.id_categoria_gasto,
          id_division: g.id_division || '',
          fecha: toInputDate(g.fecha, new Date().toISOString().split('T')[0]),
          monto: g.monto,
          concepto: g.concepto,
          proveedor: g.proveedor || '',
          observaciones: g.observaciones || '',
        }
      : defaultForm()
  },
)

// FormField no agrega opción vacía: va incluida para que el campo arranque sin selección
// y la validación de obligatorio pueda saltar
const categoriaOptions = computed(() => [
  { value: '', label: 'Seleccionar categoría...' },
  ...gastosStore.categorias.map((c) => ({ value: c.id, label: c.nombre })),
])

const divisionOptions = computed(() => {
  const options = [{ value: '', label: '-- General (Toda la granja) --' }]
  for (const casita of instalacionesStore.casitas || []) {
    for (const d of casita.divisiones || []) {
      options.push({ value: d.id, label: `${d.nombre} (${casita.nombre})` })
    }
  }
  return options
})

const validar = () => {
  errors.clear()
  if (!form.value.id_categoria_gasto) errors.set('id_categoria_gasto', 'Debes seleccionar una categoría')
  if (!form.value.fecha) errors.set('fecha', 'La fecha del gasto es obligatoria')
  if (!form.value.monto || Number(form.value.monto) <= 0) errors.set('monto', 'El monto debe ser mayor a 0')
  if (!form.value.concepto?.trim()) errors.set('concepto', 'El concepto o descripción es obligatorio')
  return !errors.has()
}

const submit = async () => {
  if (!validar()) return

  const payload = {
    id_categoria_gasto: Number(form.value.id_categoria_gasto),
    id_division: form.value.id_division ? Number(form.value.id_division) : null,
    fecha: form.value.fecha,
    monto: Number(form.value.monto),
    concepto: form.value.concepto.trim(),
    proveedor: form.value.proveedor?.trim() || null,
    observaciones: form.value.observaciones?.trim() || null,
  }

  try {
    if (isEditing.value) {
      await run('Actualizando gasto...', () => gastosStore.updateGasto(form.value.id, payload))
      notify.success('Gasto actualizado exitosamente.')
    } else {
      await run('Guardando gasto...', () => gastosStore.addGasto(payload))
      notify.success('Gasto registrado exitosamente.')
    }
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('Error guardando gasto:', err)
    if (!errors.applyServerErrors(err)) {
      notify.error('No se pudo procesar el gasto.')
    }
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="isEditing ? 'Editar Gasto Operativo' : 'Registrar Nuevo Gasto'"
    max-width="lg"
    @close="emit('close')"
  >
    <form class="space-y-4" @submit.prevent="submit">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          id="gasto-fecha"
          v-model="form.fecha"
          type="date"
          label="Fecha del Gasto"
          required
          :error="errors.fields.fecha"
          :disabled="isSubmitting"
          @input="errors.set('fecha', '')"
        />

        <FormField
          id="gasto-monto"
          v-model="form.monto"
          type="number"
          step="0.01"
          min="0.01"
          label="Monto ($)"
          placeholder="0.00"
          required
          :error="errors.fields.monto"
          :disabled="isSubmitting"
          @input="errors.set('monto', '')"
        />
      </div>

      <FormField
        id="gasto-categoria"
        v-model="form.id_categoria_gasto"
        type="select"
        label="Categoría de Gasto"
        required
        :options="categoriaOptions"
        :error="errors.fields.id_categoria_gasto"
        :disabled="isSubmitting"
        @input="errors.set('id_categoria_gasto', '')"
      />

      <FormField
        id="gasto-concepto"
        v-model="form.concepto"
        label="Concepto / Descripción"
        placeholder="Ej. Compra de concentrado para postura..."
        required
        :error="errors.fields.concepto"
        :disabled="isSubmitting"
        @input="errors.set('concepto', '')"
      />

      <FormField
        id="gasto-division"
        v-model="form.id_division"
        type="select"
        label="Corral / Casita Asignada (Opcional)"
        :options="divisionOptions"
        :disabled="isSubmitting"
      />

      <FormField
        id="gasto-proveedor"
        v-model="form.proveedor"
        label="Proveedor / Comercio (Opcional)"
        placeholder="Ej. Distribuidora Agropecuaria El Sol"
        :disabled="isSubmitting"
      />

      <FormField
        id="gasto-observaciones"
        v-model="form.observaciones"
        type="textarea"
        label="Observaciones (Opcional)"
        placeholder="Detalles adicionales, número de factura o comprobante..."
        :rows="2"
        :disabled="isSubmitting"
      />

      <div class="pt-4 flex items-center justify-end gap-3 border-t border-borde">
        <button
          type="button"
          class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
          :disabled="isSubmitting"
          @click="emit('close')"
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
</template>

<script setup>
import { ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de alta de un corral (división) dentro de una casita, con estado propio.
 *
 *   <DivisionFormModal :is-open="show" :id-casita="casita.id" @close="show = false" />
 *
 * `idCasita`: la casita a la que se agrega el corral. El formulario se reinicia cada vez
 * que se abre.
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  idCasita: { type: Number, default: null },
})

const emit = defineEmits(['close', 'saved'])

const store = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const form = ref({ nombre: '', descripcion: '' })
const errors = useFormErrors(['nombre'])

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    form.value = { nombre: '', descripcion: '' }
  },
)

const submit = async () => {
  errors.clear()
  if (!form.value.nombre || !form.value.nombre.trim()) {
    errors.set('nombre', 'El nombre del corral es obligatorio')
    return
  }

  try {
    await run('Guardando nuevo corral...', () =>
      store.addDivision({
        id_casita: props.idCasita,
        nombre: form.value.nombre.trim(),
        descripcion: form.value.descripcion || '',
      }),
    )
    notify.success('Corral agregado exitosamente.')
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('Error al guardar corral:', err)
    const msg = err.response?.data?.message || 'Error al guardar el corral.'
    if (err.response?.status === 422) {
      errors.applyServerErrors(err)
      notify.warning(msg)
    } else {
      notify.error(msg)
    }
  }
}
</script>

<template>
  <BaseModal :is-open="isOpen" title="Agregar Corral a la Casita" max-width="md" @close="emit('close')">
    <form id="division-form" class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        id="division-nombre"
        v-model="form.nombre"
        label="Nombre del Corral"
        placeholder="Ej. División 3 o Espacio Cuarentena"
        required
        :error="errors.fields.nombre"
        @input="errors.set('nombre', '')"
      />

      <FormField
        id="division-descripcion"
        v-model="form.descripcion"
        type="textarea"
        label="Descripción"
        placeholder="Especies admitidas, condiciones físicas..."
        :rows="3"
      />
    </form>

    <template #footer>
      <div class="flex items-center justify-center gap-3 w-full">
        <button type="button" class="px-6 py-2 btn-secundario text-sm" @click="emit('close')">
          Cancelar
        </button>
        <button
          type="button"
          class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5"
          :disabled="isSubmitting"
          @click="submit"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>Guardar Corral</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de alta y edición de una casita, con estado propio.
 *
 *   <CasitaFormModal :is-open="show" :casita="seleccionada" @close="show = false" />
 *
 * `casita`: la casita a editar, o `null` para crear. Al editar, la granja queda bloqueada
 * (el backend no permite cambiarla). El formulario se reinicia cada vez que se abre.
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  casita: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const store = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const isEditing = computed(() => props.casita !== null)

const defaultForm = () => ({
  id: null,
  // Con una sola granja se preselecciona; con varias, el usuario debe elegir
  id_granja: store.granjas.length === 1 ? store.granjas[0].id : '',
  nombre: '',
  tipo: 'Gallinero',
  descripcion: '',
})

const form = ref(defaultForm())
const errors = useFormErrors(['nombre', 'id_granja'])

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const c = props.casita
    form.value = c
      ? { id: c.id, id_granja: c.id_granja, nombre: c.nombre, tipo: c.tipo, descripcion: c.descripcion || '' }
      : defaultForm()
  },
)

const tipoOptions = computed(() => store.tiposInstalacion.map((t) => ({ value: t.nombre, label: t.nombre })))

// FormField no agrega opción vacía: va incluida para que el campo arranque sin selección
// cuando hay más de una granja
const granjaOptions = computed(() => [
  { value: '', label: 'Seleccionar granja...' },
  ...store.granjas.map((g) => ({ value: g.id, label: g.nombre })),
])

const submit = async () => {
  errors.clear()
  if (!form.value.nombre || !form.value.nombre.trim()) {
    errors.set('nombre', 'El nombre de la casita es obligatorio')
    return
  }
  if (!isEditing.value && !form.value.id_granja) {
    errors.set('id_granja', 'Debes seleccionar la granja')
    return
  }

  try {
    if (isEditing.value) {
      await run('Guardando cambios en la casita...', () =>
        store.updateCasita(form.value.id, {
          nombre: form.value.nombre.trim(),
          tipo: form.value.tipo,
          descripcion: form.value.descripcion || '',
        }),
      )
      notify.success('Casita actualizada exitosamente.')
    } else {
      await run('Creando nueva casita...', () =>
        store.addCasita({
          id_granja: Number(form.value.id_granja),
          nombre: form.value.nombre.trim(),
          tipo: form.value.tipo,
          descripcion: form.value.descripcion || '',
        }),
      )
      notify.success('Casita creada exitosamente.')
    }
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('Error al guardar la casita:', err)
    const msg = err.response?.data?.message || 'Error al guardar la casita.'
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
  <BaseModal
    :is-open="isOpen"
    :title="isEditing ? 'Editar Casita' : 'Crear Nueva Casita'"
    max-width="md"
    @close="emit('close')"
  >
    <form id="casita-form" class="space-y-4" novalidate @submit.prevent="submit">
      <FormField
        id="casita-granja"
        v-model="form.id_granja"
        type="select"
        label="Granja"
        required
        :options="granjaOptions"
        :error="errors.fields.id_granja"
        :disabled="isEditing"
        @input="errors.set('id_granja', '')"
      />

      <FormField
        id="casita-nombre"
        v-model="form.nombre"
        label="Nombre de la Casita"
        placeholder="Ej. Casita 4"
        required
        :error="errors.fields.nombre"
        @input="errors.set('nombre', '')"
      />

      <FormField
        id="casita-tipo"
        v-model="form.tipo"
        type="select"
        label="Tipo de Instalación"
        :options="tipoOptions"
      />

      <FormField
        id="casita-descripcion"
        v-model="form.descripcion"
        type="textarea"
        label="Descripción"
        placeholder="Detalles constructivos, ubicación física..."
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
          <span>{{ isEditing ? 'Guardar Cambios' : 'Crear Casita' }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>

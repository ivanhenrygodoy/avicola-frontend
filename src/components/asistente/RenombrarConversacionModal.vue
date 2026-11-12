<script setup>
import { ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'
import { useFormErrors } from '@/composables/useFormErrors'
import { useAsistenteStore } from '@/stores/asistente'
import { useNotificationStore } from '@/stores/notification'
import { Loader2 } from 'lucide-vue-next'

/**
 * Cambia el nombre de una conversación del historial. El nombre se guarda como nombre manual: el nombre
 * automático nunca lo vuelve a pisar. Se muestra siempre como texto (nunca como HTML).
 */
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  // { uuid, nombre } de la conversación a renombrar
  conversacion: { type: Object, default: null },
})

const emit = defineEmits(['close', 'renamed'])

const NOMBRE_MAX = 60

const asistenteStore = useAsistenteStore()
const notify = useNotificationStore()
const errors = useFormErrors(['nombre'])

const nombre = ref('')
const guardando = ref(false)

// Cada vez que se abre, el campo parte del nombre actual y sin errores
watch(
  () => props.isOpen,
  (abierto) => {
    if (abierto) {
      nombre.value = props.conversacion?.nombre || ''
      errors.clear()
    }
  },
  { immediate: true },
)

const validar = () => {
  errors.clear()
  const valor = nombre.value.trim()
  if (!valor) {
    errors.set('nombre', 'El nombre de la conversación es obligatorio.')
    return false
  }
  if (valor.length > NOMBRE_MAX) {
    errors.set('nombre', `El nombre no puede exceder los ${NOMBRE_MAX} caracteres.`)
    return false
  }
  return true
}

const guardar = async () => {
  if (guardando.value || !props.conversacion || !validar()) return

  guardando.value = true
  try {
    await asistenteStore.renombrarConversacion(props.conversacion.uuid, nombre.value.trim())
    notify.success('Nombre actualizado.')
    emit('renamed')
    emit('close')
  } catch (err) {
    if (err.response?.status === 404) {
      notify.warning('La conversación ya no está en tu historial.')
      emit('close')
    } else if (!errors.applyServerErrors(err)) {
      console.error('Error renombrando la conversación:', err)
      notify.error('No se pudo cambiar el nombre de la conversación.')
    }
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="Cambiar nombre"
    max-width="sm"
    :closable="!guardando"
    @close="emit('close')"
  >
    <form id="renombrar-conversacion-form" @submit.prevent="guardar">
      <FormField
        id="conversacion-nombre"
        v-model="nombre"
        label="Nombre de la conversación"
        placeholder="Ej. Gastos de noviembre"
        :error="errors.fields.nombre"
        :disabled="guardando"
        required
        @input="errors.set('nombre', '')"
      />
      <p class="text-[11px] text-verdoso-muted mt-1.5 text-right">{{ nombre.trim().length }}/{{ NOMBRE_MAX }}</p>
    </form>

    <template #footer>
      <button
        type="button"
        class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        :disabled="guardando"
        @click="emit('close')"
      >
        Cancelar
      </button>
      <button
        type="submit"
        form="renombrar-conversacion-form"
        class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5 cursor-pointer"
        :disabled="guardando"
      >
        <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" aria-hidden="true" />
        <span>Guardar</span>
      </button>
    </template>
  </BaseModal>
</template>

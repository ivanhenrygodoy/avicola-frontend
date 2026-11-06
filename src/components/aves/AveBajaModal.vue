<script setup>
import { ref, watch } from 'vue'
import { Trash2, Loader2 } from 'lucide-vue-next'
import { useAvesStore } from '@/stores/aves'
import { useNotificationStore } from '@/stores/notification'
import { useActionLoader } from '@/composables/useActionLoader'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal para dar de baja a un ave con registro de motivo y observaciones.
 *
 *   <AveBajaModal :is-open="show" :ave="ave" @close="show = false" @confirmed="..." />
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ave: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirmed'])

const avesStore = useAvesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const defaultForm = () => ({
  motivo: 'Baja / Salida',
  observaciones: '',
})

const form = ref(defaultForm())

watch(
  () => props.isOpen,
  (abierto) => {
    if (abierto) form.value = defaultForm()
  }
)

const handleConfirm = async () => {
  if (!props.ave) return

  try {
    await run(`Dando de baja a ${props.ave.codigo}...`, async () => {
      await avesStore.removeAve(props.ave.id, {
        motivo: form.value.motivo?.trim() || 'Baja / Salida',
        observaciones: form.value.observaciones?.trim() || null,
      })
    })
    notify.success(`El ave ${props.ave.codigo} ha sido dada de baja correctamente y se registró el movimiento de salida.`)
    emit('confirmed')
    emit('close')
  } catch (err) {
    console.error('Error al dar de baja ave:', err)
    notify.error('Error al procesar la baja del ave.')
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen && !!ave"
    title="Dar de Baja a Ave"
    max-width="md"
    @close="$emit('close')"
  >
    <form id="baja-form" @submit.prevent="handleConfirm" class="space-y-4">
      <div class="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
        <Trash2 class="w-5 h-5 text-red-700 mt-0.5 shrink-0" />
        <div class="text-xs text-red-900 space-y-1">
          <p class="font-bold text-sm">
            ¿Dar de baja a {{ ave?.codigo }} ({{ ave?.nombre || ave?.especie?.nombre }})?
          </p>
          <p>
            El ave pasará a estado <strong>Baja</strong> y se registrará automáticamente su movimiento de <strong>Baja / Salida</strong> en el historial.
          </p>
        </div>
      </div>

      <FormField
        id="baja-motivo"
        v-model="form.motivo"
        label="Motivo de la Baja"
        placeholder="Ej. Baja / Salida, Venta, Muerte natural, Descarte"
        :disabled="isSubmitting"
      />

      <FormField
        id="baja-obs"
        v-model="form.observaciones"
        type="textarea"
        label="Observaciones (Opcional)"
        placeholder="Detalles sobre el estado o causa de la baja..."
        :rows="2"
        :disabled="isSubmitting"
      />
    </form>

    <template #footer>
      <div class="flex items-center justify-center gap-3 w-full">
        <button
          type="button"
          @click="$emit('close')"
          :disabled="isSubmitting"
          class="px-5 py-2 btn-secundario text-sm cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleConfirm"
          :disabled="isSubmitting"
          class="px-6 py-2 bg-red-700 text-white hover:bg-red-800 rounded-xl font-medium text-sm shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <Trash2 v-else class="w-4 h-4" />
          <span>Confirmar Baja</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>


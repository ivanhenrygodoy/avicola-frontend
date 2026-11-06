<script setup>
import { computed, ref, watch } from 'vue'
import { RotateCcw, Loader2 } from 'lucide-vue-next'
import { useAvesStore } from '@/stores/aves'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useActionLoader } from '@/composables/useActionLoader'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal para reactivar e incorporar un ave previamente dada de baja.
 *
 *   <AveReactivarModal :is-open="show" :ave="ave" @close="show = false" @confirmed="..." />
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ave: { type: Object, default: null },
})

const emit = defineEmits(['close', 'confirmed'])

const avesStore = useAvesStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const defaultForm = () => ({
  id_division_destino: '',
  observaciones: '',
})

const form = ref(defaultForm())

const divisionesDisponibles = computed(() => {
  const list = [{ value: '', label: '-- Sin asignación inicial --' }]
  ;(instalacionesStore.casitas || []).forEach((casita) => {
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

watch(
  () => props.isOpen,
  (abierto) => {
    if (abierto) form.value = defaultForm()
  }
)

const handleConfirm = async () => {
  if (!props.ave) return

  const payload = {
    observaciones: form.value.observaciones?.trim() || null,
  }
  if (form.value.id_division_destino) {
    payload.id_division_destino = Number(form.value.id_division_destino)
  }

  try {
    await run(`Reactivando ave ${props.ave.codigo}...`, async () => {
      await avesStore.reactivarAve(props.ave.id, payload)
    })
    notify.success(`El ave ${props.ave.codigo} ha sido reactivada e incorporada exitosamente, registrando el movimiento de reingreso.`)
    emit('confirmed')
    emit('close')
  } catch (err) {
    console.error('Error al reactivar ave:', err)
    notify.error(err.response?.data?.message || 'Error al procesar la reactivación del ave.')
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen && !!ave"
    title="Reactivar e Incorporar Ave"
    max-width="md"
    @close="$emit('close')"
  >
    <form id="reactivar-form" @submit.prevent="handleConfirm" class="space-y-4">
      <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3">
        <RotateCcw class="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
        <div class="text-xs text-emerald-900 space-y-1">
          <p class="font-bold text-sm">
            ¿Reactivar al ave {{ ave?.codigo }} ({{ ave?.nombre || ave?.especie?.nombre }})?
          </p>
          <p>
            El ave volverá a estar <strong>Activa</strong> y se generará automáticamente su movimiento de <strong>Reingreso</strong> en el historial.
          </p>
        </div>
      </div>

      <!-- Asignación de corral opcional -->
      <FormField
        id="reactivar-division"
        v-model="form.id_division_destino"
        type="select"
        label="Corral / División de Destino"
        :options="divisionesDisponibles"
        :disabled="isSubmitting"
      />

      <!-- Observaciones de reingreso -->
      <FormField
        id="reactivar-obs"
        v-model="form.observaciones"
        type="textarea"
        label="Observaciones del Reingreso (Opcional)"
        placeholder="Ej. Ave recuperada, retorno de cuarentena, etc."
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
          class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5 cursor-pointer"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <RotateCcw v-else class="w-4 h-4" />
          <span>Confirmar Reingreso</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>


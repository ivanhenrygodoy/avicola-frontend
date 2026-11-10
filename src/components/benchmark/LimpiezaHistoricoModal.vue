<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import RangeToggle from '@/components/common/RangeToggle.vue'
import { useActionLoader } from '@/composables/useActionLoader'
import { useNotificationStore } from '@/stores/notification'
import { useBenchmarkStore } from '@/stores/benchmark'
import { MESES_DEPURACION, MESES_DEPURACION_DEFECTO, formatNumber } from '@/utils/benchmark'
import { Eraser, AlertTriangle, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close', 'cleaned'])

const store = useBenchmarkStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const meses = ref(MESES_DEPURACION_DEFECTO)
const errorVistaPrevia = ref(false)

const vistaPrevia = computed(() => store.vistaPreviaDepuracion)
const loadingVistaPrevia = computed(() => store.loadingVistaPrevia)
const correspondeAMeses = computed(() => vistaPrevia.value !== null && vistaPrevia.value.meses === meses.value)
const turnosPorBorrar = computed(() => (correspondeAMeses.value ? vistaPrevia.value.turnos : 0))

const textoEliminacion = computed(() => {
  if (!correspondeAMeses.value || !vistaPrevia.value) return null
  const t = vistaPrevia.value.turnos
  const tools = vistaPrevia.value.tools
  const fecha = vistaPrevia.value.corte

  if (t === 0) {
    return {
      fecha,
      esCero: true,
    }
  }

  const accion = t === 1 ? 'Se eliminará' : 'Se eliminarán'
  const cantidad = t === 1 ? '1 registro' : `${formatNumber(t)} registros`
  const concordanciaFecha = t === 1 ? 'anterior al' : 'anteriores al'

  let toolsDetalle = ''
  if (tools === 1) {
    toolsDetalle = ' (y 1 herramienta asociada)'
  } else if (tools > 1) {
    toolsDetalle = ` (y ${formatNumber(tools)} herramientas asociadas)`
  }

  return {
    accion,
    cantidad,
    concordanciaFecha,
    toolsDetalle,
    fecha,
    esCero: false,
  }
})

const textoConservados = computed(() => {
  if (!correspondeAMeses.value || !vistaPrevia.value) return ''
  const c = vistaPrevia.value.conservados
  const m = vistaPrevia.value.meses

  if (c === 0) {
    return 'No quedarán registros vigentes tras la depuración.'
  }
  if (c === 1) {
    return `Se conservará intacto 1 registro de los últimos ${m} meses.`
  }
  return `Se conservarán intactos ${formatNumber(c)} registros de los últimos ${m} meses.`
})

const textoBotonConfirmar = computed(() => {
  if (turnosPorBorrar.value === 1) {
    return 'Eliminar 1 registro'
  }
  if (turnosPorBorrar.value > 1) {
    return `Eliminar ${formatNumber(turnosPorBorrar.value)} registros`
  }
  return 'Eliminar registros'
})

const canConfirm = computed(() => {
  return (
    !isSubmitting.value &&
    !loadingVistaPrevia.value &&
    !errorVistaPrevia.value &&
    correspondeAMeses.value &&
    turnosPorBorrar.value > 0
  )
})

const cargarVistaPrevia = async (numMeses) => {
  errorVistaPrevia.value = false
  try {
    await store.fetchVistaPreviaDepuracion(numMeses)
  } catch {
    errorVistaPrevia.value = true
  }
}

watch(
  () => props.isOpen,
  (abierto) => {
    if (abierto) {
      meses.value = MESES_DEPURACION_DEFECTO
      cargarVistaPrevia(MESES_DEPURACION_DEFECTO)
    } else {
      store.limpiarVistaPreviaDepuracion()
    }
  },
)

watch(meses, (nuevoMes) => {
  if (props.isOpen) {
    cargarVistaPrevia(nuevoMes)
  }
})

const handleClose = () => {
  if (!isSubmitting.value) {
    store.limpiarVistaPreviaDepuracion()
    emit('close')
  }
}

const handleConfirm = async () => {
  if (!canConfirm.value) return

  try {
    const respuesta = await run('Eliminando historial...', () => store.depurarLogs(meses.value))
    notify.success(respuesta?.message || 'Historial depurado exitosamente.')
    emit('cleaned')
    emit('close')
  } catch (err) {
    if (err.response?.status === 422) {
      notify.warning(err.response.data?.message || 'El período solicitado no es válido.')
    } else {
      notify.error('No se pudo limpiar el historial. Inténtalo de nuevo.')
    }
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    title="Limpieza de histórico"
    size="md"
    :closable="!isSubmitting"
    @close="handleClose"
  >
    <div class="space-y-5 text-verdoso">
      <!-- Banner de advertencia corporativo -->
      <div class="bg-destructivo-bg text-destructivo rounded-2xl p-4 flex items-start gap-3 border border-destructivo/20">
        <Eraser class="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div class="text-xs leading-relaxed">
          <p class="font-bold">Acción destructiva irreversible</p>
          <p class="mt-0.5 text-destructivo/90">
            Se eliminarán de forma permanente los registros del asistente más antiguos. Esta acción no se puede deshacer.
          </p>
        </div>
      </div>

      <!-- Selector de rangos con RangeToggle píldoras centrado -->
      <div class="flex flex-col items-center text-center">
        <label class="block text-xs font-bold uppercase tracking-wider text-verdoso-muted mb-2">
          Eliminar las anteriores a
        </label>
        <RangeToggle
          v-model="meses"
          :options="MESES_DEPURACION"
          unit-label="meses"
          size="md"
          aria-label="Eliminar las interacciones anteriores a"
          :loading="isSubmitting"
        />
      </div>

      <!-- Bloque de vista previa con aria-live -->
      <div
        class="bg-crema/70 rounded-2xl p-4 border border-borde text-sm min-h-[90px] flex items-center justify-center text-center"
        aria-live="polite"
      >
        <div v-if="loadingVistaPrevia" class="flex items-center gap-2.5 text-verdoso-muted mx-auto py-2">
          <Loader2 class="w-4 h-4 animate-spin text-bosque" aria-hidden="true" />
          <span>Calculando registros a depurar…</span>
        </div>

        <div v-else-if="errorVistaPrevia" class="flex items-center gap-2 text-destructivo mx-auto py-2">
          <AlertTriangle class="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>No se pudo calcular la vista previa. Intenta cambiar de período.</span>
        </div>

        <div v-else-if="correspondeAMeses && textoEliminacion" class="space-y-1.5 w-full">
          <template v-if="!textoEliminacion.esCero">
            <p class="text-verdoso font-medium leading-snug">
              {{ textoEliminacion.accion }}
              <strong class="text-bosque font-bold">{{ textoEliminacion.cantidad }}</strong>
              <span v-if="textoEliminacion.toolsDetalle" class="text-xs text-verdoso-muted font-normal">
                {{ textoEliminacion.toolsDetalle }}
              </span>
              {{ textoEliminacion.concordanciaFecha }}
              <strong class="font-bold">{{ textoEliminacion.fecha }}</strong>.
            </p>
            <p class="text-xs text-verdoso-muted leading-relaxed">
              {{ textoConservados }}
            </p>
          </template>
          <template v-else>
            <p class="text-verdoso font-medium leading-snug">
              No hay registros anteriores al <strong class="font-bold">{{ textoEliminacion.fecha }}</strong>.
            </p>
            <p class="text-xs text-verdoso-muted leading-relaxed">
              {{ textoConservados }}
            </p>
          </template>
        </div>
      </div>
    </div>

    <!-- Pie del Modal centrado según DESIGN.md -->
    <template #footer>
      <button
        type="button"
        class="px-5 py-2.5 btn-secundario text-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancelar
      </button>
      <button
        type="button"
        class="px-5 py-2.5 btn-destructivo text-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shadow-xs"
        :disabled="!canConfirm"
        @click="handleConfirm"
      >
        <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" aria-hidden="true" />
        <span>{{ textoBotonConfirmar }}</span>
      </button>
    </template>
  </BaseModal>
</template>


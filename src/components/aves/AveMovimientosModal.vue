<script setup>
import { watch } from 'vue'
import { Calendar, ArrowRightLeft, Loader2 } from 'lucide-vue-next'
import { useAvesStore } from '@/stores/aves'
import { formatDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'

/**
 * Modal de visualización del historial cronológico de traslados y movimientos de un ave.
 *
 *   <AveMovimientosModal :is-open="show" :ave="ave" @close="show = false" />
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ave: { type: Object, default: null },
})

defineEmits(['close'])

const avesStore = useAvesStore()

const movimientoVariant = (motivo) => {
  const m = String(motivo || '').toLowerCase()
  if (m.includes('reingreso')) return 'success'
  if (m.includes('baja') || m.includes('salida')) return 'danger'
  return 'neutral'
}

watch(
  () => [props.isOpen, props.ave],
  ([abierto, a]) => {
    if (abierto && a?.id) {
      avesStore.fetchMovimientos(a.id)
    }
  }
)
</script>

<template>
  <BaseModal
    :is-open="isOpen && !!ave"
    :title="`Historial de Traslados: ${ave?.codigo} (${ave?.nombre || ave?.especie?.nombre || 'Ave'})`"
    max-width="lg"
    @close="$emit('close')"
  >
    <div v-if="avesStore.loadingMovimientos" class="p-8 text-center">
      <Loader2 class="w-6 h-6 animate-spin mx-auto text-bosque mb-2" />
      <p class="text-xs text-verdoso-muted">Cargando movimientos históricos...</p>
    </div>

    <div v-else-if="avesStore.movimientos.length === 0" class="p-8 text-center text-verdoso-muted text-sm">
      No se registran movimientos para esta ave.
    </div>

    <div v-else class="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <div
        v-for="mov in avesStore.movimientos"
        :key="mov.id"
        class="p-4 bg-crema/40 border border-borde rounded-2xl space-y-2 hover:bg-crema/70 transition-colors"
      >
        <div class="flex items-center justify-between text-xs">
          <span class="font-bold text-verdoso flex items-center gap-1">
            <Calendar class="w-3.5 h-3.5 text-salvia" />
            {{ formatDate(mov.fecha) }}
          </span>
          <div class="flex items-center gap-2">
            <StatusBadge v-if="mov.motivo" :variant="movimientoVariant(mov.motivo)" size="sm">
              {{ mov.motivo }}
            </StatusBadge>
            <span class="text-salvia font-mono">#{{ mov.id }}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 text-xs font-semibold text-verdoso">
          <span class="text-salvia">De:</span>
          <span>
            {{
              mov.division_origen
                ? `${mov.division_origen.casita?.nombre ? mov.division_origen.casita.nombre + ' • ' : ''}${mov.division_origen.nombre}`
                : (mov.motivo?.toLowerCase().includes('reingreso') ? 'Reingreso (Fuera de plantel)' : 'Ingreso inicial')
            }}
          </span>
          <ArrowRightLeft class="w-3.5 h-3.5 text-bosque" />
          <span class="text-salvia">A:</span>
          <span class="text-bosque">
            {{
              mov.division_destino
                ? `${mov.division_destino.casita?.nombre ? mov.division_destino.casita.nombre + ' • ' : ''}${mov.division_destino.nombre}`
                : (mov.motivo?.toLowerCase().includes('baja') || mov.motivo?.toLowerCase().includes('salida') ? 'Baja / Salida' : 'Sin asignación inicial')
            }}
          </span>
        </div>

        <p v-if="mov.motivo" class="text-xs text-verdoso-muted">
          <span class="font-semibold text-verdoso">Motivo:</span> {{ mov.motivo }}
        </p>

        <p v-if="mov.observaciones" class="text-xs text-verdoso-muted italic">
          {{ mov.observaciones }}
        </p>
      </div>
    </div>

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


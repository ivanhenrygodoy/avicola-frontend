<script setup>
import CollapsibleCard from '@/components/common/CollapsibleCard.vue'
import PaginationBar from '@/components/common/PaginationBar.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import { Activity, ArrowRightLeft, Egg, DollarSign, ClipboardList, Loader2 } from 'lucide-vue-next'

defineProps({
  alertas: { type: Array, required: true },
  actividad: { type: Array, required: true },
  meta: { type: Object, required: true },
  loading: { type: Boolean, default: false },
  loaded: { type: Boolean, default: false },
  error: { type: Boolean, default: false },
})

defineEmits(['open', 'retry', 'update:page', 'update:perPage'])

const ICONOS = {
  traslado: ArrowRightLeft,
  huevos: Egg,
  gasto: DollarSign,
  observacion: ClipboardList,
}
</script>

<template>
  <div class="space-y-4">
    <!-- Las alertas son pocas y urgentes: se mantienen siempre visibles -->
    <div v-if="alertas.length" class="space-y-2">
      <BaseAlert
        v-for="a in alertas"
        :key="a.codigo"
        :type="a.nivel"
        :message="a.mensaje"
        :dismissible="false"
      />
    </div>

    <!-- El historial se pliega para no saturar la pantalla -->
    <CollapsibleCard
      title="Actividad reciente"
      subtitle="Traslados, recolecciones, gastos y observaciones"
      :icon="Activity"
      @open="$emit('open')"
    >
      <div
        v-if="error"
        class="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <BaseAlert type="error" message="No se pudo cargar la actividad reciente." :dismissible="false" class="flex-1" />
        <button type="button" class="btn-secundario px-4 py-2 text-sm" @click="$emit('retry')">
          Reintentar
        </button>
      </div>

      <div
        v-else-if="!loaded"
        class="p-5 flex items-center justify-center gap-2 text-sm text-verdoso-muted"
        aria-live="polite"
      >
        <Loader2 class="w-4 h-4 animate-spin" aria-hidden="true" />
        Cargando actividad…
      </div>

      <p v-else-if="meta.total === 0" class="p-5 text-sm text-verdoso-muted">
        Todavía no hay actividad registrada.
      </p>

      <template v-else>
        <!-- Al cambiar de página se mantiene el listado previo, atenuado, sin saltos de layout -->
        <ul
          :class="['divide-y divide-borde px-5 transition-opacity duration-200', loading ? 'opacity-60' : 'opacity-100']"
          :aria-busy="loading"
        >
          <li v-for="(e, i) in actividad" :key="`${meta.current_page}-${i}`" class="flex items-start gap-3 py-3">
            <component :is="ICONOS[e.tipo]" class="w-4 h-4 mt-0.5 text-salvia shrink-0" aria-hidden="true" />
            <div class="min-w-0 flex-1">
              <p class="text-sm text-verdoso leading-snug">{{ e.descripcion }}</p>
              <p class="text-xs text-verdoso-muted mt-0.5">{{ e.fecha }}</p>
            </div>
          </li>
        </ul>

        <!-- La barra puede ser más ancha que una pantalla angosta: se desliza dentro de su propia franja -->
        <div class="overflow-x-auto rounded-b-2xl">
          <PaginationBar
            :current-page="meta.current_page"
            :last-page="meta.last_page"
            :per-page="meta.per_page"
            :total="meta.total"
            item-label="eventos"
            @update:page="$emit('update:page', $event)"
            @update:per-page="$emit('update:perPage', $event)"
          />
        </div>
      </template>
    </CollapsibleCard>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import CollapsibleCard from '@/components/common/CollapsibleCard.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { resultadoInfo, accionInfo, faseLabel } from '@/utils/benchmark'
import { FileText } from 'lucide-vue-next'

/**
 * Auditoría de un turno del asistente: mensaje del operario, prompt, respuesta, herramientas
 * (con las tablas consultadas), guardrails aplicados, tokens y error. Todo el texto se muestra
 * con interpolación ({{ }}), nunca como HTML, porque proviene del operario o del modelo.
 */
const props = defineProps({
  isOpen: { type: Boolean, required: true },
  detalle: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

defineEmits(['close'])

const resultado = computed(() => (props.detalle ? resultadoInfo(props.detalle.resultado) : null))
const json = (valor) => JSON.stringify(valor ?? {}, null, 2)
const hayArgumentos = (tool) => tool.argumentos && Object.keys(tool.argumentos).length > 0
</script>

<template>
  <BaseModal :is-open="isOpen" title="Detalle de la interacción" size="3xl" @close="$emit('close')">
    <LoadingState v-if="loading" message="Cargando detalle..." submessage="" />

    <EmptyState
      v-else-if="!detalle"
      title="No se pudo cargar el detalle"
      description="Cierra esta ventana e inténtalo de nuevo."
      :icon="FileText"
    />

    <div v-else class="space-y-5 text-sm text-verdoso">
      <!-- Resumen -->
      <div class="flex flex-wrap items-center gap-2">
        <StatusBadge :variant="resultado.variant">{{ resultado.label }}</StatusBadge>
        <StatusBadge variant="outline" size="sm">{{ detalle.created_at }}</StatusBadge>
        <StatusBadge variant="outline" size="sm">{{ detalle.duracion_ms }} ms</StatusBadge>
        <StatusBadge variant="outline" size="sm">{{ detalle.iteraciones }} llamadas al modelo</StatusBadge>
        <StatusBadge v-if="detalle.modelo" variant="outline" size="sm">{{ detalle.modelo }}</StatusBadge>
      </div>

      <!-- Mensaje del operario (anónimo) -->
      <section>
        <h4 class="text-xs font-bold uppercase tracking-wider text-verdoso-muted mb-1.5">Mensaje del operario</h4>
        <p class="rounded-xl bg-crema-surface border border-borde p-3 whitespace-pre-wrap break-words">{{ detalle.mensaje_usuario }}</p>
        <p v-if="detalle.turnos_historial" class="text-xs text-verdoso-muted mt-1">
          Con {{ detalle.turnos_historial }} mensajes previos de historial.
        </p>
      </section>

      <!-- Prompt -->
      <CollapsibleCard title="Prompt del sistema" :subtitle="`Versión ${detalle.prompt.version || 'sin registrar'}`">
        <p
          v-if="!detalle.prompt.version_vigente"
          class="text-xs font-medium text-amber-800 bg-huevo-suave border border-amber-200 rounded-lg px-3 py-2 mb-3"
        >
          El prompt cambió desde esta interacción: abajo se muestra la versión vigente, no la usada entonces.
        </p>
        <pre class="whitespace-pre-wrap break-words text-xs leading-relaxed rounded-xl bg-crema-surface border border-borde p-3 max-h-72 overflow-y-auto">{{ detalle.prompt.texto }}</pre>
      </CollapsibleCard>

      <!-- Respuesta -->
      <section>
        <h4 class="text-xs font-bold uppercase tracking-wider text-verdoso-muted mb-1.5">Respuesta del agente</h4>
        <p class="rounded-xl bg-bosque-50 border border-bosque/20 p-3 whitespace-pre-wrap break-words">{{ detalle.respuesta_agente || '—' }}</p>
        <template v-if="detalle.respuesta_original_llm">
          <h4 class="text-xs font-bold uppercase tracking-wider text-verdoso-muted mt-3 mb-1.5">Respuesta original del modelo (reemplazada por un guardrail)</h4>
          <p class="rounded-xl bg-huevo-suave border border-amber-200 p-3 whitespace-pre-wrap break-words">{{ detalle.respuesta_original_llm }}</p>
        </template>
      </section>

      <!-- Herramientas -->
      <section>
        <h4 class="text-xs font-bold uppercase tracking-wider text-verdoso-muted mb-1.5">Herramientas utilizadas</h4>
        <p v-if="!detalle.tools.length" class="text-verdoso-muted">No se ejecutó ninguna herramienta.</p>
        <ul v-else class="space-y-3">
          <li v-for="tool in detalle.tools" :key="tool.orden" class="border border-borde rounded-xl p-3 space-y-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="font-bold break-all">{{ tool.orden }}. {{ tool.herramienta }}</span>
              <StatusBadge :variant="tool.exito ? 'success' : 'danger'" size="sm">{{ tool.exito ? 'Ejecutada' : 'No ejecutada' }}</StatusBadge>
              <span class="text-xs text-verdoso-muted">{{ tool.duracion_ms }} ms</span>
            </div>
            <div v-if="tool.tablas_consultadas.length" class="flex flex-wrap items-center gap-1.5">
              <span class="text-xs font-semibold text-verdoso-muted">Tablas consultadas:</span>
              <StatusBadge v-for="tabla in tool.tablas_consultadas" :key="tabla" variant="neutral" size="sm">{{ tabla }}</StatusBadge>
            </div>
            <pre v-if="hayArgumentos(tool)" class="text-xs rounded-lg bg-crema-surface border border-borde p-2 overflow-x-auto">{{ json(tool.argumentos) }}</pre>
            <p v-if="tool.resumen_resultado" class="text-xs text-verdoso-muted break-words">{{ tool.resumen_resultado }}</p>
          </li>
        </ul>
      </section>

      <!-- Guardrails -->
      <section>
        <h4 class="text-xs font-bold uppercase tracking-wider text-verdoso-muted mb-1.5">Guardrails aplicados</h4>
        <p v-if="!detalle.guards_aplicados.length" class="text-verdoso-muted">Ningún guardrail intervino.</p>
        <ul v-else class="space-y-2">
          <li v-for="(g, i) in detalle.guards_aplicados" :key="i" class="flex flex-wrap items-center gap-2 border border-borde rounded-xl px-3 py-2">
            <span class="font-semibold break-all">{{ g.guard }}</span>
            <StatusBadge variant="outline" size="sm">{{ faseLabel(g.fase) }}</StatusBadge>
            <StatusBadge :variant="accionInfo(g.accion).variant" size="sm">{{ accionInfo(g.accion).label }}</StatusBadge>
            <span v-if="g.detalle" class="text-xs text-verdoso-muted break-words">{{ g.detalle }}</span>
          </li>
        </ul>
      </section>

      <!-- Tokens -->
      <section>
        <h4 class="text-xs font-bold uppercase tracking-wider text-verdoso-muted mb-1.5">Tokens consumidos</h4>
        <div class="grid grid-cols-3 gap-3 text-center">
          <div class="border border-borde rounded-xl p-3"><p class="text-xs text-verdoso-muted">Prompt</p><p class="text-lg font-extrabold">{{ detalle.tokens.prompt }}</p></div>
          <div class="border border-borde rounded-xl p-3"><p class="text-xs text-verdoso-muted">Respuesta</p><p class="text-lg font-extrabold">{{ detalle.tokens.respuesta }}</p></div>
          <div class="border border-borde rounded-xl p-3"><p class="text-xs text-verdoso-muted">Total</p><p class="text-lg font-extrabold text-bosque">{{ detalle.tokens.total }}</p></div>
        </div>
      </section>

      <!-- Error -->
      <section v-if="detalle.error_mensaje">
        <h4 class="text-xs font-bold uppercase tracking-wider text-red-700 mb-1.5">Error registrado</h4>
        <p class="rounded-xl bg-[#FEF2F2] border border-red-200 text-[#991B1B] p-3 whitespace-pre-wrap break-words">{{ detalle.error_mensaje }}</p>
      </section>
    </div>

    <template #footer>
      <button type="button" class="px-6 py-2.5 btn-secundario text-sm cursor-pointer" @click="$emit('close')">Cerrar</button>
    </template>
  </BaseModal>
</template>

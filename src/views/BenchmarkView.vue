<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useBenchmarkStore } from '@/stores/benchmark'
import { useNotificationStore } from '@/stores/notification'

// Componentes comunes globales
import AppHeader from '@/components/common/AppHeader.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import PillTabs from '@/components/common/PillTabs.vue'
import RangeToggle from '@/components/common/RangeToggle.vue'
import StatCard from '@/components/common/StatCard.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import SerieDiariaCard from '@/components/benchmark/SerieDiariaCard.vue'
import RankingCard from '@/components/benchmark/RankingCard.vue'
import LogDetalleModal from '@/components/benchmark/LogDetalleModal.vue'
import LimpiezaHistoricoModal from '@/components/benchmark/LimpiezaHistoricoModal.vue'
import { provideActionLoader } from '@/composables/useActionLoader'
import { resultadoInfo, RESULTADO_OPTIONS, etiquetaDia, formatNumber } from '@/utils/benchmark'

import { BarChart3, ScrollText, Eye, Eraser } from 'lucide-vue-next'

const store = useBenchmarkStore()
const notify = useNotificationStore()
const { isSubmitting, message: loaderMessage } = provideActionLoader()

const activeTab = ref('estadisticas')
const showDetalle = ref(false)
const showLimpiezaModal = ref(false)

const tabs = [
  { value: 'estadisticas', label: 'Estadísticas', icon: BarChart3 },
  { value: 'logs', label: 'Logs del agente', icon: ScrollText },
]

// Paleta de las series (hex porque se pinta dentro de un SVG): éxito / bloqueado / error y prompt / respuesta
const COLORES = {
  exitosas: '#2E8B57',
  bloqueadas: '#C98A1B',
  errores: '#B91C1C',
  prompt: '#244B36',
  respuesta: '#6F9678',
}

const stats = computed(() => store.estadisticas)
const totales = computed(() => stats.value?.totales)
const serie = computed(() => stats.value?.serie ?? [])
const labels = computed(() => serie.value.map((s) => etiquetaDia(s.fecha)))
const labelEvery = computed(() => (store.dias === 30 ? 5 : 1))

const seriesInteracciones = computed(() => [
  { name: 'Exitosas', color: COLORES.exitosas, values: serie.value.map((s) => s.exitosas) },
  { name: 'Bloqueadas por guard', color: COLORES.bloqueadas, values: serie.value.map((s) => s.bloqueadas) },
  { name: 'Con error', color: COLORES.errores, values: serie.value.map((s) => s.errores) },
])

const seriesTokens = computed(() => [
  { name: 'Prompt', color: COLORES.prompt, values: serie.value.map((s) => s.tokens_prompt) },
  { name: 'Respuesta', color: COLORES.respuesta, values: serie.value.map((s) => s.tokens_respuesta) },
])

const itemsResultado = computed(() =>
  (stats.value?.por_resultado ?? []).map((r) => ({
    key: r.resultado,
    label: resultadoInfo(r.resultado).label,
    total: r.total,
  })),
)
const itemsGuards = computed(() => (stats.value?.top_guards ?? []).map((g) => ({ key: g.guard, label: g.guard, total: g.total })))
const itemsTools = computed(() => (stats.value?.top_tools ?? []).map((t) => ({ key: t.herramienta, label: t.herramienta, total: t.total })))

// Columnas del listado (DataTable las dibuja; cada celda se personaliza con #cell-<key>)
const columnas = [
  { key: 'created_at', label: 'Fecha', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'mensaje_usuario', label: 'Mensaje del operario' },
  { key: 'resultado', label: 'Resultado', nowrap: true },
  { key: 'tokens_total', label: 'Tokens', align: 'right', nowrap: true, cellClass: 'text-verdoso' },
  { key: 'duracion_ms', label: 'Duración', align: 'right', nowrap: true, cellClass: 'text-verdoso-muted text-xs' },
  { key: 'guards', label: 'Guards' },
  { key: 'acciones', label: 'Acciones', align: 'right', nowrap: true },
]

const filterFields = computed(() => [
  { key: 'search', type: 'search', label: 'Buscar en mensajes y respuestas' },
  { key: 'resultado', type: 'select', label: 'Resultado', options: RESULTADO_OPTIONS },
  { key: 'guard', type: 'text', label: 'Guard' },
  { key: 'herramienta', type: 'text', label: 'Herramienta' },
  { key: 'fecha_inicio', type: 'date', label: 'Desde' },
  { key: 'fecha_fin', type: 'date', label: 'Hasta' },
])

const resumen = (texto, max = 90) => (texto.length > max ? `${texto.slice(0, max)}…` : texto)

const handleSearch = () => {
  store.filters.page = 1
  store.fetchLogs()
}
const handleClear = () => store.resetFilters()
const handlePageChange = (page) => {
  store.filters.page = page
  store.fetchLogs()
}
const handlePerPageChange = (perPage) => {
  store.filters.per_page = perPage
  store.filters.page = 1
  store.fetchLogs()
}

// Desde los rankings: abre la pestaña de logs ya filtrada por ese guard o herramienta
const irALogsFiltrados = (filtrar) => {
  saltarRecargaDePestana = activeTab.value !== 'logs'
  activeTab.value = 'logs'
  filtrar()
}
const verLogsDeGuard = (nombre) => irALogsFiltrados(() => store.filtrarPorGuard(nombre))
const verLogsDeHerramienta = (nombre) => irALogsFiltrados(() => store.filtrarPorHerramienta(nombre))

const abrirDetalle = async (log) => {
  showDetalle.value = true
  try {
    await store.fetchDetalle(log.id)
  } catch (err) {
    notify.error('No se pudo cargar el detalle de la interacción.')
  }
}
const cerrarDetalle = () => {
  showDetalle.value = false
  store.limpiarDetalle()
}

// Cuando se cambia de pestaña desde un ranking, el store ya recargó los logs con ese filtro: el
// watch no debe lanzar una segunda petición idéntica.
let saltarRecargaDePestana = false

// Al volver a una pestaña se recargan sus datos: las interacciones del asistente llegan mientras la
// vista está abierta y, sin esto, la pestaña mostraría lo que había al montar la página.
watch(activeTab, (tab) => {
  if (saltarRecargaDePestana) {
    saltarRecargaDePestana = false
    return
  }
  if (tab === 'logs') store.fetchLogs()
  else store.fetchEstadisticas()
})

onMounted(() => {
  store.fetchEstadisticas()
  store.fetchLogs()
})
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <AppHeader subtitle="Benchmark AviaCore" />

    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Benchmark AviaCore"
        subtitle="Auditoría de las interacciones entre los operarios y el asistente: respuestas, herramientas, guardrails y consumo de tokens."
        bordered
      >
        <template #actions>
          <PillTabs v-model="activeTab" :tabs="tabs" aria-label="Secciones del benchmark" />
        </template>
      </PageHeader>

      <!-- ====================== -->
      <!-- PESTAÑA 1: ESTADÍSTICAS -->
      <!-- ====================== -->
      <div v-if="activeTab === 'estadisticas'" class="space-y-6">
        <BaseAlert
          v-if="store.errorStats"
          type="error"
          message="No se pudieron cargar las estadísticas. Verifica tu conexión e inténtalo de nuevo."
          :dismissible="false"
        />

        <div class="flex justify-end">
          <RangeToggle
            :model-value="store.dias"
            :loading="store.loadingStats"
            @update:model-value="store.setDias($event)"
          />
        </div>

        <!-- Indicadores clave -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Interacciones" :value="formatNumber(totales?.interacciones)" value-color-class="text-bosque" />
          <StatCard title="Tasa de éxito" :value="`${totales?.tasa_exito ?? 0}%`" value-color-class="text-verdoso" />
          <StatCard
            title="Tokens consumidos"
            :value="`${formatNumber(totales?.tokens_total)} · ${formatNumber(totales?.tokens_promedio)} por turno`"
            value-color-class="text-verdoso"
          />
          <StatCard title="Latencia promedio" :value="`${formatNumber(totales?.latencia_promedio_ms)} ms`" value-color-class="text-verdoso-muted" />
        </div>

        <!-- Gráficos por día -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SerieDiariaCard
            title="Interacciones por día"
            :subtitle="`Últimos ${store.dias} días`"
            :labels="labels"
            :series="seriesInteracciones"
            :label-every="labelEvery"
            :loading="store.loadingStats"
            :aria-label="`Interacciones exitosas, bloqueadas y con error por día, últimos ${store.dias} días`"
          />
          <SerieDiariaCard
            title="Tokens por día"
            :subtitle="`Últimos ${store.dias} días`"
            :labels="labels"
            :series="seriesTokens"
            :label-every="labelEvery"
            :loading="store.loadingStats"
            empty-text="Sin consumo de tokens en este periodo."
            :aria-label="`Tokens de prompt y de respuesta por día, últimos ${store.dias} días`"
          />
        </div>

        <!-- Rankings -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RankingCard title="Resultado de las interacciones" :items="itemsResultado" porcentaje />
          <RankingCard
            title="Guards más activados"
            subtitle="Toca uno para ver sus logs"
            :items="itemsGuards"
            color-class="bg-tierra"
            clickable
            empty-text="Ningún guard intervino en este periodo."
            @select="verLogsDeGuard"
          />
          <RankingCard
            title="Herramientas más usadas"
            subtitle="Toca una para ver sus logs"
            :items="itemsTools"
            clickable
            empty-text="No se usaron herramientas en este periodo."
            @select="verLogsDeHerramienta"
          />
        </div>
      </div>

      <!-- ========================= -->
      <!-- PESTAÑA 2: LOGS DEL AGENTE -->
      <!-- ========================= -->
      <div v-else class="space-y-6">
        <BaseAlert
          v-if="store.errorLogs"
          type="error"
          message="No se pudieron cargar los logs del agente. Verifica tu conexión e inténtalo de nuevo."
          :dismissible="false"
        />

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total (filtro actual)" :value="formatNumber(store.stats.total)" value-color-class="text-bosque" />
          <StatCard title="Exitosos" :value="formatNumber(store.stats.exitosos)" value-color-class="text-verdoso" />
          <StatCard title="Bloqueados por guard" :value="formatNumber(store.stats.bloqueados)" value-color-class="text-verdoso" />
          <StatCard title="Con error" :value="formatNumber(store.stats.errores)" value-color-class="text-verdoso-muted" />
        </div>

        <FilterBar
          v-model="store.filters"
          :fields="filterFields"
          :loading="store.loadingLogs"
          action-label="Limpiar historial"
          :action-icon="Eraser"
          @search="handleSearch"
          @clear="handleClear"
          @action="showLimpiezaModal = true"
        />

        <DataTable
          :columns="columnas"
          :rows="store.logs"
          :loading="store.loadingLogs"
          :meta="store.meta"
          item-label="interacciones"
          empty-title="No se encontraron interacciones"
          empty-description="Intenta ajustar los filtros o espera a que los operarios usen el asistente."
          @update:page="handlePageChange"
          @update:per-page="handlePerPageChange"
        >
          <template #cell-mensaje_usuario="{ row }">
            <span class="break-words" :title="row.mensaje_usuario">{{ resumen(row.mensaje_usuario) }}</span>
          </template>

          <template #cell-resultado="{ row }">
            <StatusBadge :variant="resultadoInfo(row.resultado).variant">{{ resultadoInfo(row.resultado).label }}</StatusBadge>
          </template>

          <template #cell-tokens_total="{ row }">{{ formatNumber(row.tokens_total) }}</template>

          <template #cell-duracion_ms="{ row }">{{ formatNumber(row.duracion_ms) }} ms</template>

          <template #cell-guards="{ row }">
            <div v-if="row.guards.length" class="flex flex-wrap gap-1">
              <StatusBadge v-for="g in row.guards" :key="g" variant="neutral" size="sm">{{ g }}</StatusBadge>
            </div>
            <span v-else class="text-verdoso-muted">—</span>
          </template>

          <template #cell-acciones="{ row }">
            <div class="flex items-center justify-end">
              <RowActionButton :icon="Eye" title="Ver detalle" @click="abrirDetalle(row)" />
            </div>
          </template>
        </DataTable>
      </div>
    </main>

    <LogDetalleModal :is-open="showDetalle" :detalle="store.detalle" :loading="store.loadingDetalle" @close="cerrarDetalle" />
    <LimpiezaHistoricoModal :is-open="showLimpiezaModal" @close="showLimpiezaModal = false" />
    <ActionLoader :is-open="isSubmitting" :message="loaderMessage" />
  </div>
</template>

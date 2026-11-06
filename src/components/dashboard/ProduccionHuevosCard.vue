<script setup>
import { computed } from 'vue'
import SectionCard from '@/components/common/SectionCard.vue'
import LineChart from '@/components/common/LineChart.vue'

const props = defineProps({
  huevos: { type: Object, required: true },
  dias: { type: Number, required: true },
  loading: { type: Boolean, default: false },
})

defineEmits(['update:dias'])

const OPCIONES = [7, 30]

// Paleta de las 3 series, validada con dataviz/validate_palette.js sobre superficie blanca.
// Se mantiene en hex (no en clases Tailwind) porque se pinta dentro de un SVG.
const COLORES = {
  recolectados: '#C98A1B',
  aprovechables: '#2E8B57',
  rotos: '#B91C1C',
}

// 'Y-m-d' → 'd/m' sin pasar por Date (evita desfases de zona horaria)
const etiqueta = (fecha) => {
  const [, m, d] = fecha.split('-')
  return `${d}/${m}`
}

const labels = computed(() => props.huevos.serie.map((s) => etiqueta(s.fecha)))

const series = computed(() => [
  { name: 'Recolectados', color: COLORES.recolectados, values: props.huevos.serie.map((s) => s.recolectados) },
  { name: 'Aprovechables', color: COLORES.aprovechables, values: props.huevos.serie.map((s) => s.aprovechables) },
  { name: 'Rotos', color: COLORES.rotos, values: props.huevos.serie.map((s) => s.rotos) },
])

const hayRegistros = computed(() => props.huevos.rango.recolectados > 0)
</script>

<template>
  <SectionCard title="Producción de huevos" :subtitle="`Últimos ${dias} días`">
    <template #actions>
      <div class="inline-flex rounded-full border border-borde p-0.5 bg-crema" role="group" aria-label="Rango de días">
        <button
          v-for="opcion in OPCIONES"
          :key="opcion"
          type="button"
          :disabled="loading"
          :aria-pressed="dias === opcion"
          :class="[
            'px-3 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer disabled:cursor-wait',
            dias === opcion ? 'bg-bosque text-white' : 'text-verdoso-muted hover:text-bosque',
          ]"
          @click="$emit('update:dias', opcion)"
        >
          {{ opcion }} días
        </button>
      </div>
    </template>

    <!-- Cifras en tinta de texto; la identidad de cada serie la lleva la llave de la leyenda -->
    <dl class="grid grid-cols-3 gap-3 text-center">
      <div>
        <dt class="text-xs text-verdoso-muted">Recolectados</dt>
        <dd class="text-xl font-extrabold text-verdoso">{{ huevos.rango.recolectados }}</dd>
      </div>
      <div>
        <dt class="text-xs text-verdoso-muted">Aprovechables</dt>
        <dd class="text-xl font-extrabold text-verdoso">{{ huevos.rango.aprovechables }}</dd>
      </div>
      <div>
        <dt class="text-xs text-verdoso-muted">Rotura</dt>
        <dd class="text-xl font-extrabold text-verdoso">{{ huevos.rango.porcentaje_rotura }}%</dd>
      </div>
    </dl>

    <p v-if="!hayRegistros" class="text-sm text-verdoso-muted border-t border-borde pt-4">
      No hay recolecciones registradas en este rango.
    </p>

    <div v-else class="border-t border-borde pt-4">
      <LineChart
        :labels="labels"
        :series="series"
        :label-every="dias === 30 ? 5 : 1"
        :loading="loading"
        :aria-label="`Huevos recolectados, aprovechables y rotos por día, últimos ${dias} días`"
      />
    </div>
  </SectionCard>
</template>

<script setup>
import { computed, ref } from 'vue'

/**
 * Gráfico de líneas SVG multi-serie y reutilizable.
 *
 * - Cada serie: { name, color, values: number[] } (un valor por etiqueta).
 * - Una sola escala Y (nunca doble eje).
 * - Crosshair + tooltip con todas las series; mismo detalle con teclado (← →).
 * - Etiqueta de valor al final de cada línea solo si no choca con otra
 *   (si chocan, la leyenda y el tooltip llevan la identidad).
 * - Tabla sr-only como equivalente accesible.
 */
const props = defineProps({
  labels: { type: Array, default: () => [] },
  series: { type: Array, default: () => [] },
  ariaLabel: { type: String, required: true },
  height: { type: Number, default: 220 },
  labelEvery: { type: Number, default: 1 }, // 1 etiqueta X de cada N
  loading: { type: Boolean, default: false },
})

const WIDTH = 640
const PAD = { top: 12, right: 40, bottom: 26, left: 34 }
const SURFACE = '#FFFFFF'
const TICKS = 4

const plotW = WIDTH - PAD.left - PAD.right
const plotH = computed(() => props.height - PAD.top - PAD.bottom)

// Máximo "bonito" para que los ticks sean números redondos
const maxY = computed(() => {
  const max = Math.max(0, ...props.series.flatMap((s) => s.values))
  if (max <= 0) return TICKS // base vacía: eje 0..4, sin dividir por 0
  const rough = max / TICKS
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough)
  return step * TICKS
})

const x = (i) =>
  props.labels.length > 1 ? PAD.left + (i / (props.labels.length - 1)) * plotW : PAD.left + plotW / 2
const y = (v) => PAD.top + plotH.value - (v / maxY.value) * plotH.value

const ticks = computed(() =>
  Array.from({ length: TICKS + 1 }, (_, i) => {
    const value = (maxY.value / TICKS) * i
    return { value, y: y(value) }
  }),
)

const lineas = computed(() =>
  props.series.map((s) => ({
    ...s,
    d: s.values.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' '),
  })),
)

// Etiquetas de valor al final de línea, omitiendo las que chocan
const etiquetasFinales = computed(() => {
  const ultimo = props.labels.length - 1
  if (ultimo < 0) return []
  const puestas = []
  return lineas.value
    .map((s) => ({ color: s.color, valor: s.values[ultimo], y: y(s.values[ultimo]) }))
    .sort((a, b) => a.y - b.y)
    .filter((e) => {
      const choca = puestas.some((py) => Math.abs(py - e.y) < 13)
      if (!choca) puestas.push(e.y)
      return !choca
    })
})

const etiquetasX = computed(() =>
  props.labels.map((label, i) => ({
    label,
    x: x(i),
    visible: i % props.labelEvery === 0 || i === props.labels.length - 1,
  })),
)

// --- Interacción ------------------------------------------------------------
const activo = ref(null)
const contenedor = ref(null)

const indiceMasCercano = (clientX) => {
  const rect = contenedor.value.getBoundingClientRect()
  const xSvg = ((clientX - rect.left) / rect.width) * WIDTH
  const ratio = (xSvg - PAD.left) / plotW
  const i = Math.round(ratio * (props.labels.length - 1))
  return Math.min(Math.max(i, 0), props.labels.length - 1)
}

const onMove = (e) => {
  if (props.labels.length) activo.value = indiceMasCercano(e.clientX)
}
const onLeave = () => {
  activo.value = null
}
const onKey = (e) => {
  const n = props.labels.length
  if (!n) return
  if (e.key === 'ArrowRight') activo.value = Math.min((activo.value ?? -1) + 1, n - 1)
  else if (e.key === 'ArrowLeft') activo.value = Math.max((activo.value ?? n) - 1, 0)
  else if (e.key === 'Escape') activo.value = null
  else return
  e.preventDefault()
}

// Posición del tooltip en % del contenedor; se voltea cerca del borde derecho
const tooltipStyle = computed(() => {
  if (activo.value === null) return {}
  const left = (x(activo.value) / WIDTH) * 100
  return left > 60
    ? { left: `${left}%`, transform: 'translateX(calc(-100% - 12px))' }
    : { left: `${left}%`, transform: 'translateX(12px)' }
})
</script>

<template>
  <!-- relative: ancla la tabla sr-only (position:absolute) para que no ensanche la página -->
  <div class="relative">
    <div
      ref="contenedor"
      class="relative outline-none focus-visible:ring-2 focus-visible:ring-salvia rounded-lg transition-opacity duration-200"
      :class="loading ? 'opacity-60' : 'opacity-100'"
      tabindex="0"
      @pointermove="onMove"
      @pointerleave="onLeave"
      @keydown="onKey"
      @blur="onLeave"
    >
      <svg
        :viewBox="`0 0 ${WIDTH} ${height}`"
        class="w-full h-auto block"
        role="img"
        :aria-label="ariaLabel"
      >
        <!-- Grilla y ejes: hairline sólida, recesiva -->
        <g>
          <line
            v-for="t in ticks"
            :key="t.value"
            :x1="PAD.left"
            :x2="WIDTH - PAD.right"
            :y1="t.y"
            :y2="t.y"
            stroke="#E4E7DF"
            stroke-width="1"
          />
          <text
            v-for="t in ticks"
            :key="'y' + t.value"
            :x="PAD.left - 8"
            :y="t.y + 4"
            text-anchor="end"
            font-size="11"
            fill="#526359"
          >
            {{ t.value }}
          </text>
        </g>

        <!-- Etiquetas del eje X -->
        <g>
          <template v-for="(e, i) in etiquetasX" :key="i">
            <text
              v-if="e.visible"
              :x="e.x"
              :y="height - 7"
              text-anchor="middle"
              font-size="11"
              fill="#526359"
            >
              {{ e.label }}
            </text>
          </template>
        </g>

        <!-- Crosshair: línea vertical que sigue al puntero y se ajusta al día -->
        <line
          v-if="activo !== null"
          :x1="x(activo)"
          :x2="x(activo)"
          :y1="PAD.top"
          :y2="PAD.top + plotH"
          stroke="#526359"
          stroke-opacity="0.45"
          stroke-width="1"
        />

        <!-- Líneas: 2px, unión y remate redondeados -->
        <path
          v-for="s in lineas"
          :key="s.name"
          :d="s.d"
          fill="none"
          :stroke="s.color"
          stroke-width="2"
          stroke-linejoin="round"
          stroke-linecap="round"
        />

        <!-- Marcadores del día activo: r=4 (8px) con anillo de 2px del color de la superficie -->
        <g v-if="activo !== null">
          <circle
            v-for="s in lineas"
            :key="'m' + s.name"
            :cx="x(activo)"
            :cy="y(s.values[activo])"
            r="4"
            :fill="s.color"
            :stroke="SURFACE"
            stroke-width="2"
          />
        </g>

        <!-- Punto final de cada línea + valor (solo si no choca) -->
        <g v-else>
          <circle
            v-for="s in lineas"
            :key="'f' + s.name"
            :cx="x(labels.length - 1)"
            :cy="y(s.values[labels.length - 1])"
            r="4"
            :fill="s.color"
            :stroke="SURFACE"
            stroke-width="2"
          />
          <text
            v-for="(e, i) in etiquetasFinales"
            :key="'v' + i"
            :x="x(labels.length - 1) + 10"
            :y="e.y + 4"
            font-size="11"
            font-weight="600"
            fill="#26332B"
          >
            {{ e.valor }}
          </text>
        </g>
      </svg>

      <!-- Tooltip: el valor lidera, el nombre acompaña; llaves de línea, no cajas -->
      <div
        v-if="activo !== null"
        class="pointer-events-none absolute top-2 z-10 min-w-[9rem] rounded-xl border border-borde bg-white px-3 py-2 shadow-sm"
        :style="tooltipStyle"
        role="status"
      >
        <p class="text-xs font-semibold text-verdoso-muted mb-1.5">{{ labels[activo] }}</p>
        <ul class="space-y-1">
          <li v-for="s in series" :key="s.name" class="flex items-center gap-2 text-xs">
            <span class="inline-block w-3 h-0.5 rounded-full" :style="{ backgroundColor: s.color }" />
            <span class="font-bold text-verdoso">{{ s.values[activo] }}</span>
            <span class="text-verdoso-muted">{{ s.name }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- Leyenda (≥ 2 series): llave de línea del color de la serie, texto en tinta -->
    <ul v-if="series.length > 1" class="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-3 text-xs text-verdoso-muted">
      <li v-for="s in series" :key="s.name" class="flex items-center gap-1.5">
        <span class="inline-block w-4 h-0.5 rounded-full" :style="{ backgroundColor: s.color }" />
        {{ s.name }}
      </li>
    </ul>

    <!-- Equivalente accesible: tabla con los mismos datos. El sr-only va en un div:
         una <table> ignora width/clip y ensancharía la página en móvil. -->
    <div class="sr-only">
      <table>
        <caption>{{ ariaLabel }}</caption>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th v-for="s in series" :key="s.name" scope="col">{{ s.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(label, i) in labels" :key="i">
            <th scope="row">{{ label }}</th>
            <td v-for="s in series" :key="s.name">{{ s.values[i] }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

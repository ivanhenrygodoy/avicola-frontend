<script setup>
import { computed } from 'vue'

/**
 * Botón de icono para las acciones de una fila de tabla o ficha (ver, editar,
 * eliminar, reactivar…). Fuente única del tamaño táctil y de los tonos.
 *
 * icon:  componente de Lucide (se pinta a 16×16 con aria-hidden)
 * title: texto del tooltip y del aria-label; es obligatorio porque el botón no tiene texto
 * tone:
 *   neutral → ver, historial, trasladar   (resalta en bosque)
 *   edit    → editar                      (resalta en tierra)
 *   danger  → eliminar, dar de baja       (resalta en rojo)
 *   success → reactivar                   (verde)
 * size: 'md' (táctil 34px, tablas) o 'sm' (compacto, filas internas de una ficha)
 * Los atributos (@click, :disabled…) pasan al <button>.
 */
const props = defineProps({
  icon: { type: [Object, Function], required: true },
  title: { type: String, required: true },
  tone: {
    type: String,
    default: 'neutral',
    validator: (v) => ['neutral', 'edit', 'danger', 'success'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['md', 'sm'].includes(v),
  },
})

// Clases completas (no interpoladas) para que Tailwind no las elimine al compilar
const TONES = {
  neutral: 'text-salvia hover:text-bosque hover:bg-salvia-50',
  edit: 'text-salvia hover:text-tierra hover:bg-tierra-50',
  danger: 'text-salvia hover:text-red-700 hover:bg-red-50',
  success: 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50',
}
const SIZES = {
  md: 'p-2 min-w-[34px] min-h-[34px]',
  sm: 'p-1.5',
}

const classes = computed(() => [
  'inline-flex items-center justify-center rounded-lg transition-colors cursor-pointer',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salvia disabled:opacity-50 disabled:cursor-not-allowed',
  TONES[props.tone],
  SIZES[props.size],
])
</script>

<template>
  <button type="button" :class="classes" :title="title" :aria-label="title">
    <component :is="icon" class="w-4 h-4" aria-hidden="true" />
  </button>
</template>

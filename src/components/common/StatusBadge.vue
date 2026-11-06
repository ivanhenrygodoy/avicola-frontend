<script setup>
import { computed } from 'vue'

/**
 * Badge (píldora) de estado, tipo o conteo. Fuente única de los colores de estado.
 *
 * variant:
 *   success → estado activo     (#DDF3E3 / texto bosque)
 *   danger  → inactivo, baja    (#FEE2E2 / texto #991B1B)
 *   warning → aviso preventivo  (huevo-suave / ámbar)
 *   info    → informativo       (azul suave)
 *   alert   → incidencia        (naranja suave)
 *   neutral → etiqueta o conteo (salvia suave)
 *   outline → dato secundario   (crema con borde; admite icono en el slot)
 * size: 'md' (por defecto) o 'sm' (conteos y etiquetas pequeñas)
 * as: 'span' (por defecto) o 'button' para un badge clicable (p. ej. alternar un estado);
 *     como botón añade type="button", cursor, resaltado al pasar el puntero y anillo de foco.
 *     Los atributos (@click, title, aria-*) pasan al elemento raíz.
 */
const props = defineProps({
  as: {
    type: String,
    default: 'span',
    validator: (v) => ['span', 'button'].includes(v),
  },
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => ['success', 'danger', 'warning', 'info', 'alert', 'neutral', 'outline'].includes(v),
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['md', 'sm'].includes(v),
  },
})

// Clases completas (no interpoladas) para que Tailwind no las elimine al compilar
const VARIANTS = {
  success: 'bg-[#DDF3E3] text-bosque border-bosque/20',
  danger: 'bg-[#FEE2E2] text-[#991B1B] border-red-200',
  warning: 'bg-huevo-suave text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  alert: 'bg-orange-50 text-orange-800 border-orange-200',
  neutral: 'bg-salvia/15 text-bosque border-salvia/20',
  outline: 'bg-crema text-verdoso border-borde',
}
const SIZES = {
  md: 'px-2.5 py-0.5 text-xs',
  sm: 'px-2 py-0.5 text-[11px]',
}

const classes = computed(() => [
  'inline-flex items-center gap-1.5 rounded-full border font-semibold whitespace-nowrap',
  VARIANTS[props.variant],
  SIZES[props.size],
  props.as === 'button'
    ? 'cursor-pointer transition-all hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-salvia'
    : '',
])
</script>

<template>
  <component :is="as" :type="as === 'button' ? 'button' : undefined" :class="classes"><slot /></component>
</template>

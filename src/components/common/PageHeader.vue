<script setup>
import { computed } from 'vue'

/**
 * Encabezado de página: título (Display de DESIGN.md), subtítulo opcional y un slot
 * `#actions` a la derecha (pestañas, fecha, botones). Fuente única del estilo del título.
 *
 * align:    'left' (por defecto) o 'center' (título centrado; el slot de acciones queda debajo)
 * bordered: línea inferior `borde` que separa el encabezado del contenido
 */
const props = defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  align: {
    type: String,
    default: 'left',
    validator: (v) => ['left', 'center'].includes(v),
  },
  bordered: { type: Boolean, default: false },
})

// Clases completas (no interpoladas) para que Tailwind no las elimine al compilar
const rootClasses = computed(() => [
  props.align === 'center'
    ? 'flex flex-col items-center text-center gap-4 pt-2 pb-1'
    : 'flex flex-col sm:flex-row sm:items-center sm:justify-between flex-wrap gap-4',
  props.bordered ? 'border-b border-borde pb-4' : '',
])
</script>

<template>
  <header :class="rootClasses">
    <div>
      <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">{{ title }}</h2>
      <p v-if="subtitle" class="text-sm text-verdoso-muted mt-1">{{ subtitle }}</p>
    </div>
    <slot name="actions" />
  </header>
</template>

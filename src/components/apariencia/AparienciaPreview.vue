<script setup>
import { computed, ref } from 'vue'
import FormField from '@/components/common/FormField.vue'
import FloatingInput from '@/components/common/FloatingInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'

const props = defineProps({
  claveComponente: {
    type: String,
    required: true,
  },
  modoEdicion: {
    type: String,
    default: 'claro',
  },
  variablesPreview: {
    type: Object,
    default: () => ({}),
  },
})

const textoDemo = ref('Casita Avícola Norte')
const filtroDemo = ref('')

const hexARgb = (hex) => {
  const limpio = String(hex || '').trim().replace('#', '')
  if (!/^[0-9A-Fa-f]{6}$/.test(limpio)) return null
  return `${parseInt(limpio.slice(0, 2), 16)} ${parseInt(limpio.slice(2, 4), 16)} ${parseInt(limpio.slice(4, 6), 16)}`
}

const estiloAislado = computed(() => {
  const estilos = {}
  Object.entries(props.variablesPreview || {}).forEach(([variable, valor]) => {
    const rgb = hexARgb(valor)
    estilos[variable] = rgb ?? valor
  })
  return estilos
})
</script>

<template>
  <div
    :data-theme="modoEdicion === 'nocturno' ? 'nocturno' : undefined"
    :style="estiloAislado"
    class="rounded-2xl border border-borde p-5 transition-colors"
    style="background-color: rgb(var(--avicola-crema)); color: rgb(var(--avicola-verdoso));"
  >
    <div class="flex items-center justify-between mb-4">
      <span class="text-xs font-bold uppercase tracking-wider text-verdoso-muted">
        Vista previa en vivo ({{ modoEdicion === 'nocturno' ? 'Modo Nocturno' : 'Modo Claro' }})
      </span>
      <StatusBadge variant="info" size="sm">{{ claveComponente }}</StatusBadge>
    </div>

    <!-- Preview de Botones -->
    <div v-if="claveComponente === 'botones'" class="bg-white rounded-2xl border border-borde p-5 shadow-xs flex flex-wrap items-center justify-center gap-3">
      <button type="button" class="btn-principal px-5 py-2.5 text-sm">Botón Principal</button>
      <button type="button" class="btn-secundario px-5 py-2.5 text-sm">Botón Secundario</button>
      <button type="button" class="btn-destructivo px-5 py-2.5 text-sm">Botón Destructivo</button>
    </div>

    <!-- Preview de Formularios -->
    <div v-else-if="claveComponente === 'formularios'" class="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4">
      <FormField
        v-model="textoDemo"
        label="Nombre de la instalación"
        placeholder="Ej. Galpón 1"
        required
      />
      <FormField
        model-value=""
        label="Campo con validación"
        placeholder="Escribe para probar..."
        error="Este campo es obligatorio"
      />
    </div>

    <!-- Preview de Cajas de Texto y Filtros -->
    <div v-else-if="claveComponente === 'filtros'" class="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FloatingInput v-model="filtroDemo" label="Buscar por código o nombre" placeholder="Ej. AVE-001" />
        <FloatingInput model-value="Todas las casitas" label="Casita asignada" />
      </div>
    </div>

    <!-- Preview de Sombras, Tarjetas y Ribetes -->
    <div v-else-if="['sombras', 'tarjetas', 'ribetes_contornos'].includes(claveComponente)" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div class="bg-white rounded-2xl border border-borde p-4 shadow-xs space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-verdoso-muted">Población activa</p>
        <p class="text-2xl font-extrabold text-verdoso">1,240</p>
        <p class="text-xs text-salvia font-medium">Borde, sombra y superficie</p>
      </div>
      <div class="bg-crema-surface rounded-2xl border-2 border-salvia p-4 shadow-card space-y-2">
        <p class="text-xs font-semibold uppercase tracking-wider text-verdoso-muted">Elemento enfocado</p>
        <button type="button" class="btn-principal px-4 py-1.5 text-xs ring-2 ring-salvia/50">
          Ribete de foco
        </button>
      </div>
    </div>

    <!-- Preview de Navegación -->
    <div v-else-if="claveComponente === 'navegacion'" class="bg-white rounded-2xl border border-borde p-4 shadow-xs space-y-2">
      <div class="px-3.5 py-2 rounded-xl font-semibold text-sm text-bosque bg-bosque-50 border border-bosque/20">
        Dashboard (Ítem activo)
      </div>
      <div class="px-3.5 py-2 rounded-xl font-medium text-sm text-verdoso-muted hover:bg-crema/70">
        Instalaciones (Ítem normal)
      </div>
      <div class="px-3.5 py-2 rounded-xl font-medium text-sm text-verdoso bg-bosque-100">
        Resaltado bosque-100
      </div>
    </div>

    <!-- Preview de Badges y Alertas -->
    <div v-else-if="claveComponente === 'badges'" class="bg-white rounded-2xl border border-borde p-4 shadow-xs space-y-3">
      <div class="flex flex-wrap gap-2">
        <StatusBadge variant="success">Activo</StatusBadge>
        <StatusBadge variant="warning">Advertencia</StatusBadge>
        <StatusBadge variant="danger">Inactivo</StatusBadge>
        <StatusBadge variant="info">Información</StatusBadge>
      </div>
      <BaseAlert type="success" message="Ejemplo de alerta verde (éxito) con los tonos configurados." :dismissible="false" />
      <BaseAlert type="warning" message="Ejemplo de alerta preventiva con los tonos corporativos." :dismissible="false" />
    </div>

    <!-- Preview general (Fondos y Tipografía) -->
    <div v-else class="bg-white rounded-2xl border border-borde p-5 shadow-xs space-y-3">
      <h4 class="text-lg font-extrabold text-verdoso">Encabezado Principal de Vista</h4>
      <p class="text-sm text-verdoso-muted">
        Texto secundario descriptivo sobre el fondo ambiental y la superficie de tarjeta configurados.
      </p>
      <div class="flex gap-2">
        <button type="button" class="btn-principal px-4 py-2 text-xs">Acción</button>
        <button type="button" class="btn-secundario px-4 py-2 text-xs">Cancelar</button>
      </div>
    </div>
  </div>
</template>


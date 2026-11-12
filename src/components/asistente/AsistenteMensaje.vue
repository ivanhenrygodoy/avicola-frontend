<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Database, AlertTriangle, User, CornerDownLeft } from 'lucide-vue-next'
import GallinaIcon from '@/components/common/GallinaIcon.vue'

const router = useRouter()

const props = defineProps({
  mensaje: {
    type: Object,
    required: true,
  },
})

const esUsuario = computed(() => props.mensaje.role === 'user')
const esError = computed(() => Boolean(props.mensaje.esError))

const navegarAModulo = (ruta) => {
  if (ruta && router) {
    router.push(ruta)
  }
}

// Mapa legible de nombres de herramientas
const nombresHerramientas = {
  consultar_inventario_aves: 'Inventario de aves',
  consultar_produccion_huevos: 'Producción de huevos',
  consultar_gastos_periodo: 'Control de gastos',
  consultar_ubicacion_ave: 'Ubicación de ave',
  consultar_raciones_alimento: 'Raciones de alimento',
  consultar_manuales_tecnicos: 'Manuales técnicos zootécnicos',
}

// Escapa el HTML del texto ANTES de aplicar el formato ligero. El texto proviene del usuario o del
// modelo y ahora se guarda y se vuelve a pintar al reabrir la conversación: sin escapar, un mensaje con
// `<img onerror=...>` se ejecutaría cada vez que se abra. Solo se emiten las etiquetas que genera
// `formatearTexto` (<br/>, <strong>, <div>, <span>, <a>).
const escaparHtml = (texto) =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

// Solo se permiten enlaces http(s) y rutas internas; `javascript:` y similares se descartan. Una ruta interna
// no puede empezar por `//` ni `/\`: el navegador las toma como un sitio externo (`//evil.com`).
const urlSegura = (url) => (/^(https?:\/\/|\/(?![/\\]))/i.test(url.trim()) ? url.trim() : '#')

const formatearTexto = (texto) => {
  if (!texto) return ''
  // Reemplazar saltos de línea dobles y simples
  return escaparHtml(texto)
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>')
    // Negritas básicas **texto**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Viñetas simples * item
    .replace(/(?:^|<br\/>)\*\s+(.*?)(?=(?:<br\/>|$))/g, '<div class="flex items-start gap-1.5 my-0.5"><span class="text-salvia shrink-0">•</span><span>$1</span></div>')
    // Enlaces markdown [texto](url)
    .replace(/\[(.*?)\]\(([^)]*?)\)/g, (_, etiqueta, url) => `<a href="${urlSegura(url)}" class="text-bosque underline font-medium hover:text-salvia">${etiqueta}</a>`)
}
</script>

<template>
  <div
    class="flex flex-col gap-1 w-full"
    :class="esUsuario ? 'items-end' : 'items-start'"
  >
    <!-- Contenedor del Mensaje -->
    <div
      class="flex gap-2 max-w-[90%]"
      :class="esUsuario ? 'flex-row-reverse' : 'flex-row'"
    >
      <!-- Avatar pequeño -->
      <div
        class="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        :class="esUsuario ? 'bg-salvia text-white' : esError ? 'bg-amber-600 text-white' : 'bg-bosque text-white'"
      >
        <User v-if="esUsuario" class="w-3.5 h-3.5" />
        <AlertTriangle v-else-if="esError" class="w-3.5 h-3.5 text-white" />
        <GallinaIcon v-else class="w-3.5 h-3.5 text-white" />
      </div>

      <!-- Burbuja -->
      <div
        class="p-3 text-sm rounded-2xl shadow-2xs leading-relaxed"
        :class="[
          esUsuario
            ? 'bg-bosque text-white rounded-tr-xs'
            : esError
              ? 'bg-red-50 border border-red-200 text-red-900 rounded-tl-xs'
              : 'bg-white border border-borde text-verdoso rounded-tl-xs'
        ]"
      >
        <!-- Texto formateado -->
        <div class="whitespace-pre-line" v-html="formatearTexto(mensaje.text)" />

        <!-- Herramientas consultadas si existen -->
        <div
          v-if="mensaje.herramientas && mensaje.herramientas.length > 0"
          class="mt-2.5 pt-2 border-t border-borde/70 flex flex-wrap gap-1.5 items-center"
        >
          <span class="text-[11px] text-verdoso-muted font-medium flex items-center gap-1">
            <Database class="w-3 h-3 text-salvia" />
            Consultado:
          </span>
          <span
            v-for="tool in mensaje.herramientas"
            :key="tool"
            class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-salvia-50 text-bosque border border-salvia/30"
          >
            {{ nombresHerramientas[tool] || tool }}
          </span>
        </div>
      </div>
    </div>

    <!-- Píldoras de Enlace a Módulos del Sistema (Estilo Capture 2) -->
    <div
      v-if="!esUsuario && mensaje.sugerenciasModulos && mensaje.sugerenciasModulos.length > 0"
      class="flex flex-col gap-1.5 w-full pl-8 pr-2 my-1"
    >
      <button
        v-for="sug in mensaje.sugerenciasModulos"
        :key="sug.ruta"
        type="button"
        @click="navegarAModulo(sug.ruta)"
        class="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white border border-borde rounded-full text-xs font-medium text-verdoso hover:text-bosque hover:border-salvia hover:bg-salvia-50 shadow-2xs transition-all duration-150 text-left cursor-pointer group w-fit max-w-full"
        :title="sug.descripcion || sug.titulo"
      >
        <CornerDownLeft class="w-3.5 h-3.5 text-salvia group-hover:text-bosque shrink-0 transition-colors" />
        <span class="truncate">{{ sug.titulo }}</span>
      </button>
    </div>

    <!-- Timestamp -->
    <span
      class="text-[10px] text-verdoso-muted/80 px-8"
      :class="esUsuario ? 'text-right' : 'text-left'"
    >
      {{ mensaje.timestamp }}
    </span>
  </div>
</template>


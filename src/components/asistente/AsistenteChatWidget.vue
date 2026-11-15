<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { useAsistenteStore } from '@/stores/asistente'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import AsistenteMensaje from './AsistenteMensaje.vue'
import AsistenteIndicador from './AsistenteIndicador.vue'
import HistorialConversacionesModal from './HistorialConversacionesModal.vue'
import {
  X,
  Send,
  Trash2,
  History,
  ChevronDown,
  HelpCircle,
} from 'lucide-vue-next'

const asistenteStore = useAsistenteStore()

const textoInput = ref('')
const contenedorMensajes = ref(null)
const mostrarHistorial = ref(false)

// Al montarse (el widget solo existe con sesión iniciada) se recupera la conversación que había abierta
// antes de recargar la página, si el navegador guardó su UUID.
onMounted(async () => {
  await asistenteStore.cargarConversacion()
  scrollToBottom()
})

// Historial y Limpiar quedan bloqueados mientras hay un mensaje en curso o se carga una conversación:
// si no, la respuesta tardía llegaría a un chat ya cambiado.
const ocupado = () => asistenteStore.cargando || asistenteStore.cargandoConversacion

const sugerencias = [
  '¿Cuántas aves activas hay en total?',
  '¿Qué cuidados y alimentación requiere el pato pichiche?',
  '¿Cuántos huevos se recolectaron en los últimos 7 días?',
  '¿Dónde está ubicada el ave AVE-001?',
  '¿Cuánto hemos gastado este mes?',
]

const scrollToBottom = async () => {
  await nextTick()
  if (contenedorMensajes.value) {
    contenedorMensajes.value.scrollTop = contenedorMensajes.value.scrollHeight
  }
}

watch(
  () => asistenteStore.mensajes.length,
  () => {
    scrollToBottom()
  }
)

watch(
  () => asistenteStore.cargando,
  () => {
    scrollToBottom()
  }
)

const handleEnviar = async () => {
  const texto = textoInput.value.trim()
  if (!texto || ocupado()) return

  textoInput.value = ''
  await asistenteStore.enviarMensaje(texto)
  scrollToBottom()
}

const aplicarSugerencia = (sugerencia) => {
  textoInput.value = sugerencia
  handleEnviar()
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-40 select-none">
    <!-- Ventana de Chat Flotante -->
    <transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="transform scale-95 opacity-0 translate-y-4"
      enter-to-class="transform scale-100 opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="transform scale-100 opacity-100 translate-y-0"
      leave-to-class="transform scale-95 opacity-0 translate-y-4"
    >
      <div
        v-if="asistenteStore.isOpen"
        class="absolute bottom-16 right-0 w-[360px] sm:w-[420px] h-[540px] max-h-[calc(100vh-100px)] rounded-2xl bg-white border border-borde shadow-2xl flex flex-col overflow-hidden"
      >
        <!-- Encabezado Corporativo -->
        <div class="bg-bosque text-white p-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white border border-white/20">
              <GallinaIcon class="w-5 h-5 text-salvia-100 gallina-nocturna-blanca" />
            </div>
            <div>
              <h3 class="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                AviaCore
                <span class="inline-block w-2 h-2 rounded-full bg-salvia animate-pulse" />
              </h3>
              <p class="text-[11px] text-white/75 font-normal">
                Consultas operativas en lenguaje natural
              </p>
            </div>
          </div>

          <!-- Botones de Acción de Cabecera -->
          <div class="flex items-center gap-1 text-white/80">
            <button
              type="button"
              class="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Historial de conversaciones"
              aria-label="Historial de conversaciones"
              :disabled="ocupado()"
              @click="mostrarHistorial = true"
            >
              <History class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Limpiar conversación"
              aria-label="Limpiar conversación"
              :disabled="ocupado()"
              @click="asistenteStore.limpiarHistorial()"
            >
              <Trash2 class="w-4 h-4" />
            </button>
            <button
              type="button"
              class="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors"
              title="Minimizar asistente"
              aria-label="Minimizar asistente"
              @click="asistenteStore.cerrarWidget"
            >
              <ChevronDown class="w-5 h-5" />
            </button>
          </div>
        </div>

        <!-- Área de Mensajes -->
        <div
          ref="contenedorMensajes"
          class="flex-1 overflow-y-auto p-4 space-y-3.5 bg-crema-surface/60"
        >
          <!-- Recuperando la conversación guardada tras recargar la página -->
          <LoadingState
            v-if="asistenteStore.cargandoConversacion"
            message="Cargando conversación..."
            submessage=""
          />

          <!-- Estado Inicial sin Mensajes -->
          <div
            v-else-if="!asistenteStore.tieneMensajes"
            class="h-full flex flex-col justify-center items-center text-center p-4 space-y-3"
          >
            <div class="w-12 h-12 rounded-2xl bg-bosque-50 border border-salvia/30 flex items-center justify-center text-bosque shadow-2xs">
              <GallinaIcon class="w-7 h-7 text-bosque gallina-nocturna-blanca" />
            </div>
            <div class="space-y-1">
              <h4 class="text-sm font-bold text-verdoso">
                ¿En qué puedo ayudarte hoy?
              </h4>
              <p class="text-xs text-verdoso-muted max-w-xs">
                Soy AviaCore. Puedo consultar el censo de aves, postura de huevos, raciones de alimento, gastos y ubicación de animales.
              </p>
            </div>

            <!-- Sugerencias Rápidas -->
            <div class="w-full pt-2 space-y-1.5">
              <p class="text-[11px] font-semibold text-verdoso-muted uppercase tracking-wider text-left px-1">
                Preguntas frecuentes:
              </p>
              <button
                v-for="(sug, idx) in sugerencias"
                :key="idx"
                type="button"
                class="w-full text-left text-xs p-2 rounded-xl bg-white border border-borde hover:border-salvia hover:bg-salvia-50/50 text-verdoso transition-all duration-150 flex items-center justify-between group cursor-pointer shadow-2xs"
                @click="aplicarSugerencia(sug)"
              >
                <span class="truncate pr-2">{{ sug }}</span>
                <span class="text-salvia opacity-0 group-hover:opacity-100 transition-opacity">→</span>
              </button>
            </div>
          </div>

          <!-- Listado de Mensajes -->
          <template v-else>
            <AsistenteMensaje
              v-for="msg in asistenteStore.mensajes"
              :key="msg.id"
              :mensaje="msg"
            />

            <!-- Indicador de Carga / Pensamiento -->
            <div v-if="asistenteStore.cargando" class="pt-1">
              <AsistenteIndicador />
            </div>
          </template>
        </div>

        <!-- Barra Inferior de Entrada de Texto -->
        <div class="p-2.5 bg-white border-t border-borde shrink-0">
          <form class="flex items-center gap-2" @submit.prevent="handleEnviar">
            <input
              v-model="textoInput"
              type="text"
              maxlength="1000"
              placeholder="Pregunta sobre aves, huevos, gastos..."
              class="flex-1 px-3.5 py-2 text-xs rounded-xl bg-crema-surface border border-borde text-verdoso placeholder-verdoso-muted/70 focus:outline-none focus:border-salvia focus:ring-1 focus:ring-salvia transition-colors"
              :disabled="ocupado()"
            />
            <button
              type="submit"
              :disabled="!textoInput.trim() || ocupado()"
              class="w-9 h-9 rounded-xl bg-bosque hover:bg-bosque-hover text-white flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 shadow-xs cursor-pointer"
              title="Enviar consulta"
              aria-label="Enviar consulta"
            >
              <Send class="w-4 h-4" />
            </button>
          </form>
          <div class="flex items-center justify-between text-[10px] text-verdoso-muted/70 px-1 pt-1.5">
            <span>Presiona Enter para enviar</span>
            <span>AviaCore IA + Function Calling</span>
          </div>
        </div>
      </div>
    </transition>

    <!-- Botón Flotante Disparador -->
    <button
      type="button"
      class="w-14 h-14 rounded-full bg-bosque text-white shadow-lg hover:bg-bosque-hover hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center cursor-pointer relative"
      :class="{ 'ring-4 ring-salvia/30': asistenteStore.isOpen }"
      title="AviaCore - Asistente Virtual"
      aria-label="Abrir asistente virtual AviaCore"
      @click="asistenteStore.toggleWidget"
    >
      <X v-if="asistenteStore.isOpen" class="w-6 h-6 transition-transform duration-200" />
      <GallinaIcon v-else class="w-7 h-7 text-salvia-100 gallina-nocturna-blanca transition-transform duration-200" />

      <!-- Badge de actividad si hay mensajes y está cerrado -->
      <span
        v-if="!asistenteStore.isOpen && asistenteStore.tieneMensajes"
        class="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-salvia text-white text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs"
      >
        {{ asistenteStore.totalMensajes }}
      </span>
    </button>

    <!-- Historial de conversaciones (se teletransporta al body: no depende del tamaño de la ventana del chat) -->
    <HistorialConversacionesModal
      :is-open="mostrarHistorial"
      @close="mostrarHistorial = false"
      @opened="scrollToBottom"
    />
  </div>
</template>


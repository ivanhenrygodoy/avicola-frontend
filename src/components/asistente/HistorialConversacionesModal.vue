<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import RenombrarConversacionModal from './RenombrarConversacionModal.vue'
import { useAsistenteStore } from '@/stores/asistente'
import { useNotificationStore } from '@/stores/notification'
import { History, MessagesSquare, Pencil, Trash2, X } from 'lucide-vue-next'

/**
 * Historial de conversaciones del usuario con el asistente. Nada se borra de verdad: "eliminar" solo cambia
 * el estado de la conversación en el servidor para que deje de aparecer aquí. Todo texto se muestra con interpolación
 * (`{{ }}`), nunca como HTML, porque el nombre y la vista previa vienen de lo que escribió el usuario.
 */
const props = defineProps({
  isOpen: { type: Boolean, required: true },
})

const emit = defineEmits(['close', 'opened'])

const asistenteStore = useAsistenteStore()
const notify = useNotificationStore()

const renombrando = ref(null) // { uuid, nombre } de la conversación que se está renombrando
const eliminando = ref(null) // { uuid, nombre } pendiente de confirmar
const eliminandoEnCurso = ref(false)

// Al abrir se pide el listado actualizado (otra pestaña o el nombre automático pudieron cambiarlo)
watch(
  () => props.isOpen,
  (abierto) => {
    if (abierto) asistenteStore.cargarHistorial()
  },
  { immediate: true },
)

const abrir = async (conversacion) => {
  if (asistenteStore.abriendoConversacion) return
  // El modal se cierra al elegir: la carga se ve en el chat ("Cargando conversación...").
  emit('close')
  try {
    const abierta = await asistenteStore.abrirConversacion(conversacion.uuid)
    if (abierta) emit('opened')
  } catch (err) {
    if (err.response?.status === 404) {
      notify.warning('Esa conversación ya no está en tu historial.')
    } else {
      console.error('Error abriendo la conversación:', err)
      notify.error('No se pudo abrir la conversación. Inténtalo de nuevo.')
    }
  }
}

const confirmarEliminar = async () => {
  if (!eliminando.value || eliminandoEnCurso.value) return
  eliminandoEnCurso.value = true
  try {
    await asistenteStore.eliminarConversacion(eliminando.value.uuid)
    notify.success('Conversación eliminada del historial.')
    eliminando.value = null
  } catch (err) {
    console.error('Error eliminando la conversación del historial:', err)
    notify.error('No se pudo eliminar la conversación del historial.')
  } finally {
    eliminandoEnCurso.value = false
  }
}

const esLaAbierta = (c) => c.uuid === asistenteStore.uuidConversacion

// Sin lista que mostrar (cargando, error o vacío) el mensaje va centrado en el modal; con lista no se centra
const sinLista = computed(() => !asistenteStore.conversaciones.length)
</script>

<template>
  <BaseModal :is-open="isOpen" :show-header="false" max-width="md" @close="emit('close')">
    <!-- Encabezado propio: título y subtítulo, como la referencia -->
    <div class="flex items-start justify-between gap-3 pb-3 border-b border-borde -mt-1">
      <div>
        <h3 class="text-lg font-bold text-verdoso tracking-tight">Historial de conversaciones</h3>
        <p class="text-xs text-verdoso-muted mt-0.5">Consulta y retoma tus consultas anteriores</p>
      </div>
      <button
        type="button"
        class="text-salvia hover:text-verdoso p-1.5 rounded-xl hover:bg-crema transition-colors cursor-pointer"
        title="Cerrar"
        aria-label="Cerrar historial"
        @click="emit('close')"
      >
        <X class="w-5 h-5" aria-hidden="true" />
      </button>
    </div>

    <div :class="['pt-4', sinLista ? 'min-h-[14rem] flex items-center justify-center' : 'min-h-[8rem]']">
      <LoadingState
        v-if="asistenteStore.cargandoHistorial && !asistenteStore.conversaciones.length"
        message="Cargando historial..."
        submessage=""
      />

      <EmptyState
        v-else-if="asistenteStore.errorHistorial && !asistenteStore.conversaciones.length"
        title="No se pudo cargar el historial"
        description="Cierra esta ventana e inténtalo de nuevo."
        :icon="History"
      />

      <EmptyState
        v-else-if="!asistenteStore.conversaciones.length"
        title="Aún no tienes conversaciones"
        description="Cuando hagas una consulta al asistente, aparecerá aquí para que puedas retomarla."
        :icon="History"
      />

      <ul v-else class="space-y-3 max-h-[55vh] overflow-y-auto pr-1" aria-label="Conversaciones anteriores">
        <li
          v-for="c in asistenteStore.conversaciones"
          :key="c.uuid"
          :class="[
            'flex items-center gap-2 p-2 rounded-2xl border transition-colors',
            esLaAbierta(c) ? 'border-salvia bg-salvia-50' : 'border-borde bg-crema/40 hover:bg-crema/70',
          ]"
        >
          <!-- Botón principal: abre la conversación en el chat -->
          <button
            type="button"
            class="flex-1 min-w-0 flex items-start gap-3 p-2 rounded-xl text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-salvia"
            :disabled="asistenteStore.abriendoConversacion"
            :aria-current="esLaAbierta(c) ? 'true' : undefined"
            @click="abrir(c)"
          >
            <MessagesSquare class="w-5 h-5 text-salvia shrink-0 mt-0.5" aria-hidden="true" />
            <span class="min-w-0 flex-1">
              <span class="block text-sm font-bold text-verdoso truncate">{{ c.nombre }}</span>
              <span class="block text-xs text-verdoso-muted mt-0.5">{{ c.ultima_actividad }}</span>
              <span v-if="c.vista_previa" class="block text-xs text-verdoso/80 mt-1 truncate">{{ c.vista_previa }}</span>
            </span>
          </button>

          <!-- Acciones: hermanas del botón principal, no anidadas dentro de él -->
          <div class="flex items-center shrink-0">
            <RowActionButton
              :icon="Pencil"
              tone="edit"
              title="Cambiar nombre"
              @click="renombrando = { uuid: c.uuid, nombre: c.nombre }"
            />
            <RowActionButton
              :icon="Trash2"
              tone="danger"
              title="Eliminar del historial"
              @click="eliminando = { uuid: c.uuid, nombre: c.nombre }"
            />
          </div>
        </li>
      </ul>
    </div>

    <template #footer>
      <button type="button" class="px-6 py-2.5 btn-secundario text-sm cursor-pointer" @click="emit('close')">
        Cerrar
      </button>
    </template>
  </BaseModal>

  <RenombrarConversacionModal
    :is-open="renombrando !== null"
    :conversacion="renombrando"
    @close="renombrando = null"
  />

  <BaseConfirmModal
    :is-open="eliminando !== null"
    title="Eliminar del historial"
    question="¿Eliminar esta conversación de tu historial?"
    description="Dejará de aparecer en tu historial. Podrás empezar otra conversación cuando quieras."
    confirm-text="Eliminar"
    cancel-text="Cancelar"
    :is-destructive="true"
    :loading="eliminandoEnCurso"
    @confirm="confirmarEliminar"
    @close="eliminando = null"
  />
</template>

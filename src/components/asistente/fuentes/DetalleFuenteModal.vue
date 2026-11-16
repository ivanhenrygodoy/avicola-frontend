<script setup>
import { computed, ref } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import PillTabs from '@/components/common/PillTabs.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useFuentesConocimientoStore } from '@/stores/fuentesConocimiento'
import { useNotificationStore } from '@/stores/notification'
import { useActionLoader } from '@/composables/useActionLoader'
import {
  FileText,
  Layers,
  User,
  Tag,
  CheckCircle2,
  AlertCircle,
} from 'lucide-vue-next'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['close'])

const store = useFuentesConocimientoStore()
const notify = useNotificationStore()
const loader = useActionLoader()

const tabActiva = ref('fragmentos')

const PESTANAS = [
  { value: 'fragmentos', label: 'Fragmentos indexados (Chunks)' },
  { value: 'texto', label: 'Texto original' },
]

const fuente = computed(() => store.fuenteSeleccionada)
const textoOriginal = computed(() => store.textoOriginalSeleccionado)

const esBorrador = computed(() => fuente.value?.estado?.clave === 'borrador')
const esPublicada = computed(() => fuente.value?.estado?.clave === 'publicada')
const esArchivada = computed(() => fuente.value?.estado?.clave === 'archivada')

const procesarBorrador = async () => {
  if (!fuente.value?.id) return

  if (
    !fuente.value.titulo?.trim() ||
    !fuente.value.autor?.trim() ||
    !fuente.value.version?.trim() ||
    !fuente.value.descripcion?.trim()
  ) {
    notify.warning('El borrador tiene campos vacíos. Edítalo antes de procesarlo.')
    return
  }

  try {
    await loader.run('Fragmentando documento y generando vectores embeddings...', async () => {
      await store.procesarFuente(fuente.value.id)
      notify.success('Fuente procesada, fragmentada y vectorizada con éxito.')
    })
  } catch (err) {
    notify.error(err.response?.data?.message || 'Error al procesar la fuente.')
  }
}

const editarBorrador = async () => {
  if (!fuente.value?.id) return
  const id = fuente.value.id
  emit('close')
  try {
    await store.abrirEdicion(id)
  } catch {
    notify.error('No se pudieron cargar los datos del borrador.')
  }
}

const descargar = async () => {
  if (!fuente.value) return
  try {
    await store.descargarArchivo(fuente.value)
  } catch {
    notify.error('No se pudo descargar el archivo fuente.')
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="fuente?.titulo || 'Detalle de Fuente de Conocimiento'"
    size="3xl"
    @close="emit('close')"
  >
    <div v-if="store.loadingDetalle" class="py-12">
      <LoadingState message="Cargando fragmentos y vectores de la fuente..." />
    </div>

    <div v-else-if="fuente" class="space-y-5">
      <p class="text-xs text-verdoso-muted">
        Revisa los metadatos, los fragmentos vectorizados en pgvector y el texto original de la fuente.
      </p>

      <!-- TARJETAS SUPERIORES DE METADATOS Y ESTADO -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="p-3.5 rounded-xl border border-borde bg-crema-surface space-y-1.5">
          <div class="flex items-center gap-1.5 text-xs text-verdoso-muted">
            <Layers class="w-3.5 h-3.5 text-salvia" />
            <span>Estado</span>
          </div>
          <div>
            <StatusBadge
              :variant="
                esPublicada ? 'success' :
                esArchivada ? 'warning' : 'neutral'
              "
            >
              {{ fuente.estado?.nombre || 'Borrador' }}
            </StatusBadge>
          </div>
        </div>

        <div class="p-3.5 rounded-xl border border-borde bg-crema-surface space-y-1.5">
          <div class="flex items-center gap-1.5 text-xs text-verdoso-muted">
            <CheckCircle2 v-if="esPublicada" class="w-3.5 h-3.5 text-bosque" />
            <AlertCircle v-else class="w-3.5 h-3.5 text-salvia" />
            <span>Disponible en IA</span>
          </div>
          <p class="text-sm font-bold" :class="esPublicada ? 'text-bosque' : 'text-verdoso-muted'">
            {{ esPublicada ? 'Sí (Activa en RAG)' : 'No (Inactiva)' }}
          </p>
        </div>

        <div class="p-3.5 rounded-xl border border-borde bg-crema-surface space-y-1.5">
          <div class="flex items-center gap-1.5 text-xs text-verdoso-muted">
            <Tag class="w-3.5 h-3.5 text-salvia" />
            <span>Especie</span>
          </div>
          <p class="text-sm font-bold text-verdoso">
            {{ fuente.especie || 'General' }}
          </p>
        </div>

        <div class="p-3.5 rounded-xl border border-borde bg-crema-surface space-y-1.5">
          <div class="flex items-center gap-1.5 text-xs text-verdoso-muted">
            <User class="w-3.5 h-3.5 text-salvia" />
            <span>Autor / Versión</span>
          </div>
          <p class="text-sm font-bold text-verdoso truncate" :title="fuente.autor">
            {{ fuente.autor || 'Zootecnia' }} (v{{ fuente.version || '1.0' }})
          </p>
        </div>
      </div>

      <!-- DESCRIPCIÓN -->
      <div v-if="fuente.descripcion" class="p-3.5 rounded-xl border border-borde bg-crema-surface text-xs text-verdoso">
        <span class="font-bold">Descripción:</span> {{ fuente.descripcion }}
      </div>

      <!-- SECCIÓN: CONTENIDO QUE SE UTILIZARÁ -->
      <div class="p-4 rounded-2xl border border-borde bg-crema-surface space-y-4">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-borde">
          <div class="flex items-center gap-2.5">
            <div class="p-1.5 rounded-lg bg-bosque-50 text-bosque">
              <FileText class="w-4 h-4" />
            </div>
            <div>
              <h4 class="text-sm font-bold text-verdoso">Contenido que se utilizará</h4>
              <p class="text-xs text-verdoso-muted">
                {{ fuente.fragmentos_count || fuente.fragmentos?.length || 0 }} fragmentos · {{ fuente.total_palabras || 0 }} palabras
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <StatusBadge
              :variant="
                esPublicada ? 'success' :
                esArchivada ? 'warning' : 'neutral'
              "
            >
              {{
                esPublicada
                  ? 'Indexada en pgvector (768d)'
                  : esArchivada
                    ? 'Archivada'
                    : 'Pendiente de indexar'
              }}
            </StatusBadge>

            <button
              v-if="fuente.ruta_archivo"
              type="button"
              class="btn-secundario px-3.5 py-1.5 text-xs"
              @click="descargar"
            >
              Descargar
            </button>
          </div>
        </div>

        <!-- PESTAÑAS: FRAGMENTOS VS TEXTO ORIGINAL -->
        <PillTabs
          v-model="tabActiva"
          :tabs="PESTANAS"
          class="border-b border-borde pb-2"
        />

        <!-- CONTENIDO PESTAÑA 1: FRAGMENTOS (CHUNKS) -->
        <div v-if="tabActiva === 'fragmentos'" class="space-y-3 max-h-96 overflow-y-auto pr-1">
          <div
            v-if="!fuente.fragmentos || fuente.fragmentos.length === 0"
            class="p-6 text-center rounded-xl border border-dashed border-borde bg-white space-y-2"
          >
            <AlertCircle class="w-8 h-8 text-salvia mx-auto" />
            <p class="text-sm font-semibold text-verdoso">
              Esta fuente no cuenta con fragmentos indexados todavía.
            </p>
            <p class="text-xs text-verdoso-muted max-w-md mx-auto">
              Se encuentra en estado <strong>Borrador</strong>. Haz clic en <strong>Procesar e Indexar</strong> para fragmentar el texto y calcular los vectores embeddings.
            </p>
          </div>

          <div
            v-for="(chunk, index) in fuente.fragmentos"
            :key="chunk.id || index"
            class="p-4 rounded-xl border border-borde bg-white space-y-2"
          >
            <div class="flex items-center justify-between gap-2 border-b border-borde pb-2">
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bosque-50 text-bosque text-xs font-bold">
                  {{ index + 1 }}
                </span>
                <h5 class="text-xs font-bold text-verdoso">
                  {{ chunk.titulo_seccion }}
                </h5>
              </div>

              <span class="text-[10px] uppercase font-semibold text-verdoso-muted px-2 py-0.5 rounded bg-crema border border-borde">
                Embedding 768d
              </span>
            </div>

            <p class="text-xs text-verdoso leading-relaxed whitespace-pre-line">
              {{ chunk.contenido }}
            </p>
          </div>
        </div>

        <!-- CONTENIDO PESTAÑA 2: TEXTO ORIGINAL COMPLETO -->
        <div v-else class="max-h-96 overflow-y-auto pr-1">
          <div class="p-4 rounded-xl border border-borde bg-white">
            <pre class="text-xs font-sans text-verdoso whitespace-pre-wrap leading-relaxed">{{ textoOriginal || 'No hay texto disponible.' }}</pre>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-wrap items-center justify-center gap-3 w-full">
        <button
          v-if="esBorrador"
          type="button"
          class="btn-secundario px-5 py-2.5 text-sm"
          :disabled="store.submitting"
          @click="editarBorrador"
        >
          Editar borrador
        </button>

        <button
          v-if="esBorrador"
          type="button"
          class="btn-principal px-5 py-2.5 text-sm"
          :disabled="store.submitting"
          @click="procesarBorrador"
        >
          {{ store.submitting ? 'Procesando embeddings...' : 'Procesar e Indexar' }}
        </button>

        <button
          type="button"
          class="btn-secundario px-5 py-2.5 text-sm"
          @click="emit('close')"
        >
          Cerrar
        </button>
      </div>
    </template>
  </BaseModal>
</template>

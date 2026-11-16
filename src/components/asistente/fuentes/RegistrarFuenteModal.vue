<script setup>
import { computed, ref, watch } from 'vue'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { useFuentesConocimientoStore } from '@/stores/fuentesConocimiento'
import { useNotificationStore } from '@/stores/notification'
import { useActionLoader } from '@/composables/useActionLoader'
import { FileText, BookOpen } from 'lucide-vue-next'

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

const tipoFuente = ref('documento')
const titulo = ref('')
const especie = ref('General')
const autor = ref('')
const version = ref('1.0')
const descripcion = ref('')
const textoContenido = ref('')
const archivoSeleccionado = ref(null)
const archivoActualNombre = ref('')
const inputArchivoRef = ref(null)
const errores = ref({})

const esEdicion = computed(() => Boolean(store.fuenteAEditar?.id))

const OPCIONES_TIPO_FUENTE = [
  { value: 'documento', label: 'Documento (PDF, TXT, Markdown)' },
  { value: 'texto', label: 'Texto directo (escritura manual o pegado)' },
]

const OPCIONES_ESPECIE = [
  { value: 'General', label: 'General / Todas las aves' },
  { value: 'Gallina', label: 'Gallina Criolla' },
  { value: 'Chompipe', label: 'Chompipe / Pavo' },
  { value: 'Pato', label: 'Pato Pichiche' },
]

const limpiarFormulario = () => {
  tipoFuente.value = 'documento'
  titulo.value = ''
  especie.value = 'General'
  autor.value = ''
  version.value = '1.0'
  descripcion.value = ''
  textoContenido.value = ''
  archivoSeleccionado.value = null
  archivoActualNombre.value = ''
  if (inputArchivoRef.value) {
    inputArchivoRef.value.value = ''
  }
  errores.value = {}
}

const cargarDatosEdicion = () => {
  const f = store.fuenteAEditar
  if (!f) return
  tipoFuente.value = f.tipo_fuente || 'documento'
  titulo.value = f.titulo || ''
  especie.value = f.especie || 'General'
  autor.value = f.autor || ''
  version.value = f.version || '1.0'
  descripcion.value = f.descripcion || ''
  textoContenido.value = store.textoOriginalEditar || ''
  archivoSeleccionado.value = null
  archivoActualNombre.value = f.nombre_archivo_original || ''
  errores.value = {}
}

watch(
  () => [props.isOpen, store.fuenteAEditar],
  ([abierto]) => {
    if (!abierto) return
    if (store.fuenteAEditar?.id) {
      cargarDatosEdicion()
    } else {
      limpiarFormulario()
    }
  }
)

const onArchivoSeleccionado = (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  const ext = file.name.split('.').pop()?.toLowerCase()
  if (!['pdf', 'txt', 'md', 'markdown'].includes(ext)) {
    errores.value.archivo = 'Formato no soportado. Debe ser PDF, TXT o MD.'
    archivoSeleccionado.value = null
    return
  }
  if (file.size > 20 * 1024 * 1024) {
    errores.value.archivo = 'El archivo supera el límite de 20 MB.'
    archivoSeleccionado.value = null
    return
  }

  archivoSeleccionado.value = file
  errores.value.archivo = ''
  if (!titulo.value.trim()) {
    titulo.value = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
  }
}

const validar = (accion) => {
  errores.value = {}

  if (tipoFuente.value === 'documento') {
    const tieneArchivoPrevio =
      esEdicion.value &&
      store.fuenteAEditar?.tipo_fuente === 'documento' &&
      Boolean(archivoActualNombre.value)

    if (!archivoSeleccionado.value && !tieneArchivoPrevio) {
      errores.value.archivo = 'Debe seleccionar un archivo (PDF, TXT o MD).'
    }
  } else {
    if (!textoContenido.value.trim() || textoContenido.value.trim().length < 10) {
      errores.value.textoContenido = 'Debe ingresar un contenido de texto de al menos 10 caracteres.'
    }
  }

  // En borrador solo se valida el documento o texto; al procesar se exigen todos los campos
  if (accion === 'procesar') {
    if (!titulo.value.trim()) {
      errores.value.titulo = 'El título de la fuente es obligatorio.'
    }
    if (!especie.value.trim()) {
      errores.value.especie = 'Debe seleccionar la especie destino.'
    }
    if (!autor.value.trim()) {
      errores.value.autor = 'El autor o entidad es obligatorio.'
    }
    if (!version.value.trim()) {
      errores.value.version = 'La versión del documento es obligatoria.'
    }
    if (!descripcion.value.trim()) {
      errores.value.descripcion = 'La descripción o resumen es obligatoria.'
    }
  }

  if (Object.keys(errores.value).length > 0) {
    return false
  }
  return true
}

const enviar = async (accion) => {
  if (!validar(accion)) return

  const formData = new FormData()
  formData.append('tipo_fuente', tipoFuente.value)
  formData.append('titulo', titulo.value.trim())
  formData.append('especie', especie.value.trim())
  formData.append('autor', autor.value.trim())
  formData.append('version', version.value.trim())
  formData.append('descripcion', descripcion.value.trim())
  formData.append('accion', accion)

  if (tipoFuente.value === 'documento') {
    if (archivoSeleccionado.value) {
      formData.append('archivo', archivoSeleccionado.value)
    }
  } else {
    formData.append('texto_contenido', textoContenido.value.trim())
  }

  const mensajeCarga =
    accion === 'procesar'
      ? 'Fragmentando documento y calculando vectores embeddings...'
      : esEdicion.value
        ? 'Actualizando borrador...'
        : 'Guardando fuente en borrador...'

  try {
    await loader.run(mensajeCarga, async () => {
      const res = esEdicion.value
        ? await store.actualizarFuente(store.fuenteAEditar.id, formData)
        : await store.registrarFuente(formData)

      notify.success(res.message || 'Fuente guardada con éxito.')
      emit('close')
    })
  } catch (err) {
    if (err.response?.status === 422 && err.response?.data?.errors) {
      errores.value = Object.fromEntries(
        Object.entries(err.response.data.errors).map(([k, v]) => [k, v[0]])
      )
    } else {
      notify.error(err.response?.data?.message || 'Error al guardar la fuente de conocimiento.')
    }
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen"
    :title="esEdicion ? 'Editar borrador de fuente' : 'Registrar fuente de conocimiento'"
    size="2xl"
    @close="emit('close')"
  >
    <div v-if="store.loadingEdicion" class="py-12">
      <LoadingState message="Cargando datos del borrador..." />
    </div>

    <form v-else class="space-y-5" @submit.prevent>
      <p class="text-xs text-verdoso-muted">
        {{
          esEdicion
            ? 'Actualiza la información del borrador antes de procesarlo y publicarlo en la base vectorial.'
            : 'Puedes guardar la fuente como borrador para revisarla luego, o registrarla y procesarla de inmediato.'
        }}
      </p>

      <!-- BLOQUE 1: CONTENIDO -->
      <div class="p-4 rounded-2xl border border-borde bg-crema-surface space-y-4">
        <div class="flex items-center gap-2.5 pb-2.5 border-b border-borde">
          <div class="p-1.5 rounded-lg bg-bosque-50 text-bosque">
            <FileText class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-verdoso">Contenido</h4>
            <p class="text-xs text-verdoso-muted">Origen de la información que usará el asistente zootécnico</p>
          </div>
        </div>

        <FormField
          id="tipo_fuente"
          v-model="tipoFuente"
          label="Tipo de fuente"
          type="select"
          required
          :options="OPCIONES_TIPO_FUENTE"
          :error="errores.tipo_fuente"
        />

        <!-- Input dinámico: Documento -->
        <div v-if="tipoFuente === 'documento'" class="space-y-2">
          <label
            :class="[
              'block text-xs font-semibold uppercase tracking-wider',
              errores.archivo ? 'text-red-600' : 'text-verdoso-muted'
            ]"
          >
            Documento <span class="text-red-600">*</span>
          </label>
          <div
            :class="[
              'flex flex-wrap items-center gap-3 p-3 rounded-xl border border-dashed bg-white transition-colors',
              errores.archivo ? 'border-2 border-red-500' : 'border-borde'
            ]"
          >
            <input
              ref="inputArchivoRef"
              type="file"
              accept=".pdf,.txt,.md"
              class="hidden"
              @change="onArchivoSeleccionado"
            />
            <button
              type="button"
              class="btn-secundario px-4 py-2 text-xs"
              @click="inputArchivoRef?.click()"
            >
              {{ archivoActualNombre && !archivoSeleccionado ? 'Reemplazar archivo' : 'Elegir archivo' }}
            </button>
            <span class="text-xs text-verdoso truncate flex-1">
              {{
                archivoSeleccionado
                  ? archivoSeleccionado.name
                  : archivoActualNombre
                    ? `Archivo actual: ${archivoActualNombre}`
                    : 'Ningún archivo seleccionado'
              }}
            </span>
          </div>
          <p class="text-[11px] text-verdoso-muted">
            Formatos admitidos: PDF, TXT, Markdown (.md). Tamaño máximo: 20 MB.
          </p>
          <p v-if="errores.archivo" class="text-xs text-red-600 font-medium">
            {{ errores.archivo }}
          </p>
        </div>

        <!-- Input dinámico: Texto directo -->
        <div v-else class="space-y-2">
          <FormField
            id="texto_contenido"
            v-model="textoContenido"
            label="Texto o artículo zootécnico"
            type="textarea"
            :rows="6"
            required
            placeholder="Pega o escribe aquí el contenido del manual, instrucciones de alimentación, vacunas o manejo..."
            :error="errores.textoContenido"
            @update:error="errores.textoContenido = $event"
          />
          <div class="flex justify-between items-center text-[11px] text-verdoso-muted">
            <span>Se troceará en fragmentos semánticos con sus vectores embeddings.</span>
            <span>{{ textoContenido.length }} caracteres</span>
          </div>
        </div>
      </div>

      <!-- BLOQUE 2: IDENTIFICACIÓN -->
      <div class="p-4 rounded-2xl border border-borde bg-crema-surface space-y-4">
        <div class="flex items-center gap-2.5 pb-2.5 border-b border-borde">
          <div class="p-1.5 rounded-lg bg-huevo-suave text-verdoso">
            <BookOpen class="w-4 h-4" />
          </div>
          <div>
            <h4 class="text-sm font-bold text-verdoso">Identificación</h4>
            <p class="text-xs text-verdoso-muted">Cómo reconocerás esta fuente en el catálogo del asistente</p>
          </div>
        </div>

        <FormField
          id="titulo"
          v-model="titulo"
          label="Título de la fuente"
          type="text"
          required
          placeholder="Ej: Manual Técnico de Crianza del Pato Pichiche"
          :error="errores.titulo"
          @update:error="errores.titulo = $event"
        />

        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <FormField
            id="especie"
            v-model="especie"
            label="Especie destino"
            type="select"
            required
            :options="OPCIONES_ESPECIE"
            :error="errores.especie"
            @update:error="errores.especie = $event"
          />
          <FormField
            id="autor"
            v-model="autor"
            label="Autor / Entidad"
            type="text"
            required
            placeholder="Ej: Depto. Zootécnico"
            :error="errores.autor"
            @update:error="errores.autor = $event"
          />
          <FormField
            id="version"
            v-model="version"
            label="Versión"
            type="text"
            required
            placeholder="1.0"
            :error="errores.version"
            @update:error="errores.version = $event"
          />
        </div>

        <div class="space-y-1">
          <FormField
            id="descripcion"
            v-model="descripcion"
            label="Descripción o resumen"
            type="textarea"
            :rows="2"
            required
            placeholder="Breve resumen del contenido para consulta rápida..."
            :error="errores.descripcion"
            @update:error="errores.descripcion = $event"
          />
          <div class="text-right text-[11px] text-verdoso-muted">
            {{ descripcion.length }}/500
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex flex-wrap items-center justify-center gap-3 w-full">
        <button
          type="button"
          class="btn-secundario px-5 py-2.5 text-sm"
          :disabled="store.submitting"
          @click="emit('close')"
        >
          Cancelar
        </button>

        <button
          type="button"
          class="btn-secundario px-5 py-2.5 text-sm"
          :disabled="store.submitting"
          @click="enviar('borrador')"
        >
          {{ store.submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Guardar en borrador' }}
        </button>

        <button
          type="button"
          class="btn-principal px-5 py-2.5 text-sm"
          :disabled="store.submitting"
          @click="enviar('procesar')"
        >
          {{ store.submitting ? 'Procesando...' : esEdicion ? 'Guardar y procesar' : 'Registrar y procesar' }}
        </button>
      </div>
    </template>
  </BaseModal>
</template>

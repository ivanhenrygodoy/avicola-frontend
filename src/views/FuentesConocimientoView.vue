<script setup>
import { computed, onMounted, ref } from 'vue'
import { useFuentesConocimientoStore } from '@/stores/fuentesConocimiento'
import { useNotificationStore } from '@/stores/notification'
import { provideActionLoader } from '@/composables/useActionLoader'

// Componentes comunes globales (SOLID)
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import FilterBar from '@/components/common/FilterBar.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import ConfirmStatusModal from '@/components/common/ConfirmStatusModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'

// Modales del módulo
import RegistrarFuenteModal from '@/components/asistente/fuentes/RegistrarFuenteModal.vue'
import DetalleFuenteModal from '@/components/asistente/fuentes/DetalleFuenteModal.vue'

import {
  Eye,
  Pencil,
  Archive,
  ArchiveRestore,
  Download,
} from 'lucide-vue-next'

const store = useFuentesConocimientoStore()
const notify = useNotificationStore()

// Overlay de carga provisto a todos los modales hijos
const loader = provideActionLoader()
const { isSubmitting, message: actionLoaderMessage } = loader

// Columnas de la tabla (solo Estado y acciones de cambio de estado llevan color semántico)
const COLUMNAS = [
  { key: 'titulo', label: 'Fuente / Documento', align: 'left' },
  { key: 'especie', label: 'Especie', align: 'left', cellClass: 'text-verdoso' },
  { key: 'tipo_fuente', label: 'Origen', align: 'left', cellClass: 'text-verdoso' },
  { key: 'fragmentos_count', label: 'Fragmentos', align: 'center', cellClass: 'text-verdoso' },
  { key: 'estado', label: 'Estado', align: 'center' },
  { key: 'acciones', label: 'Acciones', align: 'right' },
]

const OPCIONES_ESPECIE = [
  { value: 'Todas', label: 'Todas las especies' },
  { value: 'General', label: 'General' },
  { value: 'Gallina', label: 'Gallina' },
  { value: 'Chompipe', label: 'Chompipe' },
  { value: 'Pato', label: 'Pato' },
]

const OPCIONES_ESTADO = [
  { value: 'Todos', label: 'Todos los estados' },
  { value: 'publicada', label: 'Publicada' },
  { value: 'borrador', label: 'Borrador' },
  { value: 'archivada', label: 'Archivada' },
]

const filterFields = computed(() => [
  { key: 'busqueda', type: 'search', label: 'Buscar por título o autor' },
  { key: 'especie', type: 'select', label: 'Especie', options: OPCIONES_ESPECIE },
  { key: 'estado', type: 'select', label: 'Estado', options: OPCIONES_ESTADO },
])

// Modal de confirmación para archivar o publicar/reactivar
const modalConfirmar = ref({
  abierto: false,
  fuente: null,
  titulo: '',
  pregunta: '',
  descripcion: '',
  confirmText: '',
  esDestructivo: false,
})

const abrirConfirmacionEstado = (fuente) => {
  const estaPublicada = fuente.estado?.clave === 'publicada'
  modalConfirmar.value = {
    abierto: true,
    fuente,
    titulo: estaPublicada ? 'Archivar fuente de conocimiento' : 'Publicar fuente de conocimiento',
    pregunta: estaPublicada
      ? `¿Deseas archivar "${fuente.titulo}"?`
      : `¿Deseas publicar nuevamente "${fuente.titulo}"?`,
    descripcion: estaPublicada
      ? 'La fuente dejará de estar disponible para el asistente AviaCore y no será consultada en las búsquedas vectoriales. No se eliminarán sus fragmentos.'
      : 'La fuente volverá a estar activa de inmediato y el asistente la consultará al responder preguntas zootécnicas.',
    confirmText: estaPublicada ? 'Archivar' : 'Publicar',
    esDestructivo: estaPublicada,
  }
}

const cerrarModalConfirmar = () => {
  modalConfirmar.value.abierto = false
  modalConfirmar.value.fuente = null
}

const ejecutarConfirmacion = async () => {
  const { fuente, esDestructivo } = modalConfirmar.value
  if (!fuente) return

  const mensajeLoader = esDestructivo ? 'Archivando fuente...' : 'Publicando fuente...'
  try {
    await loader.run(mensajeLoader, async () => {
      const res = await store.alternarEstadoFuente(fuente.id)
      notify.success(res.message || 'Estado actualizado con éxito.')
    })
  } catch (err) {
    notify.error(err.response?.data?.message || 'Error al cambiar el estado de la fuente.')
  } finally {
    cerrarModalConfirmar()
  }
}

const handleSearch = async () => {
  await store.cargarFuentes(1)
}

const handleClear = async () => {
  await store.limpiarFiltros()
}

const handlePageChange = async (page) => {
  await store.cargarFuentes(page)
}

const handlePerPageChange = async (perPage) => {
  await store.setPerPage(perPage)
}

const abrirEditar = async (row) => {
  try {
    await store.abrirEdicion(row.id)
  } catch {
    notify.error('No se pudo cargar el borrador para edición.')
  }
}

const descargar = async (fuente) => {
  try {
    await store.descargarArchivo(fuente)
    notify.success('Archivo descargado con éxito.')
  } catch {
    notify.error('No se pudo descargar el archivo fuente.')
  }
}

onMounted(() => {
  store.cargarFuentes(1)
})
</script>

<template>
  <div class="flex-1 flex flex-col">
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Encabezado de Página -->
      <PageHeader
        title="Fuentes de Conocimiento RAG"
        subtitle="Administra libros, manuales zootécnicos y guías técnicas vectorizadas para el asistente virtual AviaCore."
      />

      <!-- KPIs Métricos -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Fuentes Publicadas"
          :value="`${store.stats.total_publicadas} / ${store.stats.total_fuentes}`"
          subtitle="Activas en la base del asistente"
          value-color-class="text-bosque"
        />
        <StatCard
          title="Fragmentos Vectorizados"
          :value="store.stats.total_fragmentos"
          subtitle="Vectores en pgvector (768d)"
          value-color-class="text-bosque"
        />
        <StatCard
          title="Especies Cubiertas"
          :value="store.stats.especies_cubiertas"
          subtitle="Gallina, Chompipe, Pato"
          value-color-class="text-verdoso"
        />
      </div>

      <!-- Barra de Filtros Reutilizable -->
      <FilterBar
        v-model="store.filtros"
        :fields="filterFields"
        :loading="store.loading"
        action-label="Registrar fuente"
        @search="handleSearch"
        @clear="handleClear"
        @action="store.abrirRegistro"
      />

      <!-- Tabla de Fuentes de Conocimiento -->
      <DataTable
        :columns="COLUMNAS"
        :rows="store.fuentes"
        :loading="store.loading"
        :meta="store.meta"
        item-label="fuentes"
        empty-title="No hay fuentes registradas"
        empty-description="Sube un manual en PDF/TXT o ingresa un texto zootécnico para alimentar la base vectorial del asistente."
        empty-action-label="Limpiar filtros"
        @empty-action="handleClear"
        @update:page="handlePageChange"
        @update:per-page="handlePerPageChange"
      >
        <template #cell-titulo="{ row }">
          <div class="space-y-0.5 max-w-sm">
            <p class="font-semibold text-verdoso text-sm truncate" :title="row.titulo">
              {{ row.titulo }}
            </p>
            <p class="text-xs text-verdoso-muted truncate">
              {{ row.autor || 'Equipo Zootécnico' }} · v{{ row.version || '1.0' }}
            </p>
          </div>
        </template>

        <template #cell-especie="{ row }">
          {{ row.especie || 'General' }}
        </template>

        <template #cell-tipo_fuente="{ row }">
          {{ row.tipo_fuente === 'documento' ? 'Archivo' : 'Texto directo' }}
        </template>

        <template #cell-fragmentos_count="{ row }">
          {{ row.fragmentos_count ?? 0 }}
        </template>

        <template #cell-estado="{ row }">
          <StatusBadge
            :variant="
              row.estado?.clave === 'publicada' ? 'success' :
              row.estado?.clave === 'archivada' ? 'warning' : 'neutral'
            "
          >
            {{ row.estado?.nombre || 'Borrador' }}
          </StatusBadge>
        </template>

        <template #cell-acciones="{ row }">
          <div class="flex items-center justify-end gap-1.5">
            <!-- Ver detalle (Ojito) -->
            <RowActionButton
              :icon="Eye"
              title="Ver detalle y fragmentos vectorizados"
              tone="neutral"
              @click="store.abrirDetalle(row.id)"
            />

            <!-- Editar borrador -->
            <RowActionButton
              v-if="row.estado?.clave === 'borrador'"
              :icon="Pencil"
              title="Editar borrador"
              tone="edit"
              @click="abrirEditar(row)"
            />

            <!-- Archivar fuente publicada -->
            <RowActionButton
              v-if="row.estado?.clave === 'publicada'"
              :icon="Archive"
              title="Archivar fuente"
              tone="danger"
              @click="abrirConfirmacionEstado(row)"
            />

            <!-- Publicar / Reactivar fuente archivada -->
            <RowActionButton
              v-if="row.estado?.clave === 'archivada'"
              :icon="ArchiveRestore"
              title="Publicar fuente"
              tone="success"
              @click="abrirConfirmacionEstado(row)"
            />

            <!-- Descargar archivo físico si existe -->
            <RowActionButton
              v-if="row.ruta_archivo"
              :icon="Download"
              title="Descargar archivo original"
              tone="neutral"
              @click="descargar(row)"
            />
          </div>
        </template>
      </DataTable>
    </main>

    <!-- MODAL REGISTRO / EDICIÓN DE BORRADOR -->
    <RegistrarFuenteModal
      :is-open="store.modalRegistroAbierto"
      @close="store.cerrarRegistro"
    />

    <!-- MODAL DETALLE -->
    <DetalleFuenteModal
      :is-open="store.modalDetalleAbierto"
      @close="store.cerrarDetalle"
    />

    <!-- MODAL DE CONFIRMACIÓN DE ESTADO (ARCHIVAR / PUBLICAR) -->
    <ConfirmStatusModal
      :is-open="modalConfirmar.abierto"
      :title="modalConfirmar.titulo"
      :question="modalConfirmar.pregunta"
      :description="modalConfirmar.descripcion"
      :confirm-text="modalConfirmar.confirmText"
      :is-destructive="modalConfirmar.esDestructivo"
      @confirm="ejecutarConfirmacion"
      @close="cerrarModalConfirmar"
    />

    <!-- OVERLAY DE CARGA CORPORATIVO -->
    <ActionLoader
      :is-open="isSubmitting"
      :message="actionLoaderMessage"
    />
  </div>
</template>

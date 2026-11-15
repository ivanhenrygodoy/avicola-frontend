<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useTemaStore } from '@/stores/tema'
import { useNotificationStore } from '@/stores/notification'
import { provideActionLoader } from '@/composables/useActionLoader'
import PageHeader from '@/components/common/PageHeader.vue'
import StatCard from '@/components/common/StatCard.vue'
import SectionCard from '@/components/common/SectionCard.vue'
import PillTabs from '@/components/common/PillTabs.vue'
import FloatingInput from '@/components/common/FloatingInput.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import AspectoEditorField from '@/components/apariencia/AspectoEditorField.vue'
import AparienciaPreview from '@/components/apariencia/AparienciaPreview.vue'
import {
  Palette,
  MousePointerClick,
  FileInput,
  SlidersHorizontal,
  SquareDashed,
  Layers,
  CreditCard,
  PanelLeft,
  PaintBucket,
  Tag,
  RotateCcw,
  Save,
  Sun,
  Moon,
} from 'lucide-vue-next'

const temaStore = useTemaStore()
const notify = useNotificationStore()
const { isSubmitting: ejecutandoAccion, message: mensajeLoader, run: runWithLoader } = provideActionLoader()

const ICONOS = {
  MousePointerClick,
  FileInput,
  SlidersHorizontal,
  SquareDashed,
  Layers,
  CreditCard,
  PanelLeft,
  PaintBucket,
  Tag,
  Palette,
}

const busqueda = ref('')
const claveSeleccionada = ref('')
const modoEdicion = ref('claro')
const borrador = reactive({})
const errores = reactive({})
const confirmRestaurarComponente = ref(false)
const confirmRestaurarTodo = ref(false)

const TABS_MODO = [
  { value: 'claro', label: 'Modo Claro', icon: Sun },
  { value: 'nocturno', label: 'Modo Nocturno', icon: Moon },
]

const componentesFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return temaStore.componentes
  return temaStore.componentes.filter(
    (c) => c.nombre.toLowerCase().includes(q) || c.descripcion?.toLowerCase().includes(q)
  )
})

const totalPersonalizados = computed(() =>
  temaStore.componentes.filter((c) => c.personalizado).length
)

const aspectosDelModo = computed(() => {
  const detalle = temaStore.componenteActual
  if (!detalle?.aspectos) return []
  return detalle.aspectos[modoEdicion.value] || []
})

const variablesPreview = computed(() => {
  const mapa = { ...(temaStore.paleta[modoEdicion.value] || {}) }
  aspectosDelModo.value.forEach((asp) => {
    mapa[asp.variable_css] = borrador[asp.aspecto] ?? asp.valor_actual
  })
  return mapa
})

const cargarBorrador = () => {
  Object.keys(borrador).forEach((k) => delete borrador[k])
  Object.keys(errores).forEach((k) => delete errores[k])
  aspectosDelModo.value.forEach((asp) => {
    borrador[asp.aspecto] = asp.valor_actual
  })
}

const seleccionarComponente = async (clave) => {
  claveSeleccionada.value = clave
  try {
    await temaStore.fetchComponente(clave)
    cargarBorrador()
  } catch {
    notify.error('No se pudo cargar la configuración del componente.')
  }
}

watch(modoEdicion, () => {
  cargarBorrador()
})

const validarHexLocal = () => {
  let valido = true
  Object.keys(errores).forEach((k) => delete errores[k])

  aspectosDelModo.value.forEach((asp) => {
    const valor = String(borrador[asp.aspecto] || '').trim()
    if (asp.tipo_control === 'color' && !/^#[0-9A-Fa-f]{6}$/.test(valor)) {
      errores[asp.aspecto] = 'Usa formato hexadecimal válido (#RRGGBB).'
      valido = false
    } else if (!valor) {
      errores[asp.aspecto] = 'Este valor es obligatorio.'
      valido = false
    }
  })

  return valido
}

const guardarCambios = async () => {
  if (!temaStore.componenteActual) return
  if (!validarHexLocal()) {
    notify.warning('Revisa los valores marcados antes de guardar.')
    return
  }

  const payloadAspectos = aspectosDelModo.value.map((asp) => ({
    aspecto: asp.aspecto,
    valor_actual: String(borrador[asp.aspecto] || '').trim(),
  }))

  await runWithLoader('Aplicando paleta al sistema...', async () => {
    try {
      await temaStore.guardarComponente(temaStore.componenteActual.clave, modoEdicion.value, payloadAspectos)
      cargarBorrador()
      notify.success(`Apariencia de «${temaStore.componenteActual.nombre}» actualizada.`)
    } catch (err) {
      if (err.response?.status === 422) {
        notify.warning(err.response.data?.message || 'Algunos valores no son válidos.')
      } else {
        notify.error('No se pudieron guardar los cambios de apariencia.')
      }
    }
  })
}

const ejecutarRestaurarComponente = async () => {
  confirmRestaurarComponente.value = false
  if (!temaStore.componenteActual) return

  await runWithLoader('Restaurando valores originales...', async () => {
    try {
      await temaStore.restaurarComponente(temaStore.componenteActual.clave, modoEdicion.value)
      cargarBorrador()
      notify.success(`Se restauraron los valores por defecto de «${temaStore.componenteActual.nombre}».`)
    } catch {
      notify.error('Error al restaurar el componente.')
    }
  })
}

const ejecutarRestaurarTodo = async () => {
  confirmRestaurarTodo.value = false
  await runWithLoader('Restaurando toda la paleta oficial...', async () => {
    try {
      await temaStore.restaurarTodo()
      cargarBorrador()
      notify.success('Toda la paleta del sistema fue restaurada a DESIGN.md.')
    } catch {
      notify.error('No se pudo restaurar la paleta completa.')
    }
  })
}

onMounted(async () => {
  modoEdicion.value = temaStore.modo
  await temaStore.fetchComponentes()
  if (temaStore.componentes.length > 0) {
    await seleccionarComponente(temaStore.componentes[0].clave)
  }
})
</script>

<template>
  <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
    <PageHeader
      title="Apariencia y Paleta Dinámica"
      subtitle="Personaliza los colores, contornos, ribetes, formularios y sombras del sistema en modo claro y nocturno."
    >
      <template #actions>
        <button
          type="button"
          class="btn-secundario px-4 py-2 text-sm gap-2"
          @click="confirmRestaurarTodo = true"
        >
          <RotateCcw class="w-4 h-4" />
          Restaurar todo por defecto
        </button>
      </template>
    </PageHeader>

    <!-- KPIs de Resumen -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        title="Componentes Configurables"
        :value="temaStore.componentes.length"
        subtitle="Grupos visuales del sistema"
      />
      <StatCard
        title="Componentes Personalizados"
        :value="totalPersonalizados"
        :value-color-class="totalPersonalizados > 0 ? 'text-huevo' : 'text-bosque'"
        subtitle="Con cambios respecto a DESIGN.md"
      />
      <StatCard
        title="Modo Activo en Sesión"
        :value="temaStore.esNocturno ? 'Nocturno' : 'Claro'"
        value-color-class="text-bosque"
        subtitle="Cambiable desde la barra superior"
      />
    </div>

    <div
      v-if="temaStore.cargando && !temaStore.componentes.length"
      class="bg-white rounded-2xl border border-borde shadow-xs min-h-[20rem] flex items-center justify-center"
    >
      <LoadingState message="Cargando configuración visual..." />
    </div>

    <!-- Layout Maestro-Detalle -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Columna Izquierda: Selector de Componentes -->
      <div class="lg:col-span-4 space-y-4">
        <SectionCard title="Componentes" subtitle="Elige qué elemento deseas configurar">
          <div class="space-y-3">
            <FloatingInput
              v-model="busqueda"
              label="Filtrar componente"
              placeholder="Ej. botones, formularios, sombras..."
            />

            <div class="space-y-2 max-h-[34rem] overflow-y-auto pr-1">
              <button
                v-for="comp in componentesFiltrados"
                :key="comp.clave"
                type="button"
                @click="seleccionarComponente(comp.clave)"
                :class="[
                  'w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer',
                  claveSeleccionada === comp.clave
                    ? 'bg-bosque-50 border-bosque/40 shadow-2xs'
                    : 'bg-white border-borde hover:bg-crema-surface',
                ]"
              >
                <div
                  :class="[
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border',
                    claveSeleccionada === comp.clave
                      ? 'bg-bosque text-white border-bosque'
                      : 'bg-crema-surface text-bosque border-borde',
                  ]"
                >
                  <component :is="ICONOS[comp.icono] || Palette" class="w-4 h-4" />
                </div>

                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-sm font-bold text-verdoso truncate">{{ comp.nombre }}</span>
                    <StatusBadge :variant="comp.personalizado ? 'warning' : 'neutral'" size="sm">
                      {{ comp.personalizado ? 'Personalizado' : 'Defecto' }}
                    </StatusBadge>
                  </div>
                  <p class="text-xs text-verdoso-muted mt-0.5 line-clamp-2">{{ comp.descripcion }}</p>
                </div>
              </button>
            </div>
          </div>
        </SectionCard>
      </div>

      <!-- Columna Derecha: Detalle del Componente + Vista Previa -->
      <div class="lg:col-span-8 space-y-6" v-if="temaStore.componenteActual">
        <SectionCard
          :title="temaStore.componenteActual.nombre"
          :subtitle="temaStore.componenteActual.descripcion"
        >
          <template #actions>
            <PillTabs
              v-model="modoEdicion"
              :tabs="TABS_MODO"
              aria-label="Modo de color a editar"
            />
          </template>

          <div class="space-y-6">
            <!-- Vista previa interactiva -->
            <AparienciaPreview
              :clave-componente="temaStore.componenteActual.clave"
              :modo-edicion="modoEdicion"
              :variables-preview="variablesPreview"
            />

            <!-- Aspectos configurables -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AspectoEditorField
                v-for="asp in aspectosDelModo"
                :key="`${modoEdicion}-${asp.aspecto}`"
                :aspecto="asp"
                v-model="borrador[asp.aspecto]"
                :error="errores[asp.aspecto] || ''"
                @update:model-value="errores[asp.aspecto] = ''"
              />
            </div>

            <!-- Botones de acción centrados según SKILL.md -->
            <div class="flex flex-wrap items-center justify-center gap-3 pt-2 border-t border-borde">
              <button
                type="button"
                class="btn-secundario px-5 py-2.5 text-sm gap-2"
                @click="confirmRestaurarComponente = true"
              >
                <RotateCcw class="w-4 h-4" />
                Restaurar {{ modoEdicion === 'nocturno' ? 'Nocturno' : 'Claro' }}
              </button>

              <button
                type="button"
                class="btn-principal px-6 py-2.5 text-sm gap-2"
                @click="guardarCambios"
              >
                <Save class="w-4 h-4" />
                Guardar cambios
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>

    <!-- Confirmación: restaurar componente -->
    <BaseConfirmModal
      :is-open="confirmRestaurarComponente"
      title="Restaurar valores por defecto"
      :message="`¿Deseas restablecer los colores originales de «${temaStore.componenteActual?.nombre || ''}» para el modo ${modoEdicion}?`"
      confirm-text="Sí, restaurar"
      @confirm="ejecutarRestaurarComponente"
      @close="confirmRestaurarComponente = false"
    />

    <!-- Confirmación: restaurar toda la paleta -->
    <BaseConfirmModal
      :is-open="confirmRestaurarTodo"
      title="Restaurar toda la paleta"
      message="Esta acción devolverá todos los componentes (modo claro y nocturno) a los colores originales de DESIGN.md."
      confirm-text="Sí, restaurar todo"
      @confirm="ejecutarRestaurarTodo"
      @close="confirmRestaurarTodo = false"
    />

    <ActionLoader :is-open="ejecutandoAccion" :message="mensajeLoader" />
  </main>
</template>


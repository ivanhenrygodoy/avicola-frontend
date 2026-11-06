<script setup>
import { computed, ref, watch } from 'vue'
import { AlertTriangle, Loader2 } from 'lucide-vue-next'
import { useAvesStore } from '@/stores/aves'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import { toInputDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de traslado de ave entre corrales con validación de compatibilidad biológica.
 *
 *   <AveTrasladoModal :is-open="show" :ave="ave" @close="show = false" @trasladado="..." />
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ave: { type: Object, default: null },
})

const emit = defineEmits(['close', 'trasladado'])

const avesStore = useAvesStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const form = ref({
  id_casita_destino: '',
  id_division_destino: '',
  motivo: 'Rotación de pastoreo y balance de corral',
  observaciones: '',
  fecha: toInputDate(null, new Date().toISOString().split('T')[0]),
})

const errors = useFormErrors(['id_division_destino'])

const casitasOptions = computed(() => [
  { value: '', label: '-- Seleccionar Casita --' },
  ...(instalacionesStore.casitas || []).map((c) => ({
    value: String(c.id),
    label: `${c.nombre} (${c.tipo || 'General'})`,
  })),
])

const divisionesTrasladoOptions = computed(() => {
  if (!form.value.id_casita_destino) return [{ value: '', label: '-- Selecciona una casita primero --' }]
  const casita = (instalacionesStore.casitas || []).find(
    (c) => String(c.id) === String(form.value.id_casita_destino)
  )
  if (!casita || !casita.divisiones) return [{ value: '', label: '-- Sin divisiones disponibles --' }]
  const activas = casita.divisiones.filter((d) => d.activa)
  return [
    { value: '', label: '-- Seleccionar División --' },
    ...activas.map((d) => ({ value: d.id, label: d.nombre })),
  ]
})

const advertenciaBiologica = computed(() => {
  if (!props.ave || !form.value.id_division_destino) return null

  const targetDivId = Number(form.value.id_division_destino)
  const avesEnDestino = avesStore.aves.filter(
    (a) => a.id_division === targetDivId && a.id !== props.ave.id && a.estado === 'activa'
  )

  if (avesEnDestino.length > 0) {
    const otraAve = avesEnDestino[0]
    if (otraAve.id_especie !== props.ave.id_especie) {
      const especieExistente = otraAve.especie?.nombre || 'otra especie'
      const especieAve = props.ave.especie?.nombre || 'esta especie'
      return `¡Atención! La división destino alberga ${especieExistente}s. Las directrices biológicas prohíben mezclar ${especieAve}s con ${especieExistente}s.`
    }
  }
  return null
})

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const casitaActualId = props.ave?.division?.id_casita || ''
    form.value = {
      id_casita_destino: casitaActualId ? String(casitaActualId) : '',
      id_division_destino: '',
      motivo: 'Rotación de pastoreo y balance de corral',
      observaciones: '',
      fecha: toInputDate(null, new Date().toISOString().split('T')[0]),
    }
  }
)

watch(
  () => form.value.id_casita_destino,
  () => {
    form.value.id_division_destino = ''
    errors.set('id_division_destino', '')
  }
)

const handleSubmit = async () => {
  errors.clear()

  if (!form.value.id_division_destino) {
    errors.set('id_division_destino', 'Debes seleccionar la división de destino')
    return
  }
  if (advertenciaBiologica.value) {
    notify.warning('No se puede trasladar el ave por incompatibilidad biológica.')
    return
  }

  try {
    await run(`Trasladando ave ${props.ave?.codigo}...`, async () => {
      await avesStore.trasladarAve(props.ave.id, {
        id_division_destino: Number(form.value.id_division_destino),
        motivo: form.value.motivo,
        observaciones: form.value.observaciones,
        fecha: form.value.fecha,
      })
    })
    notify.success(`Ave ${props.ave?.codigo} trasladada correctamente.`)
    emit('trasladado')
    emit('close')
  } catch (err) {
    console.error('Error al trasladar ave:', err)
    const msg = err.response?.data?.message || 'Error al ejecutar el traslado.'
    if (err.response?.status === 422) {
      errors.applyServerErrors(err)
      notify.warning(msg)
    } else {
      notify.error(msg)
    }
  }
}
</script>

<template>
  <BaseModal
    :is-open="isOpen && !!ave"
    :title="`Traslado de Ave: ${ave?.codigo} (${ave?.especie?.nombre || 'Ave'})`"
    max-width="md"
    @close="$emit('close')"
  >
    <form id="traslado-form" @submit.prevent="handleSubmit" class="space-y-4" novalidate>
      <!-- Resumen de ubicación actual -->
      <div class="p-3.5 bg-crema/60 border border-borde rounded-xl text-xs space-y-1">
        <p class="font-bold text-verdoso">Ubicación actual:</p>
        <p class="text-salvia">
          {{ ave?.division ? `${ave.division.casita?.nombre} • ${ave.division.nombre}` : 'Sin asignación' }}
        </p>
      </div>

      <!-- Selector Casita Destino -->
      <FormField
        id="traslado-casita"
        v-model="form.id_casita_destino"
        type="select"
        label="Casita Destino"
        required
        :options="casitasOptions"
      />

      <!-- Selector División Destino con validación de error -->
      <FormField
        id="traslado-division"
        v-model="form.id_division_destino"
        type="select"
        label="Corral / División Destino"
        required
        :disabled="!form.id_casita_destino"
        :options="divisionesTrasladoOptions"
        :error="errors.fields.id_division_destino"
        @input="errors.set('id_division_destino', '')"
      />

      <!-- Alerta preventiva si hay conflicto biológico -->
      <div
        v-if="advertenciaBiologica"
        class="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2 animate-fade-in"
      >
        <AlertTriangle class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <span>{{ advertenciaBiologica }}</span>
      </div>

      <!-- Motivo del Traslado -->
      <FormField
        id="traslado-motivo"
        v-model="form.motivo"
        label="Motivo del Traslado"
        placeholder="Ej. Rotación de pastoreo, Aislamiento sanitario..."
      />

      <!-- Observaciones -->
      <FormField
        id="traslado-obs"
        v-model="form.observaciones"
        type="textarea"
        label="Observaciones Adicionales"
        placeholder="Condiciones del ave al momento del traslado..."
        :rows="2"
      />
    </form>

    <template #footer>
      <div class="flex items-center justify-center gap-3 w-full">
        <button
          type="button"
          @click="$emit('close')"
          class="px-6 py-2 btn-secundario text-sm"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleSubmit"
          :disabled="isSubmitting || !!advertenciaBiologica"
          class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>Confirmar Traslado</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>


<script setup>
import { computed, ref, watch } from 'vue'
import { Loader2 } from 'lucide-vue-next'
import { useAvesStore } from '@/stores/aves'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import { toInputDate } from '@/utils/format'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'

/**
 * Modal de alta y edición de un ave en el inventario.
 *
 *   <AveFormModal :is-open="show" :ave="seleccionada" @close="show = false" @saved="..." />
 *
 * `ave`: el registro a editar, o `null` para crear.
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  ave: { type: Object, default: null },
})

const emit = defineEmits(['close', 'saved'])

const avesStore = useAvesStore()
const instalacionesStore = useInstalacionesStore()
const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const isEditing = computed(() => props.ave !== null)

const defaultForm = () => ({
  id: null,
  codigo: '',
  nombre: '',
  id_especie: avesStore.catalogos.especies[0]?.id || '',
  id_sexo: avesStore.catalogos.sexos[0]?.id || '',
  id_proposito: avesStore.catalogos.propositos[0]?.id || '',
  raza: 'Criolla',
  id_division: '',
  fecha_ingreso: toInputDate(null, new Date().toISOString().split('T')[0]),
  fecha_nacimiento: '',
  peso_actual_kg: '',
  observaciones: '',
})

const form = ref(defaultForm())
const errors = useFormErrors(['codigo', 'id_especie', 'id_sexo'])

const formEspecieOptions = computed(() =>
  avesStore.catalogos.especies.map((esp) => ({
    value: esp.id,
    label: esp.nombre,
  }))
)

const formSexoOptions = computed(() =>
  avesStore.catalogos.sexos.map((s) => ({
    value: s.id,
    label: s.nombre,
  }))
)

const formPropositoOptions = computed(() => [
  { value: '', label: '-- Sin propósito definido --' },
  ...avesStore.catalogos.propositos.map((p) => ({ value: p.id, label: p.nombre })),
])

const divisionesDisponibles = computed(() => {
  const list = [{ value: '', label: '-- Sin asignación inicial --' }]
  ;(instalacionesStore.casitas || []).forEach((casita) => {
    if (casita.divisiones && casita.divisiones.length > 0) {
      casita.divisiones.forEach((div) => {
        if (div.activa) {
          list.push({
            value: div.id,
            label: `${casita.nombre} • ${div.nombre}`,
          })
        }
      })
    }
  })
  return list
})

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const a = props.ave
    form.value = a
      ? {
          id: a.id,
          codigo: a.codigo,
          nombre: a.nombre || '',
          id_especie: a.id_especie || a.especie?.id || '',
          id_sexo: a.id_sexo || a.sexo?.id || '',
          id_proposito: a.id_proposito || a.proposito?.id || '',
          raza: a.raza || '',
          id_division: a.id_division || '',
          fecha_ingreso: toInputDate(a.fecha_ingreso, ''),
          fecha_nacimiento: toInputDate(a.fecha_nacimiento, ''),
          peso_actual_kg: a.peso_actual_kg ?? '',
          observaciones: a.observaciones || '',
        }
      : defaultForm()
  }
)

const handleSubmit = async () => {
  errors.clear()
  let hasError = false

  if (!form.value.codigo || !String(form.value.codigo).trim()) {
    errors.set('codigo', 'El código identificador del ave es obligatorio')
    hasError = true
  }
  if (!form.value.id_especie) {
    errors.set('id_especie', 'La especie es obligatoria')
    hasError = true
  }
  if (!form.value.id_sexo) {
    errors.set('id_sexo', 'El sexo es obligatorio')
    hasError = true
  }

  if (hasError) return

  const payload = {
    ...form.value,
    codigo: String(form.value.codigo).trim(),
    nombre: form.value.nombre?.trim() || null,
    id_especie: Number(form.value.id_especie),
    id_sexo: Number(form.value.id_sexo),
    id_proposito: form.value.id_proposito ? Number(form.value.id_proposito) : null,
    id_division: form.value.id_division ? Number(form.value.id_division) : null,
    peso_actual_kg: form.value.peso_actual_kg !== '' && form.value.peso_actual_kg !== null ? Number(form.value.peso_actual_kg) : null,
    fecha_ingreso: form.value.fecha_ingreso || null,
    fecha_nacimiento: form.value.fecha_nacimiento || null,
  }

  try {
    await run(
      isEditing.value ? `Guardando cambios de ${form.value.codigo}...` : `Registrando ave ${form.value.codigo}...`,
      async () => {
        if (isEditing.value) {
          await avesStore.updateAve(form.value.id, payload)
          notify.success('Ave actualizada exitosamente.')
        } else {
          await avesStore.addAve(payload)
          notify.success('Ave registrada exitosamente.')
        }
      }
    )
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('Error al guardar ave:', err)
    const msg = err.response?.data?.message || 'Error al procesar la información del ave.'
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
    :is-open="isOpen"
    :title="isEditing ? `Editar Ave: ${form.codigo}` : 'Registrar Nueva Ave'"
    max-width="lg"
    @close="$emit('close')"
  >
    <form id="ave-form" @submit.prevent="handleSubmit" class="space-y-4" novalidate>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Código Identificador -->
        <FormField
          id="ave-codigo"
          v-model="form.codigo"
          label="Código Identificador"
          placeholder="Ej. AVE-015"
          required
          :error="errors.fields.codigo"
          @input="errors.set('codigo', '')"
        />

        <!-- Sobrenombre -->
        <FormField
          id="ave-nombre"
          v-model="form.nombre"
          label="Sobrenombre"
          placeholder="Ej. Canela, Pardo"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Especie (Catálogo ctl_especie) -->
        <FormField
          id="ave-especie"
          v-model="form.id_especie"
          type="select"
          label="Especie"
          required
          :options="formEspecieOptions"
          :error="errors.fields.id_especie"
          @input="errors.set('id_especie', '')"
        />

        <!-- Sexo (Catálogo ctl_sexo) -->
        <FormField
          id="ave-sexo"
          v-model="form.id_sexo"
          type="select"
          label="Sexo"
          required
          :options="formSexoOptions"
          :error="errors.fields.id_sexo"
          @input="errors.set('id_sexo', '')"
        />

        <!-- Raza -->
        <FormField
          id="ave-raza"
          v-model="form.raza"
          label="Raza"
          placeholder="Ej. Criolla"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Propósito (Catálogo ctl_proposito) -->
        <FormField
          id="ave-proposito"
          v-model="form.id_proposito"
          type="select"
          label="Propósito"
          :options="formPropositoOptions"
        />

        <!-- Corral / División Inicial -->
        <FormField
          id="ave-division"
          v-model="form.id_division"
          type="select"
          label="Ubicación Inicial (Corral)"
          :options="divisionesDisponibles"
        />
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <!-- Fecha de Ingreso -->
        <FormField
          id="ave-fecha-ingreso"
          v-model="form.fecha_ingreso"
          type="date"
          label="Fecha de Ingreso"
        />

        <!-- Peso Actual en KG -->
        <FormField
          id="ave-peso"
          v-model="form.peso_actual_kg"
          type="number"
          step="0.01"
          label="Peso Actual (kg)"
          placeholder="Ej. 2.15"
        />
      </div>

      <!-- Observaciones -->
      <FormField
        id="ave-observaciones"
        v-model="form.observaciones"
        type="textarea"
        label="Observaciones y Señales Físicas"
        placeholder="Color del plumaje, docilidad, señas particulares..."
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
          :disabled="isSubmitting"
          class="px-6 py-2 btn-principal text-sm shadow-xs flex items-center gap-1.5"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          <span>{{ isEditing ? 'Guardar Cambios' : 'Registrar Ave' }}</span>
        </button>
      </div>
    </template>
  </BaseModal>
</template>


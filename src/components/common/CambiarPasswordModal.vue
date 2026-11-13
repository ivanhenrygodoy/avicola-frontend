<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'
import { Loader2 } from 'lucide-vue-next'

/**
 * Formulario para cambiar la contraseña propia. Al terminar bien, el servidor revoca todas
 * las sesiones (incluida esta), así que se cierra la sesión local y se vuelve al login.
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const router = useRouter()
const authStore = useAuthStore()
const notify = useNotificationStore()

const form = ref({ password_actual: '', password: '', password_confirmation: '' })
const errors = useFormErrors(['password_actual', 'password', 'password_confirmation'])
const guardando = ref(false)

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    form.value = { password_actual: '', password: '', password_confirmation: '' }
    errors.clear()
  },
)

const validar = () => {
  errors.clear()
  if (!form.value.password_actual) errors.set('password_actual', 'Escribe tu contraseña actual')
  if (!form.value.password) errors.set('password', 'Escribe la nueva contraseña')
  else if (form.value.password.length < 8) errors.set('password', 'Debe tener al menos 8 caracteres')
  else if (form.value.password === form.value.password_actual) {
    errors.set('password', 'Debe ser distinta de la actual')
  }
  if (form.value.password && form.value.password !== form.value.password_confirmation) {
    errors.set('password_confirmation', 'La confirmación no coincide')
  }
  return !errors.has()
}

const submit = async () => {
  if (!validar() || guardando.value) return

  guardando.value = true
  const resultado = await authStore.cambiarPassword(form.value)
  guardando.value = false

  if (resultado.success) {
    emit('close')
    notify.success('Contraseña actualizada. Inicia sesión de nuevo con tu nueva contraseña.')
    router.push({ name: 'login' })
    return
  }

  // El 422 del servidor se reparte en los campos; un error de otro tipo se avisa aparte
  const e = resultado.errors || {}
  if (e.password_actual?.[0]) errors.set('password_actual', e.password_actual[0])
  if (e.password?.[0]) errors.set('password', e.password[0])
  if (!errors.has()) notify.error(resultado.error)
}
</script>

<template>
  <BaseModal :is-open="isOpen" title="Cambiar contraseña" max-width="md" :closable="!guardando" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="submit">
      <p class="text-sm text-verdoso-muted">
        Al cambiarla se cerrarán todas tus sesiones y tendrás que iniciar sesión de nuevo.
      </p>

      <FormField
        id="cambiar-password-actual"
        v-model="form.password_actual"
        type="password"
        label="Contraseña actual"
        required
        :error="errors.fields.password_actual"
        :disabled="guardando"
        @input="errors.set('password_actual', '')"
      />

      <FormField
        id="cambiar-password-nueva"
        v-model="form.password"
        type="password"
        label="Nueva contraseña"
        placeholder="Mínimo 8 caracteres"
        required
        :error="errors.fields.password"
        :disabled="guardando"
        @input="errors.set('password', '')"
      />

      <FormField
        id="cambiar-password-confirmacion"
        v-model="form.password_confirmation"
        type="password"
        label="Confirmar nueva contraseña"
        required
        :error="errors.fields.password_confirmation"
        :disabled="guardando"
        @input="errors.set('password_confirmation', '')"
      />

      <div class="pt-4 flex items-center justify-end gap-3 border-t border-borde">
        <button
          type="button"
          class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
          :disabled="guardando"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-6 py-2.5 btn-principal text-sm shadow-xs cursor-pointer flex items-center gap-1.5"
          :disabled="guardando"
        >
          <Loader2 v-if="guardando" class="w-4 h-4 animate-spin" />
          <span>{{ guardando ? 'Guardando...' : 'Cambiar contraseña' }}</span>
        </button>
      </div>
    </form>
  </BaseModal>
</template>

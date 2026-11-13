<script setup>
import { computed, ref, watch } from 'vue'
import { crearUsuario } from '@/services/usuarios'
import { useNotificationStore } from '@/stores/notification'
import { useFormErrors } from '@/composables/useFormErrors'
import { useActionLoader } from '@/composables/useActionLoader'
import BaseModal from '@/components/common/BaseModal.vue'
import FormField from '@/components/common/FormField.vue'
import { Mail } from 'lucide-vue-next'

/**
 * Modal de alta de usuario (solo superAdmin): nombre, correo y rol. El servidor genera la
 * contraseña temporal y la envía por correo desde una cola; aquí nunca se ve ni se escribe.
 *
 *   <UsuarioFormModal :is-open="show" :roles="roles" @close="show = false" @saved="recargar" />
 */
const props = defineProps({
  isOpen: { type: Boolean, default: false },
  roles: { type: Array, default: () => [] },
})

const emit = defineEmits(['close', 'saved'])

const notify = useNotificationStore()
const { isSubmitting, run } = useActionLoader()

const defaultForm = () => ({ name: '', email: '', id_rol: '' })
const form = ref(defaultForm())
const errors = useFormErrors(['name', 'email', 'id_rol'])

// El rol por defecto es el operario (lo normal), pero el selector lista los roles existentes
const rolOptions = computed(() => [
  { value: '', label: 'Seleccionar rol...' },
  ...props.roles.map((r) => ({ value: r.id, label: r.nombre })),
])

watch(
  () => props.isOpen,
  (abierto) => {
    if (!abierto) return
    errors.clear()
    const operario = props.roles.find((r) => r.clave === 'operario')
    form.value = { ...defaultForm(), id_rol: operario ? operario.id : '' }
  },
)

const validar = () => {
  errors.clear()
  if (!form.value.name?.trim()) errors.set('name', 'El nombre es obligatorio')
  if (!form.value.email?.trim()) errors.set('email', 'El correo es obligatorio')
  else if (!/^\S+@\S+\.\S+$/.test(form.value.email.trim())) errors.set('email', 'Escribe un correo válido')
  if (!form.value.id_rol) errors.set('id_rol', 'Selecciona un rol')
  return !errors.has()
}

const submit = async () => {
  if (!validar()) return

  const payload = {
    name: form.value.name.trim(),
    email: form.value.email.trim(),
    id_rol: Number(form.value.id_rol),
  }

  try {
    await run('Creando usuario...', () => crearUsuario(payload))
    notify.success('Usuario creado. Se enviará un correo con las credenciales.')
    emit('saved')
    emit('close')
  } catch (err) {
    console.error('Error creando usuario:', err)
    if (!errors.applyServerErrors(err)) {
      notify.error(err.response?.data?.message || 'No se pudo crear el usuario.')
    }
  }
}
</script>

<template>
  <BaseModal :is-open="isOpen" title="Crear usuario" max-width="md" @close="emit('close')">
    <form class="space-y-4" @submit.prevent="submit">
      <FormField
        id="usuario-nombre"
        v-model="form.name"
        label="Nombre completo"
        placeholder="Ej. Rosa Pérez"
        required
        :error="errors.fields.name"
        :disabled="isSubmitting"
        @input="errors.set('name', '')"
      />

      <FormField
        id="usuario-correo"
        v-model="form.email"
        type="email"
        label="Correo electrónico"
        placeholder="persona@correo.com"
        required
        :error="errors.fields.email"
        :disabled="isSubmitting"
        @input="errors.set('email', '')"
      />

      <FormField
        id="usuario-rol"
        v-model="form.id_rol"
        type="select"
        label="Rol"
        required
        :options="rolOptions"
        :error="errors.fields.id_rol"
        :disabled="isSubmitting"
        @input="errors.set('id_rol', '')"
      />

      <p class="flex items-start gap-2 text-xs text-verdoso-muted bg-crema rounded-xl px-3.5 py-3 border border-borde">
        <Mail class="w-4 h-4 text-salvia shrink-0 mt-0.5" />
        <span>
          El sistema genera una contraseña temporal y la envía a ese correo. Al ingresar por primera vez
          la persona podrá cambiarla o quedarse con ella.
        </span>
      </p>

      <div class="pt-4 flex items-center justify-end gap-3 border-t border-borde">
        <button
          type="button"
          class="px-5 py-2.5 btn-secundario text-sm cursor-pointer"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          Cancelar
        </button>
        <button
          type="submit"
          class="px-6 py-2.5 btn-principal text-sm shadow-xs cursor-pointer flex items-center gap-1.5"
          :disabled="isSubmitting"
        >
          <span>Crear usuario</span>
        </button>
      </div>
    </form>
  </BaseModal>
</template>

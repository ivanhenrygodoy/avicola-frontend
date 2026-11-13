<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { listarUsuarios, actualizarUsuario, reenviarCredenciales } from '@/services/usuarios'
import { obtenerMatriz } from '@/services/permisos'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import { provideActionLoader } from '@/composables/useActionLoader'
import { useConfirmAction } from '@/composables/useConfirmAction'

// Componentes comunes globales
import PageHeader from '@/components/common/PageHeader.vue'
import DataTable from '@/components/common/DataTable.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import RowActionButton from '@/components/common/RowActionButton.vue'
import BaseConfirmModal from '@/components/common/BaseConfirmModal.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'
import UsuarioFormModal from '@/components/usuarios/UsuarioFormModal.vue'

import { UserPlus, Send, UserX, UserCheck } from 'lucide-vue-next'

const authStore = useAuthStore()
const notify = useNotificationStore()
const loader = provideActionLoader()
const { isSubmitting, message: actionLoaderMessage, run } = loader

const usuarios = ref([])
const roles = ref([])
const loading = ref(true)
const showFormModal = ref(false)

const columnas = [
  { key: 'name', label: 'Usuario' },
  { key: 'rol', label: 'Rol', nowrap: true },
  { key: 'activo', label: 'Estado', nowrap: true },
  { key: 'credenciales', label: 'Credenciales', nowrap: true },
  { key: 'acciones', label: 'Acciones', align: 'right', nowrap: true },
]

const CREDENCIALES = {
  pendiente: { variant: 'warning', texto: 'Enviando…' },
  enviado: { variant: 'success', texto: 'Enviadas' },
  fallido: { variant: 'danger', texto: 'Falló el envío' },
}

// Un usuario es el único superAdmin activo si no hay otro: sus acciones se bloquean con la razón
const superAdminsActivos = computed(
  () => usuarios.value.filter((u) => u.activo && u.rol?.clave === 'super_admin').length,
)

const esUno = (u) => u.id === authStore.user?.id
const esUltimoSuper = (u) => u.activo && u.rol?.clave === 'super_admin' && superAdminsActivos.value <= 1

// Razón por la que no se puede (des)activar: se muestra en el title del botón deshabilitado
const razonBloqueoEstado = (u) => {
  if (esUno(u)) return 'No puedes desactivar tu propia cuenta'
  if (esUltimoSuper(u)) return 'Debe quedar al menos un super administrador activo'
  return ''
}
const razonBloqueoReenvio = (u) => {
  if (esUno(u)) return 'Para cambiar tu contraseña usa tu cuenta, no el reenvío'
  if (!u.activo) return 'La cuenta está desactivada'
  return ''
}

const cargar = async () => {
  try {
    usuarios.value = await listarUsuarios()
  } catch (err) {
    console.error(err)
    notify.error('No se pudo cargar la lista de usuarios.')
  } finally {
    loading.value = false
  }
}

const cargarRoles = async () => {
  try {
    roles.value = (await obtenerMatriz()).roles
  } catch (err) {
    console.error(err)
    notify.error('No se pudo cargar la lista de roles.')
  }
}

// El correo sale por una cola: mientras haya envíos pendientes se vuelve a consultar cada pocos segundos
let temporizador = null
const hayPendientes = computed(() => usuarios.value.some((u) => u.credenciales_estado === 'pendiente'))
const programarRefresco = () => {
  detenerRefresco()
  temporizador = setInterval(async () => {
    if (!hayPendientes.value) return detenerRefresco()
    await cargar()
  }, 4000)
}
const detenerRefresco = () => {
  if (temporizador) clearInterval(temporizador)
  temporizador = null
}

const recargarTrasCambio = async () => {
  await cargar()
  if (hayPendientes.value) programarRefresco()
}

const reenviar = async (usuario) => {
  try {
    await run(`Reenviando credenciales a ${usuario.name}...`, () => reenviarCredenciales(usuario.id))
    notify.success('Se enviarán nuevas credenciales por correo.')
    await recargarTrasCambio()
  } catch (err) {
    console.error(err)
    const msg = err.response?.data?.errors?.usuario?.[0] || err.response?.data?.message
    if (err.response?.status === 422) notify.warning(msg)
    else notify.error(msg || 'No se pudieron reenviar las credenciales.')
  }
}

// Activar o desactivar con confirmación (mismo flujo que el resto de módulos)
const cambiarEstado = useConfirmAction({
  loader,
  accion: (u) => actualizarUsuario(u.id, { activo: !u.activo }),
  mensajeCarga: (u) => (u.activo ? `Desactivando a ${u.name}...` : `Activando a ${u.name}...`),
  mensajeExito: (u) => (u.activo ? 'Usuario desactivado. Se cerraron sus sesiones.' : 'Usuario activado.'),
  mensajeError: 'No se pudo cambiar el estado del usuario.',
})

const confirmarCambioEstado = async () => {
  await cambiarEstado.confirm()
  await cargar()
}

onMounted(async () => {
  await Promise.all([cargar(), cargarRoles()])
  if (hayPendientes.value) programarRefresco()
})
onBeforeUnmount(detenerRefresco)
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- pb-28: deja libre el botón flotante del chat para que no tape las acciones de la última fila -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 space-y-6">
      <PageHeader
        title="Gestión de usuarios"
        subtitle="Crea cuentas, asigna su rol y controla quién puede ingresar al sistema."
        bordered
      >
        <template #actions>
          <button
            type="button"
            class="px-5 py-2.5 btn-principal text-sm shadow-xs cursor-pointer inline-flex items-center gap-2"
            @click="showFormModal = true"
          >
            <UserPlus class="w-4 h-4" />
            <span>Crear usuario</span>
          </button>
        </template>
      </PageHeader>

      <DataTable
        :columns="columnas"
        :rows="usuarios"
        :loading="loading"
        item-label="usuarios"
        empty-title="Aún no hay usuarios"
        empty-description="Crea el primer usuario para repartir responsabilidades."
      >
        <template #cell-name="{ row }">
          <div class="font-semibold text-verdoso">
            {{ row.name }}
            <span v-if="esUno(row)" class="ml-1 text-xs font-medium text-salvia">(tú)</span>
          </div>
          <div class="text-xs text-verdoso-muted">{{ row.email }}</div>
        </template>

        <template #cell-rol="{ row }">
          <StatusBadge :variant="row.rol?.clave === 'super_admin' ? 'info' : 'neutral'">
            {{ row.rol?.nombre || 'Sin rol' }}
          </StatusBadge>
        </template>

        <template #cell-activo="{ row }">
          <StatusBadge :variant="row.activo ? 'success' : 'danger'">
            {{ row.activo ? 'Activo' : 'Inactivo' }}
          </StatusBadge>
        </template>

        <template #cell-credenciales="{ row }">
          <StatusBadge
            v-if="CREDENCIALES[row.credenciales_estado]"
            :variant="CREDENCIALES[row.credenciales_estado].variant"
            :title="row.credenciales_error || undefined"
          >
            {{ CREDENCIALES[row.credenciales_estado].texto }}
          </StatusBadge>
          <span v-else class="text-verdoso-muted">—</span>
          <div v-if="row.credenciales_error" class="text-xs text-verdoso-muted mt-1 max-w-[16rem] whitespace-normal">
            {{ row.credenciales_error }}
          </div>
        </template>

        <template #cell-acciones="{ row }">
          <div class="inline-flex items-center gap-1">
            <RowActionButton
              :icon="Send"
              tone="neutral"
              :title="razonBloqueoReenvio(row) || 'Reenviar credenciales'"
              :disabled="!!razonBloqueoReenvio(row)"
              @click="reenviar(row)"
            />
            <RowActionButton
              :icon="row.activo ? UserX : UserCheck"
              :tone="row.activo ? 'danger' : 'success'"
              :title="razonBloqueoEstado(row) || (row.activo ? 'Desactivar usuario' : 'Activar usuario')"
              :disabled="!!razonBloqueoEstado(row)"
              @click="cambiarEstado.request(row)"
            />
          </div>
        </template>
      </DataTable>
    </main>

    <UsuarioFormModal
      :is-open="showFormModal"
      :roles="roles"
      @close="showFormModal = false"
      @saved="recargarTrasCambio"
    />

    <BaseConfirmModal
      :is-open="cambiarEstado.isOpen.value"
      :title="cambiarEstado.target.value?.activo ? 'Desactivar usuario' : 'Activar usuario'"
      :message="
        cambiarEstado.target.value?.activo
          ? `¿Desactivar a ${cambiarEstado.target.value?.name}? No podrá iniciar sesión y se cerrarán sus sesiones abiertas.`
          : `¿Activar a ${cambiarEstado.target.value?.name}? Podrá volver a iniciar sesión.`
      "
      :confirm-text="cambiarEstado.target.value?.activo ? 'Sí, desactivar' : 'Sí, activar'"
      cancel-text="Cancelar"
      :is-destructive="!!cambiarEstado.target.value?.activo"
      :is-loading="cambiarEstado.loading.value"
      @confirm="confirmarCambioEstado"
      @cancel="cambiarEstado.cancel"
    />

    <ActionLoader :is-open="isSubmitting" :message="actionLoaderMessage" />
  </div>
</template>

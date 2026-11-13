<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notification'
import BaseModal from '@/components/common/BaseModal.vue'
import CambiarPasswordModal from '@/components/common/CambiarPasswordModal.vue'
import { KeyRound, ShieldCheck } from 'lucide-vue-next'

/**
 * Aviso de primer ingreso (R11, R18): se muestra cuando el usuario entró con una contraseña
 * temporal. Es suave, no bloqueante: se cierra con Escape o fuera del modal sin elegir y
 * reaparece en el siguiente inicio de sesión. Solo «Cambiar» o «Mantener» lo apagan para siempre.
 */
const authStore = useAuthStore()
const notify = useNotificationStore()

// Cerrado sin elegir: vale solo para esta carga de la página (al volver a entrar reaparece)
const descartado = ref(false)
const mostrandoCambio = ref(false)
const guardando = ref(false)

const visible = computed(
  () => authStore.isAuthenticated && authStore.debeCambiarPassword && !descartado.value && !mostrandoCambio.value,
)

const descartar = () => {
  descartado.value = true
}

const abrirCambio = () => {
  mostrandoCambio.value = true
}

const mantener = async () => {
  if (guardando.value) return
  guardando.value = true
  const resultado = await authStore.mantenerPassword()
  guardando.value = false
  if (resultado.success) notify.success('Conservarás tu contraseña actual.')
  else notify.error('No se pudo guardar tu elección. Inténtalo de nuevo.')
}

// BaseModal no escucha Escape; se maneja aquí sin tocar el componente global
const alPulsarTecla = (evento) => {
  if (evento.key === 'Escape' && visible.value) descartar()
}
onMounted(() => window.addEventListener('keydown', alPulsarTecla))
onBeforeUnmount(() => window.removeEventListener('keydown', alPulsarTecla))
</script>

<template>
  <BaseModal :is-open="visible" title="Tu contraseña es temporal" max-width="md" @close="descartar">
    <div class="space-y-5">
      <p class="text-sm text-verdoso-muted leading-relaxed">
        Entraste con la contraseña que te enviaron por correo. Puedes cambiarla ahora por una propia o
        quedarte con esta; tú decides.
      </p>

      <div class="grid gap-3">
        <button
          type="button"
          class="w-full text-left p-4 rounded-2xl border border-bosque/20 bg-bosque-50 hover:bg-bosque-100 transition-colors cursor-pointer flex items-start gap-3"
          @click="abrirCambio"
        >
          <KeyRound class="w-5 h-5 text-bosque mt-0.5 shrink-0" />
          <span>
            <span class="block text-sm font-bold text-bosque">Cambiar contraseña</span>
            <span class="block text-xs text-verdoso-muted mt-0.5">
              Elige una nueva. Se cerrarán tus sesiones y volverás a iniciar sesión.
            </span>
          </span>
        </button>

        <button
          type="button"
          class="w-full text-left p-4 rounded-2xl border border-borde bg-white hover:bg-crema/70 transition-colors cursor-pointer flex items-start gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="guardando"
          @click="mantener"
        >
          <ShieldCheck class="w-5 h-5 text-salvia mt-0.5 shrink-0" />
          <span>
            <span class="block text-sm font-bold text-verdoso">Mantener esta contraseña</span>
            <span class="block text-xs text-verdoso-muted mt-0.5">
              Seguirás usando la temporal y no volveremos a preguntarte.
            </span>
          </span>
        </button>
      </div>

      <p class="text-xs text-verdoso-muted">
        Si cierras este aviso sin elegir, volverá a aparecer la próxima vez que inicies sesión.
      </p>
    </div>
  </BaseModal>

  <CambiarPasswordModal :is-open="mostrandoCambio" @close="mostrandoCambio = false" />
</template>

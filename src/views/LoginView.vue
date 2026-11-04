<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FormField from '@/components/common/FormField.vue'
import { ShieldCheck, LogIn, Lock, Mail, AlertCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const localError = ref('')
const errors = ref({
  email: '',
  password: '',
})

const handleLogin = async () => {
  localError.value = ''
  errors.value = { email: '', password: '' }

  let hasError = false
  if (!email.value || !email.value.trim()) {
    errors.value.email = 'El correo electrónico es obligatorio'
    hasError = true
  }
  if (!password.value || !password.value.trim()) {
    errors.value.password = 'La contraseña es obligatoria'
    hasError = true
  }

  if (hasError) {
    return
  }

  const result = await authStore.login(email.value.trim(), password.value)
  if (result.success) {
    router.push({ name: 'dashboard' })
  } else {
    localError.value = result.error
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-crema px-4 sm:px-6 lg:px-8 text-verdoso">
    <div class="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-sm border border-borde">
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bosque-50 text-bosque mb-4 shadow-2xs">
          <ShieldCheck class="w-8 h-8 text-bosque" />
        </div>
        <h2 class="text-2xl font-extrabold tracking-tight text-verdoso">
          Granja Avícola Inteligente
        </h2>
        <p class="mt-2 text-sm text-verdoso-muted">
          Inicia sesión para acceder al panel de control
        </p>
      </div>

      <!-- Alerta de Error de Autenticación -->
      <div v-if="localError || authStore.error" class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fade-in">
        <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
        <span>{{ localError || authStore.error }}</span>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleLogin" novalidate>
        <div class="space-y-4">
          <!-- Campo Correo Electrónico con validación -->
          <FormField
            id="email"
            v-model="email"
            label="Correo Electrónico"
            type="email"
            placeholder="admin@granja.local"
            :error="errors.email"
            @input="errors.email = ''"
          >
            <template #prefix>
              <Mail class="w-5 h-5" />
            </template>
          </FormField>

          <!-- Campo Contraseña con validación -->
          <FormField
            id="password"
            v-model="password"
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            :error="errors.password"
            @input="errors.password = ''"
          >
            <template #prefix>
              <Lock class="w-5 h-5" />
            </template>
          </FormField>
        </div>

        <div>
          <button
            type="submit"
            :disabled="authStore.loading"
            class="group relative w-full flex justify-center py-2.5 px-4 btn-principal rounded-xl text-sm shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="authStore.loading" class="flex items-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" /> Verificando...
            </span>
            <span v-else class="flex items-center gap-2">
              <LogIn class="w-4 h-4" /> Ingresar al Sistema
            </span>
          </button>
        </div>
      </form>

      <div class="pt-4 border-t border-borde text-center">
        <p class="text-xs text-verdoso-muted">
          Módulo de Seguridad • Autenticación Criptográfica Sanctum
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import FormField from '@/components/common/FormField.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import loginBg from '@/assets/images/login.png'
import {
  LogIn,
  Lock,
  Mail,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
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
  <div class="min-h-screen relative flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-bosque text-verdoso select-none">
    <!-- Fondo Fotográfico de la Granja sin desenfoque -->
    <div
      class="absolute inset-0 bg-cover bg-center bg-no-repeat"
      :style="{ backgroundImage: `url(${loginBg})` }"
      aria-hidden="true"
    >
      <!-- Overlay degradado sutil para asegurar contraste sin perder la nitidez de la foto -->
      <div class="absolute inset-0 bg-gradient-to-t from-bosque/85 via-bosque/40 to-black/20" />
    </div>

    <!-- Tarjeta de Inicio de Sesión Central Elevada -->
    <div class="relative z-10 max-w-md w-full bg-white p-8 sm:p-10 rounded-3xl shadow-2xl border border-borde/60 text-verdoso modal-content-animated my-8">
      <!-- Encabezado con Imagotipo Oficial -->
      <div class="text-center">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-bosque text-white mb-4 shadow-lg shadow-bosque/25 transform transition-transform hover:scale-105 duration-200">
          <GallinaIcon class="w-9 h-9 text-white" />
        </div>
        <h1 class="text-2xl font-extrabold tracking-tight text-verdoso">
          Granja Avícola Inteligente
        </h1>
        <p class="mt-2 text-sm text-verdoso-muted font-medium">
          Plataforma de gestión integral y control bioseguro
        </p>
      </div>

      <!-- Alerta de Error de Autenticación -->
      <div
        v-if="localError || authStore.error"
        class="mt-6 p-4 rounded-xl bg-red-50/90 border border-red-200 text-red-700 text-sm flex items-start gap-3 animate-fade-in"
      >
        <AlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
        <span class="font-medium">{{ localError || authStore.error }}</span>
      </div>

      <!-- Formulario de Acceso -->
      <form class="mt-6 space-y-5" @submit.prevent="handleLogin" novalidate>
        <div class="space-y-4">
          <!-- Campo Correo Electrónico -->
          <FormField
            id="email"
            v-model="email"
            label="Correo Electrónico"
            type="email"
            placeholder="admin@granja.local"
            :error="errors.email"
            required
            @input="errors.email = ''"
          >
            <template #prefix>
              <Mail class="w-5 h-5 text-salvia" />
            </template>
          </FormField>

          <!-- Campo Contraseña con Toggle Mostrar/Ocultar -->
          <FormField
            id="password"
            v-model="password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            placeholder="••••••••"
            :error="errors.password"
            required
            @input="errors.password = ''"
          >
            <template #prefix>
              <Lock class="w-5 h-5 text-salvia" />
            </template>
            <template #suffix>
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="p-1 rounded-md text-salvia hover:text-bosque hover:bg-salvia-50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-salvia cursor-pointer"
                :title="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
                :aria-label="showPassword ? 'Ocultar contraseña' : 'Ver contraseña'"
              >
                <EyeOff v-if="showPassword" class="w-4 h-4" />
                <Eye v-else class="w-4 h-4" />
              </button>
            </template>
          </FormField>
        </div>

        <!-- Botón de Envío Corporativo (Pill) -->
        <div class="pt-2">
          <button
            type="submit"
            :disabled="authStore.loading"
            class="w-full py-3 px-6 btn-principal rounded-full text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span v-if="authStore.loading" class="flex items-center gap-2">
              <Loader2 class="w-4 h-4 animate-spin" />
              <span>Verificando credenciales...</span>
            </span>
            <span v-else class="flex items-center gap-2">
              <LogIn class="w-4 h-4" />
              <span>Ingresar al Sistema</span>
            </span>
          </button>
        </div>
      </form>

      <!-- Pie de Seguridad Institucional -->
      <div class="mt-8 pt-4 border-t border-borde/70 text-center">
        <p class="text-xs text-verdoso-muted font-medium">
          Acceso exclusivo para personal autorizado • Granja Inteligente v1.0
        </p>
      </div>
    </div>
  </div>
</template>

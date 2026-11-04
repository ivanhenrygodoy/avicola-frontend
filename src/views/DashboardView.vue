<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import {
  LogOut,
  User,
  CheckCircle2,
  ShieldCheck,
  Home,
  LayoutDashboard,
  ArrowRight,
  Layers,
  Building,
} from 'lucide-vue-next'

const router = useRouter()
const authStore = useAuthStore()

onMounted(async () => {
  if (!authStore.user) {
    await authStore.fetchCurrentUser()
  }
})

const handleLogout = async () => {
  await authStore.logout()
  router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior -->
    <header class="bg-white border-b border-borde sticky top-0 z-30 shadow-xs">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-bosque text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🐔
            </div>
            <div>
              <h1 class="text-base font-bold text-verdoso leading-tight">
                Granja Avícola Inteligente
              </h1>
              <span class="text-xs text-salvia font-semibold">Panel de Control</span>
            </div>
          </div>

          <nav class="hidden md:flex items-center gap-1">
            <router-link
              to="/"
              class="px-3 py-2 text-sm font-semibold rounded-lg text-bosque bg-bosque-50 flex items-center gap-1.5 transition-colors"
            >
              <LayoutDashboard class="w-4 h-4 text-bosque" /> Dashboard
            </router-link>
            <router-link
              to="/instalaciones"
              class="px-3 py-2 text-sm font-medium rounded-lg text-verdoso-muted hover:text-verdoso hover:bg-crema flex items-center gap-1.5 transition-colors"
            >
              <Home class="w-4 h-4 text-salvia" /> Instalaciones
            </router-link>
            <router-link
              to="/aves"
              class="px-3 py-2 text-sm font-medium rounded-lg text-verdoso-muted hover:text-verdoso hover:bg-crema flex items-center gap-1.5 transition-colors"
            >
              <Layers class="w-4 h-4 text-salvia" /> Inventario de Aves
            </router-link>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <div class="hidden sm:flex items-center gap-2 text-sm text-verdoso bg-crema px-3 py-1.5 rounded-full border border-borde">
            <User class="w-4 h-4 text-salvia" />
            <span class="font-medium">{{ authStore.user?.name || 'Administrador' }}</span>
          </div>

          <button
            @click="handleLogout"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión"
          >
            <LogOut class="w-4 h-4" />
            <span class="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Tarjeta de Bienvenida & Estado del Sistema -->
      <div class="bg-white rounded-2xl border border-borde p-6 sm:p-8 shadow-xs space-y-6">
        <div class="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#DDF3E3] text-bosque mb-2">
              <CheckCircle2 class="w-4 h-4" /> Etapas 1 y 2 Operativas
            </div>
            <h2 class="text-2xl font-extrabold text-verdoso">
              Bienvenido, {{ authStore.user?.name || 'Administrador' }}
            </h2>
            <p class="text-sm text-verdoso-muted mt-1">
              Sesión activa y módulo de instalaciones físicas configurado.
            </p>
          </div>

          <div class="flex items-center gap-2 bg-bosque-50 border border-salvia/30 text-bosque px-4 py-2 rounded-xl text-sm font-semibold">
            <ShieldCheck class="w-5 h-5 text-bosque" />
            <span>PostgreSQL 16 Conectado</span>
          </div>
        </div>

        <!-- Módulos Disponibles -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-borde">
          <router-link
            to="/instalaciones"
            class="group p-5 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs bg-white transition-all flex items-start justify-between"
          >
            <div class="space-y-2">
              <div class="w-10 h-10 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center">
                <Building class="w-5 h-5 text-bosque" />
              </div>
              <h3 class="text-lg font-bold text-verdoso group-hover:text-bosque transition-colors">
                Instalaciones Físicas
              </h3>
              <p class="text-xs text-verdoso-muted leading-relaxed">
                Gestión de las 3 casitas y 5 divisiones independientes (corrales de gallinas, chompipes y patos pichiches).
              </p>
            </div>
            <ArrowRight class="w-5 h-5 text-salvia group-hover:text-bosque group-hover:translate-x-1 transition-all" />
          </router-link>

          <div class="p-5 rounded-2xl border border-dashed border-borde bg-crema/40 flex items-start justify-between">
            <div class="space-y-2">
              <div class="w-10 h-10 rounded-xl bg-huevo-suave text-huevo-600 flex items-center justify-center">
                <Layers class="w-5 h-5 text-huevo" />
              </div>
              <h3 class="text-lg font-bold text-verdoso">
                Inventario de Aves (Etapa 3)
              </h3>
              <p class="text-xs text-verdoso-muted leading-relaxed">
                Próximo hito: Registro de las 14 aves con código, sobrenombres y traslados con validación biológica de especies.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useAvesStore } from '@/stores/aves'
import AppHeader from '@/components/common/AppHeader.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import StatCard from '@/components/common/StatCard.vue'
import {
  Building,
  ArrowRight,
  Calendar,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const instalacionesStore = useInstalacionesStore()
const avesStore = useAvesStore()

const loadingStats = ref(true)

onMounted(async () => {
  loadingStats.value = true
  try {
    const promises = []
    if (!authStore.user) {
      promises.push(authStore.fetchCurrentUser())
    }
    promises.push(instalacionesStore.fetchCasitas())
    promises.push(avesStore.fetchAves())
    await Promise.allSettled(promises)
  } finally {
    loadingStats.value = false
  }
})

// Fecha actual formateada en español
const fechaActual = new Intl.DateTimeFormat('es-ES', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
}).format(new Date())

const fechaFormateada = fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior Reutilizable (SOLID - Impeccable) -->
    <AppHeader subtitle="Panel de Control" />

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Encabezado de Bienvenida y Estado Operativo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">
            Bienvenido, {{ authStore.user?.name || 'Administrador' }}
          </h2>
          <p class="text-sm text-verdoso-muted mt-1">
            Supervisión integral de corrales, bioseguridad y población avícola.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-borde text-verdoso-muted shadow-2xs">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sistema Operativo</span>
          </div>
          <div class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/70 border border-borde text-verdoso-muted">
            <Calendar class="w-3.5 h-3.5 text-salvia" />
            <span>{{ fechaFormateada }}</span>
          </div>
        </div>
      </div>

      <!-- Resumen Operativo de la Granja (KPIs en tiempo real) -->
      <section aria-labelledby="kpis-title">
        <h3 id="kpis-title" class="sr-only">Indicadores clave de la granja</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Casitas"
            :value="instalacionesStore.stats.total_casitas || instalacionesStore.casitas.length || 0"
          />
          <StatCard
            title="Divisiones Habilitadas"
            :value="instalacionesStore.stats.divisiones_activas || 0"
            value-color-class="text-bosque"
          />
          <StatCard
            title="Población de Aves"
            :value="avesStore.stats.total_aves || avesStore.aves.length || 0"
            value-color-class="text-bosque"
          />
          <StatCard
            title="Especies en Producción"
            value="3"
            value-color-class="text-verdoso"
          />
        </div>
      </section>

      <!-- Módulos de Gestión (Acceso Principal) -->
      <section aria-labelledby="modulos-title" class="space-y-4">
        <div class="flex items-center justify-between">
          <h3 id="modulos-title" class="text-lg font-bold text-verdoso tracking-tight">
            Módulos del Sistema
          </h3>
          <span class="text-xs text-verdoso-muted">Acceso directo a gestión</span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Tarjeta Módulo 1: Instalaciones Físicas -->
          <router-link
            to="/instalaciones"
            class="group bg-white p-6 sm:p-7 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                  <Building class="w-6 h-6 transition-colors duration-200" />
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-bosque-50 text-bosque border border-bosque/10">
                  {{ instalacionesStore.stats.total_casitas || instalacionesStore.casitas.length || 0 }} casitas activas
                </span>
              </div>

              <div>
                <h4 class="text-xl font-bold text-verdoso group-hover:text-bosque transition-colors">
                  Instalaciones Físicas
                </h4>
                <p class="text-sm text-verdoso-muted leading-relaxed mt-2">
                  Gestión y mantenimiento de casitas, galpones y divisiones perimetrales con segregación por especie para gallinas criollas, chompipes y patos pichiches.
                </p>
              </div>
            </div>

            <div class="pt-6 mt-6 border-t border-borde flex items-center justify-between text-sm font-semibold text-bosque group-hover:text-bosque-hover">
              <span>Gestionar instalaciones</span>
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </router-link>

          <!-- Tarjeta Módulo 2: Inventario de Aves (Totalmente Funcional) -->
          <router-link
            to="/aves"
            class="group bg-white p-6 sm:p-7 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                  <GallinaIcon class="w-7 h-7 transition-colors duration-200" />
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-bosque-50 text-bosque border border-bosque/10">
                  {{ avesStore.stats.total_aves || avesStore.aves.length || 0 }} aves registradas
                </span>
              </div>

              <div>
                <h4 class="text-xl font-bold text-verdoso group-hover:text-bosque transition-colors">
                  Inventario de Aves
                </h4>
                <p class="text-sm text-verdoso-muted leading-relaxed mt-2">
                  Registro individual por código alfanumérico y sobrenombre, trazabilidad sanitaria, histórico de movimientos y traslados con validación biológica entre divisiones.
                </p>
              </div>
            </div>

            <div class="pt-6 mt-6 border-t border-borde flex items-center justify-between text-sm font-semibold text-bosque group-hover:text-bosque-hover">
              <span>Gestionar inventario avícola</span>
              <ArrowRight class="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </router-link>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useInstalacionesStore } from '@/stores/instalaciones'
import { useAvesStore } from '@/stores/aves'
import { useProduccionStore } from '@/stores/produccion'
import { useGastosStore } from '@/stores/gastos'
import AppHeader from '@/components/common/AppHeader.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import StatCard from '@/components/common/StatCard.vue'
import {
  Building,
  ArrowRight,
  Calendar,
  Egg,
  DollarSign,
} from 'lucide-vue-next'

const authStore = useAuthStore()
const instalacionesStore = useInstalacionesStore()
const avesStore = useAvesStore()
const produccionStore = useProduccionStore()
const gastosStore = useGastosStore()

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
    promises.push(produccionStore.fetchHuevos())
    promises.push(produccionStore.fetchAlimentacion())
    promises.push(gastosStore.fetchGastos())
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
  timeZone: 'America/El_Salvador',
}).format(new Date())

const fechaFormateada = fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1)
</script>

<template>
  <div class="min-h-screen flex flex-col bg-crema text-verdoso">
    <!-- Navbar Superior Reutilizable (SOLID - Impeccable) -->
    <AppHeader subtitle="Panel de Control" />

    <!-- Contenido Principal -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <!-- Encabezado de Bienvenida y Estado Operativo -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">
            Bienvenido, {{ authStore.user?.name || 'Administrador' }}
          </h2>
          <p class="text-sm text-verdoso-muted mt-1">
            Supervisión integral de corrales, bioseguridad, postura, raciones diarias y control de gastos.
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard
            title="Total Casitas"
            :value="instalacionesStore.stats.total_casitas || instalacionesStore.casitas.length || 0"
          />
          <StatCard
            title="Población de Aves"
            :value="avesStore.stats.total_aves || avesStore.aves.length || 0"
            value-color-class="text-bosque"
          />
          <StatCard
            title="Huevos Aprovechables"
            :value="produccionStore.statsHuevos.total_aprovechables || 0"
            value-color-class="text-bosque"
          />
          <StatCard
            title="Alimento Suministrado"
            :value="(produccionStore.statsAlimentacion.total_kilos || 0) + ' kg'"
            value-color-class="text-verdoso"
          />
          <StatCard
            title="Gastos del Mes"
            :value="`$${(gastosStore.stats.total_mes_actual || 0).toFixed(2)}`"
            value-color-class="text-amber-800"
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

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Tarjeta Módulo 1: Instalaciones Físicas -->
          <router-link
            to="/instalaciones"
            class="group bg-white p-6 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                  <Building class="w-6 h-6 transition-colors duration-200" />
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-bosque-50 text-bosque border border-bosque/10">
                  {{ instalacionesStore.stats.total_casitas || instalacionesStore.casitas.length || 0 }} casitas
                </span>
              </div>

              <div>
                <h4 class="text-lg font-bold text-verdoso group-hover:text-bosque transition-colors">
                  Instalaciones Físicas
                </h4>
                <p class="text-xs text-verdoso-muted leading-relaxed mt-2">
                  Gestión y control de casitas, galpones y divisiones perimetrales con segregación biológica.
                </p>
              </div>
            </div>

            <div class="pt-5 mt-5 border-t border-borde flex items-center justify-between text-xs font-semibold text-bosque group-hover:text-bosque-hover">
              <span>Gestionar instalaciones</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </router-link>

          <!-- Tarjeta Módulo 2: Inventario de Aves -->
          <router-link
            to="/aves"
            class="group bg-white p-6 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                  <GallinaIcon class="w-7 h-7 transition-colors duration-200" />
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-bosque-50 text-bosque border border-bosque/10">
                  {{ avesStore.stats.total_aves || avesStore.aves.length || 0 }} aves
                </span>
              </div>

              <div>
                <h4 class="text-lg font-bold text-verdoso group-hover:text-bosque transition-colors">
                  Inventario de Aves
                </h4>
                <p class="text-xs text-verdoso-muted leading-relaxed mt-2">
                  Registro por código y nombre, seguimiento de peso individual, bitácora sanitaria y traslados.
                </p>
              </div>
            </div>

            <div class="pt-5 mt-5 border-t border-borde flex items-center justify-between text-xs font-semibold text-bosque group-hover:text-bosque-hover">
              <span>Gestionar inventario avícola</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </router-link>

          <!-- Tarjeta Módulo 3: Alimentación y Producción -->
          <router-link
            to="/produccion"
            class="group bg-white p-6 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                  <Egg class="w-6 h-6 transition-colors duration-200" />
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-bosque-50 text-bosque border border-bosque/10">
                  {{ produccionStore.statsHuevos.total_aprovechables || 0 }} sanos hoy
                </span>
              </div>

              <div>
                <h4 class="text-lg font-bold text-verdoso group-hover:text-bosque transition-colors">
                  Alimentación y Postura
                </h4>
                <p class="text-xs text-verdoso-muted leading-relaxed mt-2">
                  Control diario de recolección de huevos por corral y registro de raciones alimenticias por especie.
                </p>
              </div>
            </div>

            <div class="pt-5 mt-5 border-t border-borde flex items-center justify-between text-xs font-semibold text-bosque group-hover:text-bosque-hover">
              <span>Gestionar producción y raciones</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </router-link>

          <!-- Tarjeta Módulo 4: Finanzas y Gastos Operativos (Etapa 5) -->
          <router-link
            to="/gastos"
            class="group bg-white p-6 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex flex-col justify-between"
          >
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="w-12 h-12 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                  <DollarSign class="w-6 h-6 transition-colors duration-200" />
                </div>
                <span class="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-bosque-50 text-bosque border border-bosque/10">
                  ${{ (gastosStore.stats.total_mes_actual || 0).toFixed(2) }} este mes
                </span>
              </div>

              <div>
                <h4 class="text-lg font-bold text-verdoso group-hover:text-bosque transition-colors">
                  Finanzas y Gastos
                </h4>
                <p class="text-xs text-verdoso-muted leading-relaxed mt-2">
                  Registro de egresos por alimentación, insumos veterinarios, herramientas y mantenimiento.
                </p>
              </div>
            </div>

            <div class="pt-5 mt-5 border-t border-borde flex items-center justify-between text-xs font-semibold text-bosque group-hover:text-bosque-hover">
              <span>Gestionar gastos operativos</span>
              <ArrowRight class="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-200" />
            </div>
          </router-link>
        </div>
      </section>
    </main>
  </div>
</template>

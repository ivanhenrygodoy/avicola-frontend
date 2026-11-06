<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import AppHeader from '@/components/common/AppHeader.vue'
import GallinaIcon from '@/components/common/GallinaIcon.vue'
import BaseAlert from '@/components/common/BaseAlert.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import DashboardKpiGrid from '@/components/dashboard/DashboardKpiGrid.vue'
import AvesDistribucionCard from '@/components/dashboard/AvesDistribucionCard.vue'
import OcupacionCasitasCard from '@/components/dashboard/OcupacionCasitasCard.vue'
import ProduccionHuevosCard from '@/components/dashboard/ProduccionHuevosCard.vue'
import GastosCategoriaCard from '@/components/dashboard/GastosCategoriaCard.vue'
import AlertasActividadCard from '@/components/dashboard/AlertasActividadCard.vue'
import { Building, ArrowRight, Calendar, Egg, DollarSign, RefreshCw } from 'lucide-vue-next'

const authStore = useAuthStore()
const dashboardStore = useDashboardStore()

const modulos = [
  { to: '/instalaciones', titulo: 'Instalaciones', icono: Building },
  { to: '/aves', titulo: 'Inventario de aves', icono: GallinaIcon },
  { to: '/produccion', titulo: 'Alimentación y postura', icono: Egg },
  { to: '/gastos', titulo: 'Finanzas y gastos', icono: DollarSign },
]

onMounted(() => {
  if (!authStore.user) authStore.fetchCurrentUser()
  dashboardStore.fetchResumen()
})

// La actividad solo se pide la primera vez que se despliega (o tras un error)
const abrirActividad = () => {
  if (!dashboardStore.actividadLoaded) dashboardStore.fetchActividad()
}

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
    <AppHeader subtitle="Panel de Control" />

    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <!-- Encabezado -->
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-2xl sm:text-3xl font-extrabold text-verdoso tracking-tight">
            Bienvenido, {{ authStore.user?.name || 'Administrador' }}
          </h2>
          <p class="text-sm text-verdoso-muted mt-1">
            Indicadores de población, postura, alimentación y gastos de la granja.
          </p>
        </div>

        <div class="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/70 border border-borde text-verdoso-muted self-start sm:self-auto">
          <Calendar class="w-3.5 h-3.5 text-salvia" />
          <span>{{ fechaFormateada }}</span>
        </div>
      </div>

      <!-- Error de carga -->
      <div v-if="dashboardStore.error && !dashboardStore.hayDatos" class="space-y-3">
        <BaseAlert
          type="error"
          message="No se pudo cargar el resumen del dashboard. Verifica tu conexión e inténtalo de nuevo."
          :dismissible="false"
        />
        <button
          type="button"
          class="btn-secundario px-4 py-2 text-sm gap-2"
          @click="dashboardStore.fetchResumen()"
        >
          <RefreshCw class="w-4 h-4" />
          Reintentar
        </button>
      </div>

      <!-- Carga inicial: mismo loader corporativo que el resto de módulos -->
      <div
        v-else-if="!dashboardStore.hayDatos"
        class="bg-white rounded-2xl border border-borde shadow-xs min-h-[22rem] flex items-center justify-center"
        aria-busy="true"
      >
        <LoadingState
          message="Consultando estadísticas..."
          submessage="Por favor, espere un momento mientras se actualizan los indicadores de la granja."
        />
      </div>

      <!-- Dashboard -->
      <template v-else>
        <section aria-labelledby="kpis-title">
          <h3 id="kpis-title" class="sr-only">Indicadores clave de la granja</h3>
          <DashboardKpiGrid :resumen="dashboardStore.resumen" />
        </section>

        <AlertasActividadCard
          :alertas="dashboardStore.resumen.alertas"
          :actividad="dashboardStore.actividad"
          :meta="dashboardStore.actividadMeta"
          :loading="dashboardStore.loadingActividad"
          :loaded="dashboardStore.actividadLoaded"
          :error="dashboardStore.errorActividad !== null"
          @open="abrirActividad"
          @retry="dashboardStore.fetchActividad()"
          @update:page="dashboardStore.setActividadPage($event)"
          @update:per-page="dashboardStore.setActividadPerPage($event)"
        />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-2">
            <ProduccionHuevosCard
              :huevos="dashboardStore.resumen.huevos"
              :dias="dashboardStore.dias"
              :loading="dashboardStore.loading"
              @update:dias="dashboardStore.setDias($event)"
            />
          </div>
          <AvesDistribucionCard :aves="dashboardStore.resumen.aves" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <OcupacionCasitasCard :ocupacion="dashboardStore.resumen.ocupacion" />
          <GastosCategoriaCard :gastos="dashboardStore.resumen.gastos" />
        </div>
      </template>

      <!-- Accesos rápidos a módulos -->
      <section aria-labelledby="modulos-title" class="space-y-3">
        <h3 id="modulos-title" class="text-lg font-bold text-verdoso tracking-tight">Módulos del sistema</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <router-link
            v-for="m in modulos"
            :key="m.to"
            :to="m.to"
            class="group bg-white p-4 rounded-2xl border border-borde hover:border-salvia hover:shadow-xs transition-all duration-200 flex items-center justify-between gap-3"
          >
            <span class="flex items-center gap-3 min-w-0">
              <span class="w-10 h-10 rounded-xl bg-bosque-50 text-bosque flex items-center justify-center shrink-0 group-hover:bg-bosque group-hover:text-white transition-colors duration-200">
                <component :is="m.icono" class="w-5 h-5" />
              </span>
              <span class="text-sm font-bold text-verdoso group-hover:text-bosque transition-colors truncate">{{ m.titulo }}</span>
            </span>
            <ArrowRight class="w-4 h-4 text-bosque shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
          </router-link>
        </div>
      </section>
    </main>
  </div>
</template>

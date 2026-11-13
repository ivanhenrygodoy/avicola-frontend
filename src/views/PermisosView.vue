<script setup>
import { computed, onMounted, ref } from 'vue'
import { obtenerMatriz, guardarRol } from '@/services/permisos'
import { useNotificationStore } from '@/stores/notification'
import { provideActionLoader } from '@/composables/useActionLoader'

import PageHeader from '@/components/common/PageHeader.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import ActionLoader from '@/components/common/ActionLoader.vue'

import { Lock, Check, Save } from 'lucide-vue-next'

const notify = useNotificationStore()
const { isSubmitting, message: actionLoaderMessage, run } = provideActionLoader()

const matriz = ref({ roles: [], modulos: [] })
// Selección editable por rol: { [idRol]: Set de claves opcionales otorgadas }
const otorgados = ref({})
const original = ref({})
const loading = ref(true)

const roles = computed(() => matriz.value.roles)

// Módulos en el orden del menú; un hijo (Benchmark) se muestra bajo su padre
const modulosOrdenados = computed(() => {
  const todos = matriz.value.modulos
  const raices = todos.filter((m) => !m.padre)
  return raices.flatMap((raiz) => [
    { ...raiz, nivel: 0 },
    ...todos.filter((m) => m.padre === raiz.clave).map((h) => ({ ...h, nivel: 1 })),
  ])
})

const nombreDe = (clave) => matriz.value.modulos.find((m) => m.clave === clave)?.nombre || clave

const cargar = async () => {
  loading.value = true
  try {
    matriz.value = await obtenerMatriz()
    const base = {}
    for (const rol of matriz.value.roles) {
      const opcionales = rol.modulos.filter((c) => {
        const m = matriz.value.modulos.find((x) => x.clave === c)
        return m && !m.base && !m.solo_super
      })
      base[rol.id] = [...opcionales]
    }
    original.value = base
    otorgados.value = Object.fromEntries(Object.entries(base).map(([id, claves]) => [id, [...claves]]))
  } catch (err) {
    console.error(err)
    notify.error('No se pudo cargar la matriz de permisos.')
  } finally {
    loading.value = false
  }
}

// Estado de una celda: fijo (base o super), no asignable (solo superAdmin) u opcional editable
const estadoCelda = (rol, modulo) => {
  if (rol.es_super) return 'super'
  if (modulo.solo_super) return 'no-asignable'
  if (modulo.base) return 'base'
  return 'opcional'
}

const estaOtorgado = (rol, modulo) => (otorgados.value[rol.id] || []).includes(modulo.clave)

const alternar = (rol, modulo) => {
  const lista = otorgados.value[rol.id] || []
  otorgados.value = {
    ...otorgados.value,
    [rol.id]: lista.includes(modulo.clave) ? lista.filter((c) => c !== modulo.clave) : [...lista, modulo.clave],
  }
}

const cambiado = (rol) => {
  const a = [...(otorgados.value[rol.id] || [])].sort()
  const b = [...(original.value[rol.id] || [])].sort()
  return a.length !== b.length || a.some((c, i) => c !== b[i])
}

const guardar = async (rol) => {
  try {
    await run(`Guardando permisos de ${rol.nombre}...`, () => guardarRol(rol.id, otorgados.value[rol.id] || []))
    notify.success(`Permisos de ${rol.nombre} actualizados.`)
    await cargar()
  } catch (err) {
    console.error(err)
    const msg = err.response?.data?.message
    if (err.response?.status === 422) notify.warning(msg || 'Los permisos enviados no son válidos.')
    else notify.error(msg || 'No se pudieron guardar los permisos.')
  }
}

onMounted(cargar)
</script>

<template>
  <div class="flex-1 flex flex-col">
    <!-- pb-28: deja libre el botón flotante del chat para que no tape «Guardar» -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-28 space-y-6">
      <PageHeader
        title="Permisos por rol"
        subtitle="Los módulos básicos son fijos para todos los roles; aquí otorgas los módulos opcionales, como el Benchmark."
        bordered
      />

      <LoadingState v-if="loading" />

      <div v-else class="bg-white rounded-2xl border border-borde shadow-xs overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-sm">
            <thead class="bg-crema/60 border-b border-borde text-verdoso font-bold text-xs uppercase tracking-wider">
              <tr>
                <th scope="col" class="px-6 py-4">Módulo</th>
                <th v-for="rol in roles" :key="rol.id" scope="col" class="px-6 py-4 text-center whitespace-nowrap">
                  {{ rol.nombre }}
                  <StatusBadge v-if="rol.es_super" variant="info" size="sm" class="ml-1.5">Solo lectura</StatusBadge>
                </th>
              </tr>
            </thead>

            <tbody class="divide-y divide-borde">
              <tr v-for="modulo in modulosOrdenados" :key="modulo.clave" class="hover:bg-crema/40 transition-colors">
                <th
                  scope="row"
                  :class="['px-6 py-3.5 font-medium text-verdoso', modulo.nivel ? 'pl-12' : '']"
                >
                  {{ modulo.nombre }}
                  <span v-if="modulo.padre" class="ml-1.5 text-xs text-verdoso-muted font-normal">
                    en {{ nombreDe(modulo.padre) }}
                  </span>
                  <span v-if="modulo.solo_super" class="ml-1.5 text-xs text-verdoso-muted font-normal">
                    solo super administrador
                  </span>
                </th>

                <td v-for="rol in roles" :key="rol.id" class="px-6 py-3.5 text-center">
                  <!-- Acceso fijo: super administrador o módulo base -->
                  <span
                    v-if="estadoCelda(rol, modulo) === 'super' || estadoCelda(rol, modulo) === 'base'"
                    class="inline-flex items-center justify-center w-7 h-7 rounded-full bg-bosque-50 text-bosque"
                    :title="
                      estadoCelda(rol, modulo) === 'super'
                        ? 'El super administrador accede a todo'
                        : 'Módulo básico: siempre disponible'
                    "
                  >
                    <Lock v-if="estadoCelda(rol, modulo) === 'base'" class="w-3.5 h-3.5" />
                    <Check v-else class="w-4 h-4" />
                  </span>

                  <!-- No asignable a este rol -->
                  <span
                    v-else-if="estadoCelda(rol, modulo) === 'no-asignable'"
                    class="text-verdoso-muted"
                    title="Exclusivo del super administrador"
                  >
                    —
                  </span>

                  <!-- Opcional: interruptor -->
                  <button
                    v-else
                    type="button"
                    role="switch"
                    :aria-checked="estaOtorgado(rol, modulo)"
                    :aria-label="`${modulo.nombre} para ${rol.nombre}`"
                    :disabled="isSubmitting"
                    :class="[
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-salvia focus-visible:ring-offset-2',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      estaOtorgado(rol, modulo) ? 'bg-bosque' : 'bg-borde',
                    ]"
                    @click="alternar(rol, modulo)"
                  >
                    <span
                      :class="[
                        'inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform',
                        estaOtorgado(rol, modulo) ? 'translate-x-6' : 'translate-x-1',
                      ]"
                    />
                  </button>
                </td>
              </tr>
            </tbody>

            <tfoot class="border-t border-borde bg-crema/40">
              <tr>
                <td class="px-6 py-4 text-xs text-verdoso-muted">
                  Los cambios se aplican en la siguiente petición del usuario; su menú se actualiza al recargar.
                </td>
                <td v-for="rol in roles" :key="rol.id" class="px-6 py-4 text-center">
                  <button
                    v-if="!rol.es_super"
                    type="button"
                    class="px-4 py-2 btn-principal text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!cambiado(rol) || isSubmitting"
                    @click="guardar(rol)"
                  >
                    <Save class="w-3.5 h-3.5" />
                    <span>Guardar</span>
                  </button>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </main>

    <ActionLoader :is-open="isSubmitting" :message="actionLoaderMessage" />
  </div>
</template>
